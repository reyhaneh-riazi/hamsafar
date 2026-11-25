import { describe, expect, it } from "vitest";
import { ApiError, describeError, networkError, toApiError } from "./errors";

describe("describeError", () => {
  it("classifies network, server and client errors", () => {
    expect(describeError(networkError()).kind).toBe("network");
    expect(describeError(new ApiError(503, "SERVER_ERROR", "x")).kind).toBe(
      "server",
    );
    expect(
      describeError(new ApiError(409, "CAPACITY_FULL", "پر است")).kind,
    ).toBe("client");
    expect(
      describeError(new ApiError(409, "CAPACITY_FULL", "پر است")).retryable,
    ).toBe(false);
  });
  it("reads the agreed error envelope", () => {
    const e = toApiError(410, {
      error: { code: "INVITE_EXPIRED", message: "منقضی" },
    });
    expect(e.code).toBe("INVITE_EXPIRED");
    expect(e.message).toBe("منقضی");
  });
  it("never shows internals from the server", () => {
    expect(
      toApiError(500, {
        error: { code: "SERVER_ERROR", message: "خطا در پایگاه داده" },
      }).message,
    ).toBe("خطایی در سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.");
    expect(
      toApiError(400, {
        error: {
          code: "VALIDATION_ERROR",
          message: "SQLSTATE[23000]: duplicate key users_email",
        },
      }).message,
    ).toBe("اطلاعات ارسال‌شده معتبر نیست.");
    expect(
      toApiError(409, {
        error: {
          code: "CONFLICT",
          message: "خطا at UserService.save (/app/src/user.ts:42)",
        },
      }).message,
    ).toBe("این عملیات با وضعیت فعلی سازگار نیست.");
    expect(toApiError(400, "<html>Bad Gateway</html>").message).toBe(
      "اطلاعات ارسال‌شده معتبر نیست.",
    );
    const f = toApiError(400, {
      error: {
        code: "VALIDATION_ERROR",
        message: "فرم کامل نیست",
        details: {
          fields: {
            phone: "شماره معتبر نیست",
            email: "Traceback (most recent call last)",
          },
        },
      },
    });
    expect(f.fieldErrors.phone).toBe("شماره معتبر نیست");
    expect(f.fieldErrors.email).toBe("مقدار این فیلد معتبر نیست.");
  });
});
