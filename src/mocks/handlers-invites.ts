/* Tour invite links (single-use) with valid / expired / used / revoked states. */
import { http, HttpResponse } from "msw";
import {
  createInviteBodySchema,
  type InviteStatus,
} from "@/features/invites/api/invite-schemas";
import {
  confirmedCount,
  currentUser,
  db,
  findUser,
  isPublic,
  newId,
  notify,
  persist,
  resolveUrl,
  syncStatus,
  toSummary,
  userName,
} from "./db";
import type { DbInvite } from "./seed";
import {
  API,
  fail,
  findTour,
  latency,
  noContent,
  readBody,
  requireComplete,
  requireLeader,
  requireUser,
} from "./utils";

const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3_600_000).toISOString();

/** Demo links: `/invite/demo-valid`, `demo-expired`, `demo-used`, `demo-revoked` (+ some on the demo user's own tour). */
function seedInvites(): DbInvite[] {
  const base = { usedAt: null, usedById: null, revokedAt: null };
  return [
    {
      ...base,
      token: "demo-valid",
      tourId: "mesr-desert",
      createdById: "u-fatemeh",
      createdAt: hoursFromNow(-2),
      expiresAt: hoursFromNow(70),
    },
    {
      ...base,
      token: "demo-expired",
      tourId: "mesr-desert",
      createdById: "u-fatemeh",
      createdAt: hoursFromNow(-100),
      expiresAt: hoursFromNow(-4),
    },
    {
      ...base,
      token: "demo-used",
      tourId: "mesr-desert",
      createdById: "u-fatemeh",
      createdAt: hoursFromNow(-30),
      expiresAt: hoursFromNow(40),
      usedAt: hoursFromNow(-20),
      usedById: "u-mahsa",
    },
    {
      ...base,
      token: "demo-revoked",
      tourId: "mesr-desert",
      createdById: "u-fatemeh",
      createdAt: hoursFromNow(-10),
      expiresAt: hoursFromNow(60),
      revokedAt: hoursFromNow(-1),
    },
    {
      ...base,
      token: "mrj-friends",
      tourId: "maranjab-stars",
      createdById: "u-parisa",
      createdAt: hoursFromNow(-3),
      expiresAt: hoursFromNow(69),
    },
    {
      ...base,
      token: "mrj-old",
      tourId: "maranjab-stars",
      createdById: "u-parisa",
      createdAt: hoursFromNow(-200),
      expiresAt: hoursFromNow(-28),
    },
    {
      ...base,
      token: "mrj-sara",
      tourId: "maranjab-stars",
      createdById: "u-parisa",
      createdAt: hoursFromNow(-50),
      expiresAt: hoursFromNow(22),
      usedAt: hoursFromNow(-26),
      usedById: "u-reza",
    },
  ];
}

function invites(): DbInvite[] {
  const d = db();
  if (!d.invites) {
    d.invites = seedInvites();
    persist();
  }
  return d.invites;
}

/** Order matters: a used or revoked link stays so even after its expiry date passes. */
function statusOf(inv: DbInvite): InviteStatus {
  if (inv.revokedAt) return "revoked";
  if (inv.usedAt) return "used";
  if (new Date(inv.expiresAt).getTime() <= Date.now()) return "expired";
  return "valid";
}

function listDto(inv: DbInvite) {
  return {
    token: inv.token,
    status: statusOf(inv),
    createdAt: inv.createdAt,
    expiresAt: inv.expiresAt,
    usedAt: inv.usedAt,
    usedByName: inv.usedById ? userName(inv.usedById) : null,
  };
}

function newToken(): string {
  const bytes = new Uint8Array(9);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, 14);
}

