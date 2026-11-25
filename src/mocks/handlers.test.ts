import { describe, expect, it } from "vitest";
import { db, persist } from "./db";

const API = "http://localhost/api";

async function login(phone: string) {
  await fetch(`${API}/auth/otp/request`, {
    method: "POST",
    body: JSON.stringify({ phone }),
  });
  return fetch(`${API}/auth/otp/verify`, {
    method: "POST",
    body: JSON.stringify({ phone, code: "12345" }),
  });
}

describe("mock API contract", () => {
  it("returns 401 for /auth/me without a session", async () => {
    const res = await fetch(`${API}/auth/me`);
    expect(res.status).toBe(401);
    const body = (await res.json()) as { error: { code: string } };
    expect(body.error.code).toBe("UNAUTHENTICATED");
  });

  it("rate-limits a second OTP request inside the resend window", async () => {
    await fetch(`${API}/auth/otp/request`, {
      method: "POST",
      body: JSON.stringify({ phone: "09121111111" }),
    });
    const res = await fetch(`${API}/auth/otp/request`, {
      method: "POST",
      body: JSON.stringify({ phone: "09121111111" }),
    });
    expect(res.status).toBe(429);
  });

  it("rejects a join request with 409 when the tour is full", async () => {
    const tour = db().tours.find((t) => t.id === "gahar-lake");
    if (!tour) throw new Error("seed changed");
    tour.baseConfirmed = tour.capacity;
    persist();
    await login("09123456789");
    const res = await fetch(`${API}/tours/gahar-lake/join-requests`, {
      method: "POST",
      body: JSON.stringify({ message: "" }),
    });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "CAPACITY_FULL",
    );
  });

  it("forbids admin endpoints for ordinary users (403)", async () => {
    await login("09123456789");
    const res = await fetch(`${API}/admin/stats`);
    expect(res.status).toBe(403);
  });

  it("hides tours that are pending review from the public list", async () => {
    const res = await fetch(`${API}/tours?pageSize=48`);
    const body = (await res.json()) as { items: { status: string }[] };
    expect(
      body.items.every((t) => t.status === "open" || t.status === "confirmed"),
    ).toBe(true);
  });

  it("lets only the tour leader change a tour (403 NOT_TOUR_LEADER for members)", async () => {
    await login("09123456789"); // Parisa: approved member of hyrcanian-forest, not its leader
    const res = await fetch(`${API}/tours/hyrcanian-forest`, {
      method: "PATCH",
      body: JSON.stringify({
        description: "تغییر غیرمجاز توسط عضو تور برای آزمون",
      }),
    });
    expect(res.status).toBe(403);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "NOT_TOUR_LEADER",
    );

    const expense = await fetch(`${API}/tours/hyrcanian-forest/expenses`, {
      method: "POST",
      body: JSON.stringify({
        title: "بنزین",
        category: "transport",
        amountToman: 500000,
      }),
    });
    expect(expense.status).toBe(403);

    await login("09123333333"); // Reyhaneh: the leader
    const ok = await fetch(`${API}/tours/hyrcanian-forest/expenses`, {
      method: "POST",
      body: JSON.stringify({
        title: "بنزین",
        category: "transport",
        amountToman: 500000,
      }),
    });
    expect(ok.status).toBe(201);
  });

  it("locks price changes after approval (409 EDIT_NOT_ALLOWED)", async () => {
    await login("09123333333");
    const res = await fetch(`${API}/tours/hyrcanian-forest`, {
      method: "PATCH",
      body: JSON.stringify({ priceToman: 1 }),
    });
    expect(res.status).toBe(409);
    expect(((await res.json()) as { error: { code: string } }).error.code).toBe(
      "EDIT_NOT_ALLOWED",
    );
  });

  it("stores chat messages so another member sees them after logging in", async () => {
    await login("09123456789");
    const sent = await fetch(`${API}/tours/hyrcanian-forest/messages`, {
      method: "POST",
      body: JSON.stringify({ text: "سلام، ساعت حرکت قطعی شد؟" }),
    });
    expect(sent.status).toBe(201);

    await login("09131112233"); // Mahsa, another approved member
    const inbox = (await (await fetch(`${API}/me/conversations`)).json()) as {
      items: { tourId: string; unread: number }[];
    };
    expect(
      (inbox.items.find((c) => c.tourId === "hyrcanian-forest")?.unread ?? 0) >
        0,
    ).toBe(true);
    const thread = (await (
      await fetch(`${API}/tours/hyrcanian-forest/messages`)
    ).json()) as { items: { text: string }[] };
    expect(
      thread.items.some((m) => m.text === "سلام، ساعت حرکت قطعی شد؟"),
    ).toBe(true);
  });

  it("keeps the group chat closed to non-members (403)", async () => {
    await login("09125555555"); // Pari: not a member of hyrcanian-forest
    const res = await fetch(`${API}/tours/hyrcanian-forest/messages`);
    expect(res.status).toBe(403);
  });

  it("checkout: rejects unknown discount, fails on simulated decline, then books seats", async () => {
    await login("09123456789");
    const post = (body: object) =>
      fetch(`${API}/tours/shirom-canyon/checkout`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    const bad = await fetch(`${API}/discounts/validate`, {
      method: "POST",
      body: JSON.stringify({ tourId: "shirom-canyon", code: "NOPE" }),
    });
    expect(bad.status).toBe(404);
    const declined = await post({
      seats: 2,
      discountCode: "HAMSAFAR10",
      simulate: "fail",
    });
    expect(declined.status).toBe(402);
    const ok = await post({
      seats: 2,
      discountCode: "hamsafar10",
      simulate: "success",
    });
    expect(ok.status).toBe(201);
    const body = (await ok.json()) as {
      subtotalToman: number;
      discountToman: number;
      totalToman: number;
      seats: number;
    };
    expect(body.seats).toBe(2);
    expect(body.totalToman).toBe(body.subtotalToman - body.discountToman);
    expect(body.discountToman).toBe(Math.round(body.subtotalToman / 10));
    const again = await post({
      seats: 1,
      discountCode: null,
      simulate: "success",
    });
    expect(again.status).toBe(409);
  });

  it("contact: requires a valid mobile and a known subject", async () => {
    const bad = await fetch(`${API}/contact`, {
      method: "POST",
      body: JSON.stringify({
        name: "فاطمه",
        phone: "0912",
        subject: "x",
        message: "سلام سلام سلام",
      }),
    });
    expect(bad.status).toBe(400);
    const ok = await fetch(`${API}/contact`, {
      method: "POST",
      body: JSON.stringify({
        name: "فاطمه احمدی",
        phone: "۰۹۱۲۱۱۱۲۲۳۳",
        subject: "payment_refund",
        message: "سؤالی درباره بازگشت وجه دارم.",
      }),
    });
    expect(ok.status).toBe(201);
  });
});
