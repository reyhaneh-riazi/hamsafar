/* Runs before every other mock handler: applies the demo network mode chosen in the demo badge
   (slow / server error / offline) so loading, error and retry states can be shown on purpose. */
import { delay, http, HttpResponse } from "msw";
import { getMockNetworkMode } from "@/shared/config/mock-network";
import { API, fail } from "./utils";

/** Session check stays healthy so the header does not flip to "signed out" during the demo. */
const EXEMPT = /\/api\/auth\/me$/;

export const networkHandlers = [
  http.all(`${API}/*`, async ({ request }) => {
    const mode = getMockNetworkMode();
    if (mode === "normal" || EXEMPT.test(new URL(request.url).pathname))
      return undefined;
    if (mode === "slow") {
      await delay(3000);
      return undefined; // continue to the real mock handler
    }
    await delay(400);
    if (mode === "offline") return HttpResponse.error();
    return fail(
      500,
      "SERVER_ERROR",
      "سرور موقتاً پاسخ نمی‌دهد (خطای شبیه‌سازی‌شده در نسخه نمایشی).",
    );
  }),
];