export const inviteHandlers = [
  http.get(`${API}/invites/:token`, async ({ params }) => {
    await latency();
    const inv = invites().find((i) => i.token === params.token);
    const tour = inv ? findTour(inv.tourId) : undefined;
    if (!inv || !tour)
      return fail(404, "INVITE_NOT_FOUND", "این لینک دعوت معتبر نیست.");
    const viewer = currentUser();
    const leader = findUser(inv.createdById);
    return HttpResponse.json({
      ...listDto(inv),
      usedByName: null, // public endpoint: don't reveal who used it
      usedByMe: !!viewer && inv.usedById === viewer.id,
      invitedBy: {
        id: inv.createdById,
        displayName: userName(inv.createdById),
        avatarUrl: resolveUrl(leader?.avatarUrl ?? null),
      },
      tour: toSummary(tour),
    });
  }),

  http.post(`${API}/invites/:token/accept`, async ({ params }) => {
    await latency();
    const user = requireComplete();
    if (user instanceof Response) return user;
    const inv = invites().find((i) => i.token === params.token);
    const tour = inv ? findTour(inv.tourId) : undefined;
    if (!inv || !tour)
      return fail(404, "INVITE_NOT_FOUND", "این لینک دعوت معتبر نیست.");
    const status = statusOf(inv);
    if (status === "expired")
      return fail(410, "INVITE_EXPIRED", "این لینک دعوت منقضی شده است.");
    if (status === "revoked")
      return fail(410, "INVITE_REVOKED", "این لینک دعوت غیرفعال شده است.");
    if (status === "used")
      return fail(409, "INVITE_USED", "این لینک قبلاً استفاده شده است.");
    if (tour.creatorId === user.id)
      return fail(409, "IS_CREATOR", "شما تورلیدر همین تور هستید.");
    if (!isPublic(tour))
      return fail(409, "TOUR_CLOSED", "این تور دیگر عضو جدید نمی‌پذیرد.");
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
        "شما قبلاً برای این تور درخواست داده یا عضو شده‌اید.",
      );
    if (confirmedCount(tour) >= tour.capacity)
      return fail(409, "CAPACITY_FULL", "ظرفیت این تور تکمیل شده است.");
    const now = new Date().toISOString();
    d.requests.push({
      id: newId("req"),
      tourId: tour.id,
      userId: user.id,
      status: "approved",
      message: "پیوستن با لینک دعوت",
      createdAt: now,
      decidedAt: now,
    });
    inv.usedAt = now;
    inv.usedById = user.id;
    notify(
      [tour.creatorId],
      "join_request",
      "عضو جدید با لینک دعوت",
      `${userName(user.id)} با لینک دعوت به «${tour.title}» پیوست.`,
      tour.id,
    );
    syncStatus(tour);
    persist();
    return HttpResponse.json({ tourId: tour.id, requestStatus: "approved" });
  }),

  http.get(`${API}/tours/:id/invites`, async ({ params }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const items = invites()
      .filter((i) => i.tourId === auth.tour.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map(listDto);
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/tours/:id/invites`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    if (!isPublic(auth.tour))
      return fail(
        409,
        "TOUR_CLOSED",
        "برای تور منتشرنشده یا بسته‌شده نمی‌توان لینک دعوت ساخت.",
      );
    const parsed = createInviteBodySchema.safeParse(await readBody(request));
    if (!parsed.success)
      return fail(400, "VALIDATION_ERROR", "مدت اعتبار معتبر نیست.", {
        fields: { expiresInHours: "۱ ساعت تا ۱۴ روز" },
      });
    const inv: DbInvite = {
      token: newToken(),
      tourId: auth.tour.id,
      createdById: auth.user.id,
      createdAt: new Date().toISOString(),
      expiresAt: hoursFromNow(parsed.data.expiresInHours),
      usedAt: null,
      usedById: null,
      revokedAt: null,
    };
    invites().push(inv);
    persist();
    return HttpResponse.json(listDto(inv), { status: 201 });
  }),

  http.delete(`${API}/invites/:token`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const inv = invites().find((i) => i.token === params.token);
    if (!inv) return fail(404, "INVITE_NOT_FOUND", "این لینک پیدا نشد.");
    if (inv.createdById !== user.id)
      return fail(
        403,
        "NOT_TOUR_LEADER",
        "فقط سازنده لینک می‌تواند آن را غیرفعال کند.",
      );
    if (statusOf(inv) !== "valid")
      return fail(409, "INVITE_NOT_ACTIVE", "این لینک دیگر فعال نیست.");
    inv.revokedAt = new Date().toISOString();
    persist();
    return noContent();
  }),
];
