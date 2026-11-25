import { describe, expect, it } from "vitest";
import { passwordChecks, validateCredentials } from "./credentials";

describe("email credentials", () => {
  it("requires a valid email, a strong password and a matching confirmation", () => {
    expect(
      validateCredentials({ email: "", password: "", confirm: "" }, "register"),
    ).toEqual({
      email: "ایمیل را وارد کنید.",
      password: "رمز عبور را وارد کنید.",
      confirm: "تکرار رمز عبور را وارد کنید.",
    });
    expect(
      validateCredentials(
        { email: "a@b", password: "abc", confirm: "abc" },
        "register",
      ).email,
    ).toBeDefined();
    expect(
      validateCredentials(
        { email: "a@b.com", password: "abcdefgh", confirm: "abcdefgh" },
        "register",
      ).password,
    ).toContain("عدد");
    expect(
      validateCredentials(
        { email: "a@b.com", password: "abcd1234", confirm: "abcd12345" },
        "register",
      ).confirm,
    ).toContain("یکسان");
    expect(
      validateCredentials(
        { email: "A@B.com ", password: "abcd1234", confirm: "abcd1234" },
        "register",
      ),
    ).toEqual({});
  });
  it("login only checks presence", () => {
    expect(
      validateCredentials({ email: "a@b.com", password: "x" }, "login"),
    ).toEqual({});
  });
  it("reports password rules", () => {
    expect(passwordChecks("سفر۱۲۳۴۵")).toEqual({
      length: true,
      letter: true,
      digit: true,
    });
  });
});
