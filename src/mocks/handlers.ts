/* Mock API handlers (MSW). They implement docs/api-contract.md so the UI can be built and
   demoed before the backend exists. Swap to the real API by setting VITE_API_MOCKING=disabled. */
import { http, HttpResponse } from "msw";
import { MOBILE_PATTERN } from "@/shared/lib/phone";
import {
  EMAIL_PATTERN,
  PASSWORD_MAX,
  PASSWORD_MIN,
} from "@/features/auth/api/auth-schemas";
import { toLatinDigits } from "@/shared/lib/digits";
import type {
  CreateTourBody,
  TourCategory,
  TourSort,
} from "@/features/tours/api/tour-schemas";
import { createTourBodySchema } from "@/features/tours/api/tour-schemas";
import { contactBodySchema } from "@/features/content/api/content-schemas";
import {
  confirmedCount,
  currentUser,
  db,
  getSessionId,
  isPublic,
  newId,
  notify,
  persist,
  personDto,
  saveMedia,
  setSessionId,
  syncStatus,
  toDetail,
  toSummary,
  toUserDto,
  userName,
} from "./db";
import { collabHandlers } from "./handlers-collab";
import { checkoutHandlers } from "./handlers-checkout";
import { inviteHandlers } from "./handlers-invites";
import { networkHandlers } from "./handlers-network";
import { socialHandlers } from "./handlers-social";
import {
  API,
  fail,
  findTour,
  latency,
  noContent,
  readBody,
  readImage,
  requireAdmin,
  requireComplete,
  requireUser,
  str,
} from "./utils";
import { parseIntent, scoreTour } from "./search";
import type { DbTour, DbUser } from "./seed";

/** Demo-only OTP. The real code is delivered by SMS and never appears in an API response. */
export const MOCK_OTP_CODE = "12345";
const OTP_TTL_SEC = 120;
const OTP_RESEND_SEC = 60;
const OTP_MAX_ATTEMPTS = 5;

function deviceLabel(ua: string | null): string {
  const s = ua ?? "";
  const browser = /Edg\//.test(s)
    ? "Edge"
    : /Firefox\//.test(s)
      ? "Firefox"
      : /Chrome\//.test(s)
        ? "Chrome"
        : /Safari\//.test(s)
          ? "Safari"
          : "مرورگر";
  const os = /Android/.test(s)
    ? "Android"
    : /iPhone|iPad/.test(s)
      ? "iOS"
      : /Windows/.test(s)
        ? "Windows"
        : /Mac OS/.test(s)
          ? "macOS"
          : /Linux/.test(s)
            ? "Linux"
            : "دستگاه";
  return `${browser} · ${os}`;
}

