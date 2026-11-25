/* Notifications, public profiles, blocking, reports, favourite labels, similar travellers and
   admin user/report management (FS features 7, 8, 10, 13). */
import { http, HttpResponse } from "msw";
import {
  db,
  findUser,
  isPublic,
  newId,
  notify,
  participants,
  persist,
  personDto,
  resolveUrl,
  toSummary,
  tripsCount,
  userName,
  userRating,
} from "./db";
import {
  API,
  fail,
  findTour,
  latency,
  noContent,
  readBody,
  requireAdmin,
  requireUser,
  str,
} from "./utils";

export const socialHandlers = [
  /* ---------- notifications (FS 7) ---------- */
  http.get(`${API}/me/notifications`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const items = db()
      .notifications.filter((n) => n.userId === user.id)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .slice(0, 50)
      .map(({ userId: _u, ...n }) => {
        void _u;
        return n;
      });
    return HttpResponse.json({
      items,
      unread: items.filter((n) => !n.read).length,
    });
  }),

  http.post(`${API}/me/notifications/read`, async ({ request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const ids = (await readBody(request)).ids;
    const only = Array.isArray(ids) ? new Set(ids.map(String)) : null;
    db().notifications.forEach((n) => {
      if (n.userId === user.id && (!only || only.has(n.id))) n.read = true;
    });
    persist();
    return noContent();
  }),

  /* ---------- public profile, block, report (FS 10) ---------- */
  http.get(`${API}/users/:id`, async ({ params }) => {
    await latency();
    const viewer = requireUser();
    if (viewer instanceof Response) return viewer;
    const u = findUser(String(params.id));
    if (!u || u.blocked) return fail(404, "NOT_FOUND", "این کاربر پیدا نشد.");
    const d = db();
    if (d.blocks.some((b) => b.blockerId === u.id && b.blockedId === viewer.id))
      return fail(404, "NOT_FOUND", "این کاربر پیدا نشد.");
    const blockedByMe = d.blocks.some(
      (b) => b.blockerId === viewer.id && b.blockedId === u.id,
    );
    const { rating, count } = userRating(u.id);
    const reviews = blockedByMe
      ? []
      : d.reviews
          .filter((r) => r.targetUserId === u.id)
          .map((r) => ({
            id: r.id,
            rating: r.rating,
            comment: r.comment,
            createdAt: r.createdAt,
            authorName: userName(r.authorId),
            tourTitle: findTour(r.tourId)?.title ?? "",
          }))
          .reverse();
    const favorites =
      u.favoritesPublic && !blockedByMe
        ? d.favorites
            .filter((f) => f.userId === u.id)
            .map((f) => ({ label: f.label ?? null, tour: findTour(f.tourId) }))
            .filter(
              (
                f,
              ): f is {
                label: string | null;
                tour: NonNullable<typeof f.tour>;
              } => !!f.tour,
            )
            .map((f) => ({ label: f.label, tour: toSummary(f.tour) }))
        : null;
    return HttpResponse.json({
      id: u.id,
      displayName: userName(u.id),
      avatarUrl: resolveUrl(u.avatarUrl),
      city: u.city,
      bio: blockedByMe ? null : u.bio,
      travelStyles: u.travelStyles,
      languages: u.languages,
      interests: blockedByMe ? [] : u.interests,
      budgetRange: blockedByMe ? null : u.budgetRange,
      rating,
      reviewCount: count,
      tripsCount: tripsCount(u.id),
      joinedAt: u.createdAt,
      reviews,
      ledTours: blockedByMe
        ? []
        : d.tours
            .filter((t) => t.creatorId === u.id && isPublic(t))
            .map(toSummary),
      publicFavorites: favorites,
      isMe: viewer.id === u.id,
      blockedByMe,
    });
  }),

  http.post(`${API}/users/:id/block`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const id = String(params.id);
    if (id === user.id || !findUser(id))
      return fail(400, "VALIDATION_ERROR", "کاربر معتبر نیست.");
    const d = db();
    if (!d.blocks.some((b) => b.blockerId === user.id && b.blockedId === id))
      d.blocks.push({ blockerId: user.id, blockedId: id });
    persist();
    return noContent();
  }),

  http.delete(`${API}/users/:id/block`, async ({ params }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    d.blocks = d.blocks.filter(
      (b) => !(b.blockerId === user.id && b.blockedId === params.id),
    );
    persist();
    return noContent();
  }),

  http.post(`${API}/reports`, async ({ request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const body = await readBody(request);
    const targetType = str(body.targetType);
    const targetId = str(body.targetId);
    const reason = str(body.reason).slice(0, 300);
    if (
      !["user", "tour", "comment"].includes(targetType) ||
      !targetId ||
      reason.length < 5
    ) {
      return fail(
        400,
        "VALIDATION_ERROR",
        "دلیل گزارش را حداقل در ۵ حرف بنویسید.",
      );
    }
    const d = db();
    const label =
      targetType === "user"
        ? userName(targetId)
        : targetType === "tour"
          ? (findTour(targetId)?.title ?? targetId)
          : (d.comments.find((c) => c.id === targetId)?.text.slice(0, 60) ??
            targetId);
    d.reports.push({
      id: newId("rp"),
      reporterId: user.id,
      targetType: targetType as "user" | "tour" | "comment",
      targetId,
      targetLabel: label,
      reason,
      status: "open",
      decisionNote: null,
      decidedAt: null,
      decidedBy: null,
      createdAt: new Date().toISOString(),
    });
    persist();
    return HttpResponse.json({ ok: true }, { status: 201 });
  }),

  /* ---------- favourites: labels, notes, similar travellers (FS 13) ---------- */
  http.patch(`${API}/me/favorites/:tourId`, async ({ params, request }) => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const fav = db().favorites.find(
      (f) => f.userId === user.id && f.tourId === params.tourId,
    );
    if (!fav)
      return fail(404, "NOT_FOUND", "این تور در علاقه‌مندی‌های شما نیست.");
    const body = await readBody(request);
    if (body.label !== undefined)
      fav.label = str(body.label).slice(0, 30) || null;
    if (body.note !== undefined)
      fav.note = str(body.note).slice(0, 300) || null;
    persist();
    return noContent();
  }),

  http.get(`${API}/me/similar-travelers`, async () => {
    await latency();
    const user = requireUser();
    if (user instanceof Response) return user;
    const d = db();
    const mine = d.favorites.filter((f) => f.userId === user.id);
    const myTours = new Set(mine.map((f) => f.tourId));
    const myLabels = new Set(
      mine.map((f) => f.label).filter((l): l is string => !!l),
    );
    const others = d.users.filter(
      (u) =>
        u.id !== user.id &&
        u.favoritesPublic &&
        !u.blocked &&
        u.role !== "admin",
    );
    const items = others
      .map((u) => {
        const theirs = d.favorites.filter((f) => f.userId === u.id);
        return {
          person: personDto(u.id),
          sharedTours: theirs.filter((f) => myTours.has(f.tourId)).length,
          sharedLabels: [
            ...new Set(
              theirs
                .map((f) => f.label)
                .filter((l): l is string => !!l && myLabels.has(l)),
            ),
          ],
        };
      })
      .filter((x) => x.sharedTours > 0 || x.sharedLabels.length > 0)
      .sort((a, b) => b.sharedTours - a.sharedTours)
      .slice(0, 6);
    return HttpResponse.json({ items });
  }),

  /* ---------- admin: users & reports (FS 8) ---------- */
  http.get(`${API}/admin/users`, async ({ request }) => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const q = (new URL(request.url).searchParams.get("q") ?? "").trim();
    const d = db();
    const items = d.users
      .filter(
        (u) => !q || `${userName(u.id)} ${u.phone} ${u.city ?? ""}`.includes(q),
      )
      .map((u) => ({
        id: u.id,
        displayName: userName(u.id),
        phone: u.phone,
        city: u.city,
        role: u.role,
        blocked: u.blocked,
        createdAt: u.createdAt,
        toursLed: d.tours.filter((t) => t.creatorId === u.id).length,
        reportsAgainst: d.reports.filter(
          (r) => r.targetType === "user" && r.targetId === u.id,
        ).length,
      }));
    return HttpResponse.json({ items });
  }),

  http.post(`${API}/admin/users/:id/block`, async ({ params, request }) => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const u = findUser(String(params.id));
    if (!u) return fail(404, "NOT_FOUND", "کاربر پیدا نشد.");
    if (u.role === "admin")
      return fail(409, "FORBIDDEN_TARGET", "حساب مدیر قابل مسدودسازی نیست.");
    u.blocked = (await readBody(request)).blocked === true;
    if (u.blocked)
      db().sessions = db().sessions.filter((s) => s.userId !== u.id);
    persist();
    return noContent();
  }),

  http.get(`${API}/admin/reports`, async ({ request }) => {
    await latency();
    const admin = requireAdmin();
    if (admin instanceof Response) return admin;
    const status = new URL(request.url).searchParams.get("status") ?? "open";
    const items = db()
      .reports.filter((r) => status === "all" || r.status === status)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .map((r) => ({
        id: r.id,
        targetType: r.targetType,
        targetId: r.targetId,
        targetLabel: r.targetLabel,
        reason: r.reason,
        reporterName: userName(r.reporterId),
        status: r.status,
        decisionNote: r.decisionNote,
        decidedAt: r.decidedAt,
        decidedByName: r.decidedBy ? userName(r.decidedBy) : null,
        createdAt: r.createdAt,
      }));
    return HttpResponse.json({ items });
  }),

  http.post(
    `${API}/admin/reports/:id/decision`,
    async ({ params, request }) => {
      await latency();
      const admin = requireAdmin();
      if (admin instanceof Response) return admin;
      const d = db();
      const report = d.reports.find((r) => r.id === params.id);
      if (!report) return fail(404, "NOT_FOUND", "گزارش پیدا نشد.");
      if (report.status !== "open")
        return fail(
          409,
          "ALREADY_DECIDED",
          "برای این گزارش قبلاً تصمیم گرفته شده است.",
        );
      const body = await readBody(request);
      const note = str(body.note);
      if (note.length < 3)
        return fail(400, "VALIDATION_ERROR", "توضیح تصمیم را بنویسید.");
      const action = str(body.action);
      if (action === "block_user" && report.targetType === "user") {
        const u = findUser(report.targetId);
        if (u && u.role !== "admin") u.blocked = true;
      }
      if (action === "remove_tour" && report.targetType === "tour") {
        const t = findTour(report.targetId);
        if (t && !["completed", "cancelled"].includes(t.status)) {
          t.status = "cancelled";
          t.cancelReason = "حذف توسط مدیر سامانه";
          notify(
            participants(t),
            "tour_cancelled",
            "تور حذف شد",
            `«${t.title}» توسط مدیر سامانه حذف شد.`,
            t.id,
          );
        }
      }
      if (action === "remove_tour" && report.targetType === "comment")
        d.comments = d.comments.filter((c) => c.id !== report.targetId);
      report.status =
        str(body.decision) === "dismiss" ? "dismissed" : "resolved";
      report.decisionNote = note;
      report.decidedAt = new Date().toISOString();
      report.decidedBy = admin.id;
      persist();
      return noContent();
    },
  ),
];
