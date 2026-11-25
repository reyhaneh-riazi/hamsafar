/* Trip collaboration endpoints: leader-only management, itinerary, comments, expenses & test
   payments, group chat, polls, checklist, album and post-trip reviews (FS features 2, 3, 6, 10, 11, 12). */
import { http, HttpResponse } from "msw";
import {
  itineraryUpdateBodySchema,
  tourUpdateBodySchema,
} from "@/features/trip/api/trip-schemas";
import { ITEM_TYPE_LABELS } from "@/features/tours/model/labels";
import {
  confirmedCount,
  db,
  findUser,
  isParticipant,
  newId,
  notify,
  participants,
  persist,
  personDto,
  resolveUrl,
  saveMedia,
  tourEndDate,
  userName,
} from "./db";
import type { DbMessage, DbTour, DbUser, ExpenseCategory } from "./seed";
import {
  API,
  fail,
  findTour,
  latency,
  noContent,
  readBody,
  readImage,
  requireLeader,
  requireUser,
  str,
} from "./utils";

const PHOTO_LIMIT = 20;
const CATEGORIES: ExpenseCategory[] = [
  "accommodation",
  "transport",
  "food",
  "activity",
  "other",
];

function requireParticipant(
  tourId: string | readonly string[] | undefined,
): { user: DbUser; tour: DbTour } | Response {
  const user = requireUser();
  if (user instanceof Response) return user;
  const tour = findTour(tourId);
  if (!tour) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
  if (!isParticipant(tour, user.id))
    return fail(
      403,
      "NOT_A_MEMBER",
      "این بخش فقط برای اعضای تأییدشده تور است.",
    );
  return { user, tour };
}

function chatOpen(tour: DbTour) {
  return tour.status === "confirmed" || tour.status === "completed";
}

function messageDto(m: DbMessage, tour: DbTour, viewerId: string) {
  return {
    id: m.id,
    text: m.text,
    createdAt: m.createdAt,
    author: personDto(m.userId),
    isMine: m.userId === viewerId,
    byLeader: m.userId === tour.creatorId,
  };
}

function expensesDto(tour: DbTour, viewer: DbUser) {
  const d = db();
  const items = d.expenses
    .filter((e) => e.tourId === tour.id)
    .map((e) => ({
      id: e.id,
      title: e.title,
      category: e.category,
      amountToman: e.amountToman,
      paidBy: personDto(e.paidByUserId),
      createdAt: e.createdAt,
    }))
    .reverse();
  const members = participants(tour);
  const total = items.reduce((s, e) => s + e.amountToman, 0);
  const share = members.length ? Math.round(total / members.length) : 0;
  return {
    items,
    totalToman: total,
    sharePerMemberToman: share,
    members: members.map((id) => {
      const spent = d.expenses
        .filter((e) => e.tourId === tour.id && e.paidByUserId === id)
        .reduce((s, e) => s + e.amountToman, 0);
      const pays = d.payments.filter(
        (p) => p.tourId === tour.id && p.userId === id,
      );
      const paidOnline = pays
        .filter((p) => p.status === "paid")
        .reduce((s, p) => s + p.amountToman, 0);
      const paid = spent + paidOnline;
      const balance = share - paid;
      const refunded = pays.some((p) => p.status === "refunded");
      return {
        person: personDto(id),
        isLeader: id === tour.creatorId,
        shareToman: share,
        paidToman: paid,
        balanceToman: balance,
        paymentStatus: refunded
          ? ("refunded" as const)
          : balance <= 0
            ? ("paid" as const)
            : ("pending" as const),
      };
    }),
    canEdit:
      viewer.id === tour.creatorId &&
      !["cancelled", "completed"].includes(tour.status),
  };
}