/* ------------------------------------------------------------------ mock password store */
async function hashPassword(password: string): Promise<string> {
  const bytes = new TextEncoder().encode(`hamsafar-mock:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (b) =>
    b.toString(16).padStart(2, "0"),
  ).join("");
}

/** Created lazily (older saved DBs lack it). Demo account: parisa@example.com / Hamsafar123 */
async function passwords(): Promise<Record<string, string>> {
  const d = db();
  if (!d.passwords) {
    d.passwords = { "u-parisa": await hashPassword("Hamsafar123") };
    persist();
  }
  return d.passwords;
}

/* ------------------------------------------------------------------ auth */
const authHandlers = [
  http.post(`${API}/auth/otp/request`, async ({ request }) => {
    await latency();
    const phone = toLatinDigits(str((await readBody(request)).phone));
    if (!MOBILE_PATTERN.test(phone)) {
      return fail(400, "VALIDATION_ERROR", "شماره موبایل معتبر نیست.", {
        fields: { phone: "شماره موبایل باید با ۰۹ شروع شود و ۱۱ رقم باشد." },
      });
    }
    if (phone === "09000000000")
      return fail(
        502,
        "DELIVERY_FAILED",
        "ارسال پیامک با خطا مواجه شد. چند لحظه بعد دوباره تلاش کنید.",
      );
    const now = Date.now();
    const existing = db().otp[phone];
    if (existing && now < existing.resendAt) {
      return fail(429, "RATE_LIMITED", "برای درخواست کد جدید کمی صبر کنید.", {
        retryAfterSec: Math.ceil((existing.resendAt - now) / 1000),
      });
    }
    db().otp[phone] = {
      code: MOCK_OTP_CODE,
      expiresAt: now + OTP_TTL_SEC * 1000,
      resendAt: now + OTP_RESEND_SEC * 1000,
      attempts: 0,
    };
    persist();
    return HttpResponse.json({
      phone,
      expiresInSec: OTP_TTL_SEC,
      resendInSec: OTP_RESEND_SEC,
      codeLength: MOCK_OTP_CODE.length,
    });
  }),

  http.post(`${API}/auth/otp/verify`, async ({ request }) => {
    await latency();
    const body = await readBody(request);
    const phone = toLatinDigits(str(body.phone));
    const code = toLatinDigits(str(body.code));
    const entry = db().otp[phone];
    if (!entry || Date.now() > entry.expiresAt) {
      return fail(
        410,
        "CODE_EXPIRED",
        "کد تأیید منقضی شده است. کد جدید دریافت کنید.",
      );
    }
    if (entry.attempts >= OTP_MAX_ATTEMPTS) {
      return fail(
        429,
        "TOO_MANY_ATTEMPTS",
        "تعداد تلاش‌ها بیش از حد مجاز است. کد جدید دریافت کنید.",
      );
    }
    if (code !== entry.code) {
      entry.attempts += 1;
      persist();
      return fail(400, "INVALID_CODE", "کد تأیید نادرست است.", {
        attemptsLeft: OTP_MAX_ATTEMPTS - entry.attempts,
      });
    }
    delete db().otp[phone];
    let user = db().users.find((u) => u.phone === phone);
    if (user?.blocked) {
      persist();
      return fail(
        403,
        "ACCOUNT_BLOCKED",
        "این حساب توسط مدیر سامانه مسدود شده است.",
      );
    }
    const isNewUser = !user;
    if (!user) {
      user = {
        id: newId("u"),
        phone,
        firstName: null,
        lastName: null,
        email: null,
        city: null,
        bio: null,
        role: "user",
        createdAt: new Date().toISOString(),
        rating: null,
        avatarUrl: null,
        travelStyles: [],
        languages: ["فارسی"],
        interests: [],
        budgetRange: null,
        blocked: false,
        favoritesPublic: false,
      };
      db().users.push(user);
    }
    const session = {
      id: newId("sess"),
      userId: user.id,
      device: deviceLabel(request.headers.get("user-agent")),
      location: "تهران (تخمینی)",
      lastActiveAt: new Date().toISOString(),
    };
    db().sessions.push(session);
    setSessionId(session.id);
    persist();
    return HttpResponse.json({ user: toUserDto(user), isNewUser });
  }),

  /* ---------- email + password (v0.6) ---------- */
  http.post(`${API}/auth/register`, async ({ request }) => {
    await latency();
    const body = await readBody(request);
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const fields: Record<string, string> = {};
    if (!EMAIL_PATTERN.test(email)) fields.email = "ایمیل معتبر نیست.";
    if (
      password.length < PASSWORD_MIN ||
      password.length > PASSWORD_MAX ||
      !/\p{L}/u.test(password) ||
      !/\d/.test(password)
    ) {
      fields.password = "رمز عبور باید ۸ تا ۶۴ کاراکتر و شامل حرف و عدد باشد.";
    }
    if (Object.keys(fields).length)
      return fail(400, "VALIDATION_ERROR", "اطلاعات ثبت‌نام معتبر نیست.", {
        fields,
      });
    if (db().users.some((u) => u.email?.toLowerCase() === email)) {
      return fail(409, "EMAIL_TAKEN", "این ایمیل قبلاً ثبت شده است.", {
        fields: { email: "این ایمیل قبلاً ثبت شده است." },
      });
    }
    const user: DbUser = {
      id: newId("u"),
      phone: "",
      firstName: null,
      lastName: null,
      email,
      city: null,
      bio: null,
      role: "user",
      createdAt: new Date().toISOString(),
      rating: null,
      avatarUrl: null,
      travelStyles: [],
      languages: ["فارسی"],
      interests: [],
      budgetRange: null,
      blocked: false,
      favoritesPublic: false,
    };
    db().users.push(user);
    (await passwords())[user.id] = await hashPassword(password);
    const session = {
      id: newId("sess"),
      userId: user.id,
      device: deviceLabel(request.headers.get("user-agent")),
      location: "تهران (تخمینی)",
      lastActiveAt: new Date().toISOString(),
    };
    db().sessions.push(session);
    setSessionId(session.id);
    persist();
    return HttpResponse.json(
      { user: toUserDto(user), isNewUser: true },
      { status: 201 },
    );
  }),

  http.post(`${API}/auth/login`, async ({ request }) => {
    await latency();
    const body = await readBody(request);
    const email = str(body.email).toLowerCase();
    const password = typeof body.password === "string" ? body.password : "";
    const user = db().users.find((u) => u.email?.toLowerCase() === email);
    const stored = user ? (await passwords())[user.id] : undefined;
    // Same answer for unknown email and wrong password, so accounts can't be enumerated.
    if (!user || !stored || stored !== (await hashPassword(password))) {
      return fail(401, "INVALID_CREDENTIALS", "ایمیل یا رمز عبور نادرست است.");
    }
    if (user.blocked)
      return fail(
        403,
        "ACCOUNT_BLOCKED",
        "این حساب توسط مدیر سامانه مسدود شده است.",
      );
    const session = {
      id: newId("sess"),
      userId: user.id,
      device: deviceLabel(request.headers.get("user-agent")),
      location: "تهران (تخمینی)",
      lastActiveAt: new Date().toISOString(),
    };
    db().sessions.push(session);
    setSessionId(session.id);
    persist();
    return HttpResponse.json({ user: toUserDto(user), isNewUser: false });
  }),

  http.get(`${API}/auth/me`, async () => {
    await latency();
    const user = currentUser();
    if (!user) return fail(401, "UNAUTHENTICATED", "وارد نشده‌اید.");
    return HttpResponse.json({ user: toUserDto(user) });
  }),

  http.patch(`${API}/users/me`, async ({ request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const body = await readBody(request);
    const firstName = str(body.firstName);
    const lastName = str(body.lastName);
    const email =
      body.email === undefined
        ? user.email
        : body.email === null
          ? null
          : str(body.email).toLowerCase() || null;
    const fields: Record<string, string> = {};
    if (firstName.length < 2) fields.firstName = "نام باید حداقل ۲ حرف باشد.";
    if (lastName.length < 2)
      fields.lastName = "نام خانوادگی باید حداقل ۲ حرف باشد.";
    if (email && !EMAIL_PATTERN.test(email)) fields.email = "ایمیل معتبر نیست.";
    if (str(body.city).length > 40) fields.city = "نام شهر حداکثر ۴۰ حرف است.";
    if (str(body.bio).length > 300)
      fields.bio = "درباره من حداکثر ۳۰۰ حرف است.";
    if (str(body.budgetRange).length > 60)
      fields.budgetRange = "بودجه حداکثر ۶۰ حرف است.";
    if (Object.keys(fields).length)
      return fail(400, "VALIDATION_ERROR", "لطفاً خطاهای فرم را برطرف کنید.", {
        fields,
      });
    if (
      email &&
      db().users.some(
        (u) => u.id !== user.id && u.email?.toLowerCase() === email,
      )
    ) {
      return fail(
        409,
        "EMAIL_TAKEN",
        "این ایمیل برای حساب دیگری ثبت شده است.",
        { fields: { email: "این ایمیل برای حساب دیگری ثبت شده است." } },
      );
    }
    Object.assign(user, {
      firstName,
      lastName,
      email,
      city: body.city === undefined ? user.city : str(body.city) || null,
      bio:
        body.bio === undefined ? user.bio : str(body.bio).slice(0, 300) || null,
    });
    const list = (v: unknown, max: number) =>
      Array.isArray(v)
        ? v
            .filter((x): x is string => typeof x === "string")
            .map((x) => x.trim())
            .filter(Boolean)
            .slice(0, max)
        : undefined;
    const styles = list(body.travelStyles, 6);
    if (styles)
      user.travelStyles = styles.filter(
        (x): x is (typeof user.travelStyles)[number] =>
          [
            "camping",
            "family",
            "adventure",
            "historic",
            "beach",
            "nature",
          ].includes(x),
      );
    user.languages = list(body.languages, 8) ?? user.languages;
    user.interests = list(body.interests, 12) ?? user.interests;
    if (body.budgetRange !== undefined)
      user.budgetRange = str(body.budgetRange) || null;
    if (typeof body.favoritesPublic === "boolean")
      user.favoritesPublic = body.favoritesPublic;
    persist();
    return HttpResponse.json({ user: toUserDto(user) });
  }),

  http.post(`${API}/users/me/avatar`, async ({ request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const image = await readImage(request);
    if (image instanceof Response) return image;
    user.avatarUrl = await saveMedia(image.dataUrl);
    persist();
    return HttpResponse.json({ user: toUserDto(user) });
  }),

  http.delete(`${API}/users/me/avatar`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    user.avatarUrl = null;
    persist();
    return HttpResponse.json({ user: toUserDto(user) });
  }),

  http.post(`${API}/auth/logout`, async () => {
    await latency();
    const d = db();
    const current = getSessionId();
    d.sessions = d.sessions.filter((s) => s.id !== current);
    setSessionId(null);
    persist();
    return noContent();
  }),

  http.get(`${API}/auth/sessions`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    const sid = getSessionId();
    const items = d.sessions
      .filter((s) => s.userId === user.id)
      .map((s) => ({
        id: s.id,
        device: s.device,
        location: s.location,
        lastActiveAt: s.lastActiveAt,
        current: s.id === sid,
      }))
      .sort((a, b) => Number(b.current) - Number(a.current));
    return HttpResponse.json({ items });
  }),

  http.delete(`${API}/auth/sessions/:id`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    const target = d.sessions.find(
      (s) => s.id === params.id && s.userId === user.id,
    );
    if (!target) return fail(404, "NOT_FOUND", "نشست پیدا نشد.");
    if (target.id === getSessionId())
      return fail(
        409,
        "CURRENT_SESSION",
        "برای خروج از این دستگاه از دکمه خروج استفاده کنید.",
      );
    d.sessions = d.sessions.filter((s) => s.id !== target.id);
    persist();
    return noContent();
  }),
];

/* ------------------------------------------------------------------ tours */
const SORTERS: Record<TourSort, (a: DbTour, b: DbTour) => number> = {
  relevance: (a, b) =>
    (a.featuredRank ?? 99) - (b.featuredRank ?? 99) ||
    a.startDate.localeCompare(b.startDate),
  soonest: (a, b) => a.startDate.localeCompare(b.startDate),
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  spots: (a, b) =>
    b.capacity - confirmedCount(b) - (a.capacity - confirmedCount(a)),
  price_asc: (a, b) => a.priceToman - b.priceToman,
  price_desc: (a, b) => b.priceToman - a.priceToman,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

function matchesText(t: DbTour, q: string): boolean {
  const hay = `${t.title} ${t.destination} ${t.province} ${t.description}`;
  return q
    .split(/\s+/)
    .filter(Boolean)
    .every((w) => hay.includes(w));
}

const tourHandlers = [
  http.get(`${API}/tours/featured`, async () => {
    await latency();
    const list = db().tours.filter(isPublic);
    const ranked = list
      .filter((t) => t.featuredRank !== null)
      .sort(SORTERS.relevance);
    const rest = list
      .filter((t) => t.featuredRank === null)
      .sort(SORTERS.soonest);
    return HttpResponse.json({
      items: [...ranked, ...rest].slice(0, 4).map(toSummary),
    });
  }),

  http.get(`${API}/tours`, async ({ request }) => {
    await latency();
    const url = new URL(request.url);
    const p = url.searchParams;
    const q = toLatinDigits(p.get("q") ?? "").trim();
    const destination = (p.get("destination") ?? "").trim();
    const category = p.get("category") as TourCategory | null;
    const difficulty = p.get("difficulty");
    const maxPrice = Number(p.get("maxPrice") ?? "") || undefined;
    const from = p.get("from");
    const to = p.get("to");
    const sort = (p.get("sort") ?? "relevance") as TourSort;
    const page = Math.max(1, Number(p.get("page") ?? "1") || 1);
    const pageSize = Math.min(
      48,
      Math.max(1, Number(p.get("pageSize") ?? "9") || 9),
    );

    let list = db().tours.filter(isPublic);
    if (q) list = list.filter((t) => matchesText(t, q));
    if (destination) {
      // `destination` is a destination ID from GET /destinations; free text is accepted as a fallback.
      const known = db().destinations.find((d) => d.id === destination);
      const words = known ? known.match : [destination];
      list = list.filter((t) =>
        words.some((w) =>
          `${t.destination} ${t.province} ${t.title}`.includes(w),
        ),
      );
    }
    if (category) list = list.filter((t) => t.categories.includes(category));
    if (difficulty) list = list.filter((t) => t.difficulty === difficulty);
    if (maxPrice) list = list.filter((t) => t.priceToman <= maxPrice);
    if (from) list = list.filter((t) => t.startDate >= from);
    if (to) list = list.filter((t) => t.startDate <= to);
    list = [...list].sort(SORTERS[sort] ?? SORTERS.relevance);
    const total = list.length;
    const items = list
      .slice((page - 1) * pageSize, page * pageSize)
      .map(toSummary);
    return HttpResponse.json({ items, page, pageSize, total });
  }),

  http.get(`${API}/destinations`, async () => {
    await latency();
    const pub = db().tours.filter(isPublic);
    const items = db().destinations.map(({ match, ...d }) => ({
      ...d,
      tourCount: pub.filter((t) =>
        match.some((m) => `${t.destination} ${t.title}`.includes(m)),
      ).length,
    }));
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/search/describe`, async ({ request }) => {
    await latency();
    const text = str((await readBody(request)).text);
    if (text.length < 2)
      return fail(400, "VALIDATION_ERROR", "توضیح سفر را کامل‌تر بنویسید.");
    const pub = db().tours.filter(isPublic);
    const intent = parseIntent(text, pub);
    const items = pub
      .map((t) => ({ t, ...scoreTour(t, intent, text) }))
      .filter((x) => x.score >= 35)
      .sort((a, b) => b.score - a.score)
      .map(({ t, score, reasons }) => ({
        ...toSummary(t),
        matchScore: score,
        matchReasons: reasons,
      }));
    return HttpResponse.json({ understood: intent.understood, items });
  }),

  http.get(`${API}/tours/:id`, async ({ params }) => {
    await latency();
    const tour = findTour(params.id);
    const viewer = currentUser();
    if (!tour) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    const privileged =
      viewer && (viewer.id === tour.creatorId || viewer.role === "admin");
    if (
      ["draft", "pending_review", "rejected"].includes(tour.status) &&
      !privileged
    ) {
      return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    }
    return HttpResponse.json(toDetail(tour, viewer));
  }),

  http.post(`${API}/tours/:id/join-requests`, async ({ params, request }) => {
    await latency();
    const user = requireComplete();
    if (user instanceof Response) return user;
    const tour = findTour(params.id);
    if (!tour || !isPublic(tour))
      return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    if (tour.creatorId === user.id)
      return fail(409, "IS_CREATOR", "شما سازنده این تور هستید.");
    const d = db();
    const active = d.requests.find(
      (r) =>
        r.tourId === tour.id &&
        r.userId === user.id &&
        (r.status === "pending" || r.status === "approved"),
    );
    if (active)
      return fail(
        409,
        "ALREADY_REQUESTED",
        "قبلاً برای این تور درخواست داده‌اید.",
      );
    if (confirmedCount(tour) >= tour.capacity)
      return fail(409, "CAPACITY_FULL", "ظرفیت این تور تکمیل شده است.");
    const message = str((await readBody(request)).message).slice(0, 400);
    const now = new Date().toISOString();
    const req = {
      id: newId("req"),
      tourId: tour.id,
      userId: user.id,
      status: tour.requiresApproval
        ? ("pending" as const)
        : ("approved" as const),
      message,
      createdAt: now,
      decidedAt: tour.requiresApproval ? null : now,
    };
    d.requests.push(req);
    const who = userName(user.id);
    if (req.status === "pending")
      notify(
        [tour.creatorId],
        "join_request",
        "درخواست پیوستن جدید",
        `${who} می‌خواهد به «${tour.title}» بپیوندد.`,
        tour.id,
      );
    else
      notify(
        [tour.creatorId],
        "join_request",
        "عضو جدید",
        `${who} به «${tour.title}» پیوست.`,
        tour.id,
      );
    syncStatus(tour);
    persist();
    return HttpResponse.json(req, { status: 201 });
  }),

  http.delete(`${API}/tours/:id/join-requests/me`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const req = db().requests.find(
      (r) =>
        r.tourId === params.id &&
        r.userId === user.id &&
        (r.status === "pending" || r.status === "approved"),
    );
    if (!req)
      return fail(404, "NOT_FOUND", "درخواست فعالی برای این تور ندارید.");
    req.status = "cancelled";
    req.decidedAt = new Date().toISOString();
    persist();
    return noContent();
  }),

  http.get(`${API}/tours/:id/join-requests`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const tour = findTour(params.id);
    if (!tour) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    if (tour.creatorId !== user.id)
      return fail(
        403,
        "FORBIDDEN",
        "فقط سازنده تور به درخواست‌ها دسترسی دارد.",
      );
    const items = db()
      .requests.filter((r) => r.tourId === tour.id && r.status !== "cancelled")
      .map((r) => {
        const applicant = db().users.find((u) => u.id === r.userId);
        void applicant;
        return { ...r, applicant: personDto(r.userId) };
      })
      .reverse();
    return HttpResponse.json({ items });
  }),

  http.patch(`${API}/join-requests/:id`, async ({ params, request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const req = db().requests.find((r) => r.id === params.id);
    const tour = req ? findTour(req.tourId) : undefined;
    if (!req || !tour) return fail(404, "NOT_FOUND", "درخواست پیدا نشد.");
    if (tour.creatorId !== user.id)
      return fail(403, "FORBIDDEN", "فقط سازنده تور می‌تواند تصمیم بگیرد.");
    if (req.status !== "pending")
      return fail(
        409,
        "ALREADY_DECIDED",
        "برای این درخواست قبلاً تصمیم گرفته شده است.",
      );
    const decision = str((await readBody(request)).decision);
    if (decision === "approve" && confirmedCount(tour) >= tour.capacity)
      return fail(409, "CAPACITY_FULL", "ظرفیت تور تکمیل است.");
    req.status = decision === "approve" ? "approved" : "rejected";
    req.decidedAt = new Date().toISOString();
    notify(
      [req.userId],
      req.status === "approved" ? "request_approved" : "request_rejected",
      req.status === "approved" ? "درخواست شما تأیید شد" : "درخواست شما رد شد",
      req.status === "approved"
        ? `به تور «${tour.title}» پیوستید.`
        : `تورلیدر درخواست شما برای «${tour.title}» را نپذیرفت.`,
      tour.id,
    );
    syncStatus(tour);
    persist();
    return HttpResponse.json(req);
  }),

  http.get(`${API}/me/trips`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const items = db()
      .requests.filter((r) => r.userId === user.id)
      .map((r) => {
        const tour = findTour(r.tourId);
        return tour
          ? {
              request: {
                id: r.id,
                tourId: r.tourId,
                status: r.status,
                message: r.message,
                createdAt: r.createdAt,
                decidedAt: r.decidedAt,
              },
              tour: toSummary(tour),
            }
          : null;
      })
      .filter((x) => x !== null)
      .reverse();
    return HttpResponse.json({ items });
  }),

  http.get(`${API}/me/tours`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const items = db()
      .tours.filter((t) => t.creatorId === user.id)
      .map((t) => ({
        ...toSummary(t),
        pendingRequests: db().requests.filter(
          (r) => r.tourId === t.id && r.status === "pending",
        ).length,
      }));
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/tours`, async ({ request }) => {
    await latency();
    const user = requireComplete();
    if (user instanceof Response) return user;
    const body = parseTourBody(await readBody(request));
    if (body instanceof Response) return body;
    const tour = buildTour(newId("tour"), body, user.id, null);
    db().tours.push(tour);
    persist();
    return HttpResponse.json(
      { id: tour.id, status: tour.status },
      { status: 201 },
    );
  }),

  /* Re-save a server draft from the planner (creator only, status must still be `draft`). */
  http.put(`${API}/tours/:id/draft`, async ({ params, request }) => {
    await latency();
    const user = requireComplete();
    if (user instanceof Response) return user;
    const existing = findTour(params.id);
    if (!existing) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    if (existing.creatorId !== user.id)
      return fail(
        403,
        "NOT_TOUR_LEADER",
        "فقط سازنده این پیش‌نویس می‌تواند آن را ویرایش کند.",
      );
    if (existing.status !== "draft")
      return fail(
        409,
        "EDIT_NOT_ALLOWED",
        "این تور دیگر پیش‌نویس نیست و از صفحه مدیریت تور ویرایش می‌شود.",
      );
    const body = parseTourBody(await readBody(request));
    if (body instanceof Response) return body;
    const updated = buildTour(existing.id, body, user.id, existing);
    const all = db().tours;
    all[all.indexOf(existing)] = updated;
    persist();
    return HttpResponse.json({ id: updated.id, status: updated.status });
  }),
];

/* ------------------------------------------------------------------ tour create / draft helpers */
function todayIsoLocal(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

/** Same rules as the planner form (features/planner/model/tour-draft.ts); the server is authoritative. */
function parseTourBody(
  raw: Record<string, unknown>,
): CreateTourBody | Response {
  const parsed = createTourBodySchema.safeParse(raw);
  if (!parsed.success) {
    const fields = Object.fromEntries(
      parsed.error.issues.map((i) => [i.path.join("."), "مقدار معتبر نیست."]),
    );
    return fail(400, "VALIDATION_ERROR", "لطفاً اطلاعات تور را کامل کنید.", {
      fields,
    });
  }
  const body = parsed.data;
  if (body.minParticipants > body.capacity) {
    return fail(
      400,
      "VALIDATION_ERROR",
      "حد نصاب نمی‌تواند از ظرفیت بیشتر باشد.",
      { fields: { minParticipants: "از ظرفیت بیشتر است." } },
    );
  }
  const today = todayIsoLocal();
  const start = new Date(`${body.startDate}T12:00:00Z`);
  const limit = new Date(`${today}T12:00:00Z`);
  limit.setUTCDate(limit.getUTCDate() + 365);
  if (
    Number.isNaN(start.getTime()) ||
    body.startDate <= today ||
    start > limit
  ) {
    return fail(400, "VALIDATION_ERROR", "تاریخ شروع معتبر نیست.", {
      fields: { startDate: "تاریخ شروع باید بین فردا تا یک سال آینده باشد." },
    });
  }
  return body;
}

const COVERS: Record<TourCategory, string> = {
  camping: "/images/tours/tour-mesr-desert.webp",
  family: "/images/tours/dest-lake.webp",
  adventure: "/images/tours/tour-shirom-canyon.webp",
  historic: "/images/tours/dest-isfahan.webp",
  beach: "/images/tours/tour-persian-gulf.webp",
  nature: "/images/tours/tour-hyrcanian-forest.webp",
};

function buildTour(
  id: string,
  body: CreateTourBody,
  creatorId: string,
  existing: DbTour | null,
): DbTour {
  const now = new Date().toISOString();
  const cover =
    existing?.coverImageUrl ?? COVERS[body.categories[0] ?? "nature"];
  let seq = 0;
  return {
    id,
    title: body.title,
    destination: body.destination,
    province: body.province,
    coverImageUrl: cover,
    gallery: existing?.gallery ?? [cover],
    startDate: body.startDate,
    durationDays: body.durationDays,
    priceToman: body.priceToman,
    capacity: body.capacity,
    minParticipants: body.minParticipants,
    baseConfirmed: 0,
    difficulty: body.difficulty,
    categories: body.categories,
    badge: null,
    rating: null,
    reviewCount: 0,
    status: body.submit ? "pending_review" : "draft",
    description: body.description,
    highlights: existing?.highlights ?? [],
    includes: existing?.includes ?? [],
    meetingPoint: body.meetingPoint,
    requiresApproval: body.requiresApproval,
    creatorId,
    featuredRank: null,
    createdAt: existing?.createdAt ?? now,
    submittedAt: body.submit ? now : null,
    itinerary: body.itinerary.map((dayPlan) => ({
      id: `${id}-d${dayPlan.dayNumber}`,
      dayNumber: dayPlan.dayNumber,
      title: dayPlan.title || `روز ${dayPlan.dayNumber}`,
      items: dayPlan.items.map((it) => ({
        link: null,
        status: "planned" as const,
        ...it,
        id: `${id}-i${(seq += 1)}`,
        costToman: null,
      })),
    })),
  };
}

/* ------------------------------------------------------------------ favorites */
const favoriteHandlers = [
  http.get(`${API}/me/favorites`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const items = db()
      .favorites.filter((f) => f.userId === user.id)
      .map((f) => {
        const tour = findTour(f.tourId);
        return tour
          ? {
              addedAt: f.addedAt,
              label: f.label ?? null,
              note: f.note ?? null,
              tour: toSummary(tour),
            }
          : null;
      })
      .filter((x) => x !== null)
      .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    return HttpResponse.json({ items });
  }),
  http.put(`${API}/me/favorites/:tourId`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    if (!findTour(params.tourId))
      return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    const d = db();
    if (
      !d.favorites.some(
        (f) => f.userId === user.id && f.tourId === params.tourId,
      )
    ) {
      d.favorites.push({
        userId: user.id,
        tourId: String(params.tourId),
        addedAt: new Date().toISOString(),
      });
      persist();
    }
    return noContent();
  }),
  http.delete(`${API}/me/favorites/:tourId`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    d.favorites = d.favorites.filter(
      (f) => !(f.userId === user.id && f.tourId === params.tourId),
    );
    persist();
    return noContent();
  }),
];

/* ------------------------------------------------------------------ admin */
const adminHandlers = [
  http.get(`${API}/admin/stats`, async () => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const d = db();
    const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString();
    const hasRequest = (t: DbTour) => d.requests.some((r) => r.tourId === t.id);
    const published = d.tours.filter((t) =>
      ["open", "confirmed", "completed", "cancelled"].includes(t.status),
    );
    const reached = published.filter((t) =>
      ["confirmed", "completed"].includes(t.status),
    ).length;
    return HttpResponse.json({
      usersTotal: d.users.length,
      openReports: d.reports.filter((r) => r.status === "open").length,
      quorumRate: published.length
        ? Math.round((reached / published.length) * 100)
        : null,
      toursOpen: d.tours.filter((t) => t.status === "open").length,
      toursPendingReview: d.tours.filter((t) => t.status === "pending_review")
        .length,
      joinRequestsLast7Days: d.requests.filter((r) => r.createdAt >= weekAgo)
        .length,
      funnel: [
        { stage: "created", count: d.tours.length },
        {
          stage: "submitted",
          count: d.tours.filter((t) => t.status !== "draft").length,
        },
        {
          stage: "approved",
          count: d.tours.filter((t) =>
            ["open", "confirmed", "completed"].includes(t.status),
          ).length,
        },
        {
          stage: "first_request",
          count: d.tours.filter((t) => hasRequest(t) || t.baseConfirmed > 0)
            .length,
        },
        {
          stage: "confirmed",
          count: d.tours.filter((t) =>
            ["confirmed", "completed"].includes(t.status),
          ).length,
        },
      ],
    });
  }),
  http.get(`${API}/admin/tours`, async ({ request }) => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const status =
      new URL(request.url).searchParams.get("status") ?? "pending_review";
    const items = db()
      .tours.filter((t) => status === "all" || t.status === status)
      .map((t) => ({
        ...toSummary(t),
        creatorName: userName(t.creatorId),
        submittedAt: t.submittedAt,
      }));
    return HttpResponse.json({ items });
  }),
  http.post(`${API}/admin/tours/:id/review`, async ({ params, request }) => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const tour = findTour(params.id);
    if (!tour) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
    if (tour.status !== "pending_review")
      return fail(409, "INVALID_TRANSITION", "این تور در انتظار بررسی نیست.");
    const reviewBody = await readBody(request);
    const decision = str(reviewBody.decision);
    tour.status = decision === "approve" ? "open" : "rejected";
    const reason = str(reviewBody.reason);
    notify(
      [tour.creatorId],
      decision === "approve" ? "tour_approved" : "tour_rejected",
      decision === "approve" ? "تور شما منتشر شد" : "تور شما رد شد",
      decision === "approve"
        ? `«${tour.title}» تأیید و منتشر شد.`
        : `«${tour.title}» رد شد${reason ? `: ${reason}` : "."}`,
      tour.id,
    );
    syncStatus(tour);
    persist();
    return noContent();
  }),
];

/* ------------------------------------------------------------------ content */
const contentHandlers = [
  http.post(`${API}/contact`, async ({ request }) => {
    await latency();
    const body = await readBody(request);
    const parsed = contactBodySchema.safeParse({
      ...body,
      phone: toLatinDigits(str(body.phone)),
    });
    if (!parsed.success) {
      const fields = Object.fromEntries(
        parsed.error.issues.map((i) => [i.path.join("."), "مقدار معتبر نیست."]),
      );
      return fail(400, "VALIDATION_ERROR", "لطفاً فرم را کامل کنید.", {
        fields,
      });
    }
    const ticketId = `HMS-${Math.floor(10000 + Math.random() * 89999)}`;
    db().contacts.push({
      id: ticketId,
      email: parsed.data.phone,
      createdAt: new Date().toISOString(),
    });
    persist();
    return HttpResponse.json({ ticketId }, { status: 201 });
  }),
  http.post(`${API}/newsletter`, async ({ request }) => {
    await latency();
    const email = str((await readBody(request)).email).toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return fail(400, "VALIDATION_ERROR", "ایمیل معتبر نیست.", {
        fields: { email: "ایمیل معتبر نیست." },
      });
    }
    if (!db().newsletter.includes(email)) db().newsletter.push(email);
    persist();
    return noContent();
  }),
];

export const handlers = [
  ...networkHandlers,
  ...inviteHandlers,
  ...checkoutHandlers,
  ...authHandlers,
  ...collabHandlers,
  ...tourHandlers,
  ...favoriteHandlers,
  ...socialHandlers,
  ...adminHandlers,
  ...contentHandlers,
];
