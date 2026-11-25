/* Join + simulated deposit payment (Figma checkout 129:3795) and discount codes. Test gateway only. */
import { http, HttpResponse } from "msw";
import { checkoutBodySchema } from "@/features/tours/api/tour-schemas";
import {
  confirmedCount,
  db,
  isPublic,
  newId,
  notify,
  persist,
  syncStatus,
  userName,
} from "./db";
import {
  API,
  fail,
  findTour,
  latency,
  readBody,
  requireComplete,
} from "./utils";

/** Demo codes. Figma: «کد تخفیف ۱۰٪ هدیه اولین سفر اعمال شد.» */
const DISCOUNTS: Record<string, { percent: number; label: string }> = {
  HAMSAFAR10: { percent: 10, label: "کد تخفیف ۱۰٪ هدیه اولین سفر اعمال شد." },
  FROG20: { percent: 20, label: "کد تخفیف ۲۰٪ تیم همسفر اعمال شد." },
};
const findDiscount = (code: string) => DISCOUNTS[code.trim().toUpperCase()];

export const checkoutHandlers = [
  http.post(`${API}/discounts/validate`, async ({ request }) => {
    await latency();
    const body = await readBody(request);
    const code = typeof body.code === "string" ? body.code : "";
    const d = findDiscount(code);
    if (!d)
      return fail(
        404,
        "INVALID_DISCOUNT",
        "این کد تخفیف معتبر نیست یا منقضی شده است.",
        { fields: { discountCode: "کد معتبر نیست." } },
      );
    return HttpResponse.json({
      code: code.trim().toUpperCase(),
      percent: d.percent,
      label: d.label,
    });
  }),

  http.post(`${API}/tours/:id/checkout`, async ({ params, request }) => {
    await latency();
    const user = requireComplete();
    if (user instanceof Response) return user;
    const tour = findTour(params.id);
    if (!tour || !isPublic(tour))
      return fail(404, "NOT_FOUND", "این تور پیدا نشد یا دیگر عضو نمی‌پذیرد.");
    if (tour.creatorId === user.id)
      return fail(409, "IS_CREATOR", "شما برگزارکننده این تور هستید.");
    const parsed = checkoutBodySchema.safeParse(await readBody(request));
    if (!parsed.success)
      return fail(400, "VALIDATION_ERROR", "اطلاعات پرداخت کامل نیست.");
    const body = parsed.data;
    const d = db();
    if (
      d.requests.some(
        (r) =>
          r.tourId === tour.id &&
          r.userId === user.id &&
          (r.status === "pending" || r.status === "approved"),
      )
    ) {
      return fail(
        409,
        "ALREADY_REQUESTED",
        "قبلاً برای این تور درخواست داده‌اید.",
      );
    }
    const left = tour.capacity - confirmedCount(tour);
    if (body.seats > left)
      return fail(409, "CAPACITY_FULL", `فقط ${left} جای خالی باقی مانده است.`);
    const discount = body.discountCode
      ? findDiscount(body.discountCode)
      : undefined;
    if (body.discountCode && !discount)
      return fail(400, "INVALID_DISCOUNT", "این کد تخفیف معتبر نیست.", {
        fields: { discountCode: "کد معتبر نیست." },
      });
    if (body.simulate === "fail") {
      return fail(
        402,
        "PAYMENT_FAILED",
        "پرداخت از سمت بانک تأیید نشد یا زمان ورود رمز دوم منقضی گردید. هیچ مبلغی از حساب شما کسر نشده است.",
      );
    }
    const subtotal = tour.priceToman * body.seats;
    const off = discount ? Math.round((subtotal * discount.percent) / 100) : 0;
    const now = new Date().toISOString();
    const req = {
      id: newId("req"),
      tourId: tour.id,
      userId: user.id,
      status: tour.requiresApproval
        ? ("pending" as const)
        : ("approved" as const),
      message: body.message || (body.seats > 1 ? `${body.seats} نفر` : ""),
      createdAt: now,
      decidedAt: tour.requiresApproval ? null : now,
      seats: body.seats,
    };
    d.requests.push(req);
    notify(
      [tour.creatorId],
      "join_request",
      "درخواست پیوستن با پیش‌پرداخت",
      `${userName(user.id)} برای «${tour.title}» پیش‌پرداخت آزمایشی انجام داد.`,
      tour.id,
    );
    syncStatus(tour);
    persist();
    return HttpResponse.json(
      {
        requestId: req.id,
        requestStatus: req.status,
        seats: body.seats,
        subtotalToman: subtotal,
        discountToman: off,
        totalToman: subtotal - off,
        paymentRef: `TEST-${Math.floor(100000 + Math.random() * 899999)}`,
      },
      { status: 201 },
    );
  }),
];