export const collabHandlers = [
  /* ---------- leader: edit tour (FS 2 rules) ---------- */
  http.patch(`${API}/tours/:id`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const { tour } = auth;
    const parsed = tourUpdateBodySchema.safeParse(await readBody(request));
    if (!parsed.success)
      return fail(400, "VALIDATION_ERROR", "اطلاعات معتبر نیست.");
    const body = parsed.data;
    if (["cancelled", "completed", "rejected"].includes(tour.status))
      return fail(409, "EDIT_NOT_ALLOWED", "این تور دیگر قابل ویرایش نیست.");
    const published = tour.status === "open" || tour.status === "confirmed";
    if (published) {
      // After approval only description and a capacity increase are allowed.
      const locked = (
        [
          "title",
          "priceToman",
          "minParticipants",
          "startDate",
          "requiresApproval",
        ] as const
      ).filter((k) => body[k] !== undefined && body[k] !== tour[k]);
      if (locked.length) {
        return fail(
          409,
          "EDIT_NOT_ALLOWED",
          "پس از تأیید تور فقط توضیحات، محل حرکت و افزایش ظرفیت قابل ویرایش است.",
          {
            fields: Object.fromEntries(
              locked.map((k) => [k, "پس از انتشار قفل است."]),
            ),
          },
        );
      }
      if (body.capacity !== undefined && body.capacity < tour.capacity) {
        return fail(
          409,
          "EDIT_NOT_ALLOWED",
          "پس از تأیید فقط می‌توانید ظرفیت را افزایش دهید.",
          { fields: { capacity: "کاهش ظرفیت مجاز نیست." } },
        );
      }
    }
    const capacity = body.capacity ?? tour.capacity;
    const minP = body.minParticipants ?? tour.minParticipants;
    if (minP > capacity)
      return fail(400, "VALIDATION_ERROR", "حد نصاب از ظرفیت بیشتر است.", {
        fields: { minParticipants: "از ظرفیت بیشتر است." },
      });
    if (capacity < confirmedCount(tour))
      return fail(
        409,
        "EDIT_NOT_ALLOWED",
        "ظرفیت نمی‌تواند از تعداد اعضای فعلی کمتر باشد.",
      );
    const changes: string[] = [];
    if (body.priceToman !== undefined && body.priceToman !== tour.priceToman)
      changes.push("هزینه تور تغییر کرد");
    if (body.capacity !== undefined && body.capacity !== tour.capacity)
      changes.push(
        `ظرفیت به ${body.capacity.toLocaleString("fa-IR")} نفر تغییر کرد`,
      );
    if (body.description !== undefined && body.description !== tour.description)
      changes.push("توضیحات تور به‌روزرسانی شد");
    if (
      body.meetingPoint !== undefined &&
      body.meetingPoint !== tour.meetingPoint
    )
      changes.push("محل حرکت تغییر کرد");
    Object.assign(
      tour,
      Object.fromEntries(
        Object.entries(body).filter(([, v]) => v !== undefined),
      ),
    );
    if (changes.length && published) {
      const text = changes.join("، ");
      db().changes.push({
        id: newId("ch"),
        tourId: tour.id,
        at: new Date().toISOString(),
        text,
      });
      notify(
        participants(tour).filter((id) => id !== tour.creatorId),
        "plan_changed",
        "تغییر در تور",
        `«${tour.title}»: ${text}.`,
        tour.id,
      );
    }
    persist();
    return noContent();
  }),

  http.post(`${API}/tours/:id/cover`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const image = await readImage(request);
    if (image instanceof Response) return image;
    const ref = await saveMedia(image.dataUrl);
    auth.tour.coverImageUrl = ref;
    auth.tour.gallery = [
      ref,
      ...auth.tour.gallery.filter((g) => g !== ref),
    ].slice(0, 6);
    persist();
    return HttpResponse.json({ coverImageUrl: resolveUrl(ref) });
  }),

  http.post(`${API}/tours/:id/cancel`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const { tour } = auth;
    const today = new Date().toISOString().slice(0, 10);
    if (
      tour.startDate <= today ||
      ["cancelled", "completed"].includes(tour.status)
    ) {
      return fail(
        409,
        "CANCEL_NOT_ALLOWED",
        "لغو فقط پیش از شروع سفر ممکن است.",
      );
    }
    const reason = str((await readBody(request)).reason).slice(0, 300);
    tour.status = "cancelled";
    tour.cancelReason = reason || null;
    db().payments.forEach((p) => {
      if (p.tourId === tour.id && p.status === "paid") p.status = "refunded";
    });
    notify(
      participants(tour).filter((id) => id !== tour.creatorId),
      "tour_cancelled",
      "تور لغو شد",
      `«${tour.title}» توسط تورلیدر لغو شد${reason ? `: ${reason}` : "."} مبالغ پرداختی بازگشت داده می‌شود.`,
      tour.id,
    );
    persist();
    return noContent();
  }),

  /* ---------- leader: official itinerary (FS 3) ---------- */
  http.put(`${API}/tours/:id/itinerary`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const { tour } = auth;
    if (["cancelled", "completed", "rejected"].includes(tour.status))
      return fail(409, "EDIT_NOT_ALLOWED", "برنامه این تور قابل تغییر نیست.");
    const parsed = itineraryUpdateBodySchema.safeParse(await readBody(request));
    if (!parsed.success)
      return fail(
        400,
        "VALIDATION_ERROR",
        "برنامه روزانه معتبر نیست؛ عنوان همه موارد را بنویسید.",
      );
    const before = new Map(
      tour.itinerary.flatMap((d) => d.items.map((i) => [i.id, i] as const)),
    );
    const changes: string[] = [];
    let seq = 0;
    tour.itinerary = parsed.data.days
      .filter((d) => d.dayNumber <= tour.durationDays)
      .map((d) => ({
        id: `${tour.id}-d${d.dayNumber}`,
        dayNumber: d.dayNumber,
        title: d.title || `روز ${d.dayNumber}`,
        items: d.items.map((it) => {
          const prev = it.id ? before.get(it.id) : undefined;
          const id =
            prev?.id ?? `${tour.id}-i${Date.now().toString(36)}${(seq += 1)}`;
          if (!prev)
            changes.push(
              `افزودن ${ITEM_TYPE_LABELS[it.type]} «${it.title}» به روز ${d.dayNumber}`,
            );
          else if (
            prev.startTime !== it.startTime ||
            prev.location !== it.location
          )
            changes.push(`تغییر زمان/مکان «${it.title}»`);
          else if (prev.status !== it.status && it.status === "cancelled")
            changes.push(`لغو «${it.title}»`);
          else if (
            prev.title !== it.title ||
            prev.note !== it.note ||
            prev.costToman !== it.costToman
          )
            changes.push(`ویرایش «${it.title}»`);
          return {
            ...it,
            id,
            status:
              prev &&
              (prev.startTime !== it.startTime ||
                prev.location !== it.location) &&
              it.status === "planned"
                ? ("changed" as const)
                : it.status,
          };
        }),
      }));
    const kept = new Set(
      tour.itinerary.flatMap((d) => d.items.map((i) => i.id)),
    );
    before.forEach((item, id) => {
      if (!kept.has(id)) changes.push(`حذف «${item.title}»`);
    });
    const note = parsed.data.changeNote?.trim();
    if (changes.length || note) {
      const text = [note, ...changes.slice(0, 4)].filter(Boolean).join("؛ ");
      db().changes.push({
        id: newId("ch"),
        tourId: tour.id,
        at: new Date().toISOString(),
        text,
      });
      if (tour.status === "open" || tour.status === "confirmed") {
        notify(
          participants(tour).filter((id) => id !== tour.creatorId),
          "plan_changed",
          "برنامه سفر تغییر کرد",
          `«${tour.title}»: ${text}`,
          tour.id,
        );
      }
    }
    persist();
    return noContent();
  }),

  /* ---------- members: comments on plan items ---------- */
  http.post(
    `${API}/tours/:id/items/:itemId/comments`,
    async ({ params, request }) => {
      await latency();
      const auth = requireParticipant(params.id);
      if (auth instanceof Response) return auth;
      const { user, tour } = auth;
      const item = tour.itinerary
        .flatMap((d) => d.items)
        .find((i) => i.id === params.itemId);
      if (!item) return fail(404, "NOT_FOUND", "این مورد در برنامه پیدا نشد.");
      const text = str((await readBody(request)).text).slice(0, 400);
      if (text.length < 2)
        return fail(400, "VALIDATION_ERROR", "متن نظر را بنویسید.");
      const comment = {
        id: newId("c"),
        tourId: tour.id,
        itemId: item.id,
        userId: user.id,
        text,
        createdAt: new Date().toISOString(),
      };
      db().comments.push(comment);
      if (user.id !== tour.creatorId)
        notify(
          [tour.creatorId],
          "system",
          "نظر جدید روی برنامه",
          `${userName(user.id)} درباره «${item.title}» نظر داد.`,
          tour.id,
        );
      persist();
      return HttpResponse.json({ id: comment.id }, { status: 201 });
    },
  ),

  /* ---------- expenses & test payments (FS 6) ---------- */
  http.get(`${API}/tours/:id/expenses`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    return HttpResponse.json(expensesDto(auth.tour, auth.user));
  }),

  http.post(`${API}/tours/:id/expenses`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    if (["cancelled", "completed"].includes(tour.status))
      return fail(409, "EDIT_NOT_ALLOWED", "هزینه‌های این تور بسته شده است.");
    const body = await readBody(request);
    const title = str(body.title);
    const amount = Number(body.amountToman);
    const category = str(body.category) as ExpenseCategory;
    if (
      title.length < 2 ||
      !Number.isInteger(amount) ||
      amount <= 0 ||
      !CATEGORIES.includes(category)
    ) {
      return fail(
        400,
        "VALIDATION_ERROR",
        "عنوان، دسته و مبلغ را درست وارد کنید.",
      );
    }
    db().expenses.push({
      id: newId("ex"),
      tourId: tour.id,
      title,
      category,
      amountToman: amount,
      paidByUserId: user.id,
      createdAt: new Date().toISOString(),
    });
    persist();
    return HttpResponse.json(expensesDto(tour, user), { status: 201 });
  }),

  http.delete(`${API}/tours/:id/expenses/:expenseId`, async ({ params }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const d = db();
    const before = d.expenses.length;
    d.expenses = d.expenses.filter(
      (e) => !(e.id === params.expenseId && e.tourId === auth.tour.id),
    );
    if (d.expenses.length === before)
      return fail(404, "NOT_FOUND", "این هزینه پیدا نشد.");
    persist();
    return noContent();
  }),

  http.post(`${API}/tours/:id/payments`, async ({ params, request }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    if (tour.status === "cancelled")
      return fail(409, "TOUR_CANCELLED", "این تور لغو شده است.");
    const mine = expensesDto(tour, user).members.find(
      (m) => m.person.id === user.id,
    );
    const amount = mine?.balanceToman ?? 0;
    if (amount <= 0)
      return fail(409, "NOTHING_TO_PAY", "بدهی پرداخت‌نشده‌ای ندارید.");
    const outcome = str((await readBody(request)).simulate);
    const reference = `TEST-${Math.floor(10000 + Math.random() * 89999)}`;
    if (outcome === "fail") {
      // Simulated gateway failure: nothing is recorded (rollback).
      return fail(
        402,
        "PAYMENT_FAILED",
        "پرداخت در درگاه آزمایشی ناموفق بود؛ مبلغی کسر نشد.",
        { reference },
      );
    }
    db().payments.push({
      id: newId("pay"),
      tourId: tour.id,
      userId: user.id,
      amountToman: amount,
      status: "paid",
      at: new Date().toISOString(),
      reference,
    });
    persist();
    return HttpResponse.json({
      status: "paid",
      reference,
      amountToman: amount,
    });
  }),

  /* ---------- group chat (FS 11; polling) ---------- */
  http.get(`${API}/me/conversations`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    const items = d.tours
      .filter((t) => isParticipant(t, user.id) && chatOpen(t))
      .map((t) => {
        const msgs = d.messages.filter((m) => m.tourId === t.id);
        const mark =
          d.readMarks.find((r) => r.userId === user.id && r.tourId === t.id)
            ?.lastReadAt ?? "";
        const last = msgs[msgs.length - 1];
        return {
          tourId: t.id,
          tourTitle: t.title,
          coverImageUrl: resolveUrl(t.coverImageUrl) ?? "",
          unread: msgs.filter((m) => m.userId !== user.id && m.createdAt > mark)
            .length,
          lastMessage: last ? messageDto(last, t, user.id) : null,
          memberCount: participants(t).length,
        };
      })
      .sort((a, b) =>
        (b.lastMessage?.createdAt ?? "").localeCompare(
          a.lastMessage?.createdAt ?? "",
        ),
      );
    return HttpResponse.json({
      items,
      totalUnread: items.reduce((s, c) => s + c.unread, 0),
    });
  }),

  http.get(`${API}/tours/:id/messages`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    if (!chatOpen(tour))
      return fail(
        403,
        "CHAT_LOCKED",
        "گفت‌وگوی گروهی پس از رسیدن تور به حد نصاب فعال می‌شود.",
      );
    const items = db()
      .messages.filter((m) => m.tourId === tour.id)
      .map((m) => messageDto(m, tour, user.id));
    return HttpResponse.json({ items, canPost: tour.status === "confirmed" });
  }),

  http.post(`${API}/tours/:id/messages`, async ({ params, request }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    if (tour.status !== "confirmed")
      return fail(
        403,
        "CHAT_LOCKED",
        "ارسال پیام فقط در تورهای قطعی‌شده ممکن است.",
      );
    const text = str((await readBody(request)).text).slice(0, 1000);
    if (!text) return fail(400, "VALIDATION_ERROR", "پیام خالی است.");
    const m = {
      id: newId("m"),
      tourId: tour.id,
      userId: user.id,
      text,
      createdAt: new Date().toISOString(),
    };
    db().messages.push(m);
    const marks = db().readMarks.filter(
      (r) => !(r.userId === user.id && r.tourId === tour.id),
    );
    marks.push({ userId: user.id, tourId: tour.id, lastReadAt: m.createdAt });
    db().readMarks = marks;
    persist();
    return HttpResponse.json(messageDto(m, tour, user.id), { status: 201 });
  }),

  http.post(`${API}/tours/:id/messages/read`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const d = db();
    d.readMarks = d.readMarks.filter(
      (r) => !(r.userId === auth.user.id && r.tourId === auth.tour.id),
    );
    d.readMarks.push({
      userId: auth.user.id,
      tourId: auth.tour.id,
      lastReadAt: new Date().toISOString(),
    });
    persist();
    return noContent();
  }),

  /* ---------- polls (FS 11) ---------- */
  http.get(`${API}/tours/:id/polls`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    const now = new Date().toISOString();
    const items = db()
      .polls.filter((p) => p.tourId === tour.id)
      .map((p) => {
        const votes = db().votes.filter((v) => v.pollId === p.id);
        const closed = p.deadline <= now;
        const counts = p.options.map((o) => ({
          ...o,
          votes: closed
            ? votes.filter((v) => v.optionId === o.id).length
            : null,
        }));
        const top = closed
          ? [...counts].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))[0]
          : undefined;
        return {
          id: p.id,
          question: p.question,
          deadline: p.deadline,
          closed,
          options: counts,
          myVote: votes.find((v) => v.userId === user.id)?.optionId ?? null,
          totalVotes: votes.length,
          winnerOptionId: top && (top.votes ?? 0) > 0 ? top.id : null,
        };
      })
      .reverse();
    return HttpResponse.json({
      items,
      canCreate: user.id === tour.creatorId && tour.status !== "cancelled",
      canVote: tour.status !== "cancelled",
    });
  }),

  http.post(`${API}/tours/:id/polls`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const body = await readBody(request);
    const question = str(body.question);
    const options = Array.isArray(body.options)
      ? body.options.map(str).filter(Boolean).slice(0, 6)
      : [];
    const deadline = str(body.deadline);
    if (
      question.length < 4 ||
      options.length < 2 ||
      !deadline ||
      deadline <= new Date().toISOString()
    ) {
      return fail(
        400,
        "VALIDATION_ERROR",
        "سؤال، حداقل دو گزینه و مهلت آینده لازم است.",
      );
    }
    db().polls.push({
      id: newId("poll"),
      tourId: auth.tour.id,
      question,
      options: options.map((text, i) => ({ id: `o${i + 1}`, text })),
      deadline,
      createdAt: new Date().toISOString(),
    });
    notify(
      participants(auth.tour).filter((id) => id !== auth.user.id),
      "system",
      "رأی‌گیری جدید",
      `«${question}» — تا پایان مهلت رأی بدهید.`,
      auth.tour.id,
    );
    persist();
    return noContent();
  }),

  http.post(`${API}/polls/:pollId/vote`, async ({ params, request }) => {
    await latency();
    const poll = db().polls.find((p) => p.id === params.pollId);
    if (!poll) return fail(404, "NOT_FOUND", "رأی‌گیری پیدا نشد.");
    const auth = requireParticipant(poll.tourId);
    if (auth instanceof Response) return auth;
    if (poll.deadline <= new Date().toISOString())
      return fail(409, "POLL_CLOSED", "مهلت این رأی‌گیری تمام شده است.");
    const optionId = str((await readBody(request)).optionId);
    if (!poll.options.some((o) => o.id === optionId))
      return fail(400, "VALIDATION_ERROR", "گزینه معتبر نیست.");
    const d = db();
    d.votes = d.votes.filter(
      (v) => !(v.pollId === poll.id && v.userId === auth.user.id),
    );
    d.votes.push({ pollId: poll.id, userId: auth.user.id, optionId });
    persist();
    return noContent();
  }),

  /* ---------- readiness checklist (FS 11) ---------- */
  http.get(`${API}/tours/:id/checklist`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const d = db();
    const members = participants(auth.tour).length;
    const items = d.checklist
      .filter((c) => c.tourId === auth.tour.id)
      .map((c) => ({
        id: c.id,
        title: c.title,
        required: c.required,
        done: d.checklistDone.some(
          (x) => x.itemId === c.id && x.userId === auth.user.id,
        ),
        doneCount: d.checklistDone.filter((x) => x.itemId === c.id).length,
      }));
    return HttpResponse.json({
      items,
      canEdit: auth.user.id === auth.tour.creatorId,
      memberCount: members,
    });
  }),

  http.put(`${API}/tours/:id/checklist`, async ({ params, request }) => {
    await latency();
    const auth = requireLeader(params.id);
    if (auth instanceof Response) return auth;
    const body = await readBody(request);
    const list = Array.isArray(body.items) ? body.items : [];
    const d = db();
    const next = list
      .map((raw) =>
        raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {},
      )
      .map((it) => ({
        id: str(it.id) || newId("cl"),
        tourId: auth.tour.id,
        title: str(it.title).slice(0, 80),
        required: it.required === true,
      }))
      .filter((it) => it.title.length >= 2)
      .slice(0, 40);
    d.checklist = [
      ...d.checklist.filter((c) => c.tourId !== auth.tour.id),
      ...next,
    ];
    const ids = new Set(d.checklist.map((c) => c.id));
    d.checklistDone = d.checklistDone.filter((x) => ids.has(x.itemId));
    persist();
    return noContent();
  }),

  http.post(`${API}/checklist/:itemId/toggle`, async ({ params }) => {
    await latency();
    const item = db().checklist.find((c) => c.id === params.itemId);
    if (!item) return fail(404, "NOT_FOUND", "مورد پیدا نشد.");
    const auth = requireParticipant(item.tourId);
    if (auth instanceof Response) return auth;
    const d = db();
    const has = d.checklistDone.some(
      (x) => x.itemId === item.id && x.userId === auth.user.id,
    );
    d.checklistDone = has
      ? d.checklistDone.filter(
          (x) => !(x.itemId === item.id && x.userId === auth.user.id),
        )
      : [...d.checklistDone, { itemId: item.id, userId: auth.user.id }];
    persist();
    return noContent();
  }),

  /* ---------- album (FS 12) ---------- */
  http.get(`${API}/tours/:id/photos`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    const list = db().photos.filter((p) => p.tourId === tour.id);
    const items = list
      .map((p) => ({
        id: p.id,
        url: resolveUrl(p.url) ?? "",
        caption: p.caption,
        createdAt: p.createdAt,
        uploader: personDto(p.userId),
        canDelete: p.userId === user.id || tour.creatorId === user.id,
      }))
      .filter((p) => p.url)
      .reverse();
    return HttpResponse.json({
      items,
      canUpload: tour.status !== "cancelled",
      myCount: list.filter((p) => p.userId === user.id).length,
      limitPerMember: PHOTO_LIMIT,
    });
  }),

  http.post(`${API}/tours/:id/photos`, async ({ params, request }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    if (
      db().photos.filter((p) => p.tourId === tour.id && p.userId === user.id)
        .length >= PHOTO_LIMIT
    ) {
      return fail(
        409,
        "PHOTO_LIMIT",
        `هر عضو حداکثر ${PHOTO_LIMIT.toLocaleString("fa-IR")} عکس می‌تواند بارگذاری کند.`,
      );
    }
    const image = await readImage(request);
    if (image instanceof Response) return image;
    const caption = str(image.form.get("caption")).slice(0, 140);
    const url = await saveMedia(image.dataUrl);
    db().photos.push({
      id: newId("ph"),
      tourId: tour.id,
      userId: user.id,
      url,
      caption,
      createdAt: new Date().toISOString(),
    });
    persist();
    return HttpResponse.json({ url: resolveUrl(url) }, { status: 201 });
  }),

  http.delete(`${API}/photos/:photoId`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    const photo = d.photos.find((p) => p.id === params.photoId);
    if (!photo) return fail(404, "NOT_FOUND", "عکس پیدا نشد.");
    const tour = findTour(photo.tourId);
    if (photo.userId !== user.id && tour?.creatorId !== user.id)
      return fail(
        403,
        "FORBIDDEN",
        "فقط بارگذارنده یا تورلیدر می‌تواند عکس را حذف کند.",
      );
    d.photos = d.photos.filter((p) => p.id !== photo.id);
    persist();
    return noContent();
  }),

  /* ---------- post-trip reviews (FS 10) ---------- */
  http.get(`${API}/tours/:id/reviews/targets`, async ({ params }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    const items = participants(tour)
      .filter((id) => id !== user.id)
      .map((id) => {
        const mine = db().reviews.find(
          (r) =>
            r.tourId === tour.id &&
            r.authorId === user.id &&
            r.targetUserId === id,
        );
        return {
          person: personDto(id),
          myRating: mine?.rating ?? null,
          myComment: mine?.comment ?? null,
        };
      });
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/tours/:id/reviews`, async ({ params, request }) => {
    await latency();
    const auth = requireParticipant(params.id);
    if (auth instanceof Response) return auth;
    const { tour, user } = auth;
    const today = new Date().toISOString().slice(0, 10);
    if (tour.status !== "completed" && tourEndDate(tour) >= today)
      return fail(
        409,
        "TRIP_NOT_FINISHED",
        "امتیازدهی بعد از پایان سفر ممکن است.",
      );
    const body = await readBody(request);
    const targetUserId = str(body.targetUserId);
    const rating = Number(body.rating);
    if (!participants(tour).includes(targetUserId) || targetUserId === user.id)
      return fail(
        400,
        "VALIDATION_ERROR",
        "این کاربر همسفر شما در این تور نبوده است.",
      );
    if (!Number.isInteger(rating) || rating < 1 || rating > 5)
      return fail(400, "VALIDATION_ERROR", "امتیاز باید بین ۱ تا ۵ باشد.");
    if (
      db().reviews.some(
        (r) =>
          r.tourId === tour.id &&
          r.authorId === user.id &&
          r.targetUserId === targetUserId,
      )
    ) {
      return fail(
        409,
        "ALREADY_REVIEWED",
        "شما قبلاً به این همسفر امتیاز داده‌اید.",
      );
    }
    db().reviews.push({
      id: newId("rv"),
      tourId: tour.id,
      authorId: user.id,
      targetUserId,
      rating,
      comment: str(body.comment).slice(0, 300),
      createdAt: new Date().toISOString(),
    });
    const target = findUser(targetUserId);
    if (target)
      notify(
        [target.id],
        "system",
        "امتیاز جدید",
        `یکی از همسفران «${tour.title}» به شما امتیاز داد.`,
        tour.id,
      );
    persist();
    return noContent();
  }),
];
