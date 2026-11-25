import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { renderRoute } from "@/test/render";
import { AuthPage } from "./AuthPage";

describe("AuthPage (OTP login against the mock API)", () => {
  it("rejects an empty or malformed number without calling the API", async () => {
    renderRoute(<AuthPage />, { path: "/auth", url: "/auth" });
    await userEvent.click(
      await screen.findByRole("button", { name: "دریافت کد تأیید" }),
    );
    expect(
      await screen.findByText("شماره موبایل را وارد کنید."),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByLabelText("شماره موبایل"), "0812");
    await userEvent.click(
      screen.getByRole("button", { name: "دریافت کد تأیید" }),
    );
    expect(
      await screen.findByText(/شماره را درست وارد کنید/),
    ).toBeInTheDocument();
  });

  it("shows the server error for a wrong code and keeps the user on the OTP step", async () => {
    renderRoute(<AuthPage />, { path: "/auth", url: "/auth" });
    await userEvent.type(
      await screen.findByLabelText("شماره موبایل"),
      "09351234567",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "دریافت کد تأیید" }),
    );
    expect(
      await screen.findByRole("heading", { name: "کد تأیید را وارد کنید" }),
    ).toBeInTheDocument();
    await userEvent.keyboard("11111");
    expect(await screen.findByText(/کد تأیید نادرست است/)).toBeInTheDocument();
  });

  it("signs up a new number: OTP → profile completion → intended destination", async () => {
    const { router } = renderRoute(<AuthPage />, {
      path: "/auth",
      url: "/auth?next=%2Fprofile",
    });
    await userEvent.type(
      await screen.findByLabelText("شماره موبایل"),
      "۰۹۳۵۱۲۳۴۵۶۷",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "دریافت کد تأیید" }),
    );
    await screen.findByRole("heading", { name: "کد تأیید را وارد کنید" });
    await userEvent.keyboard("12345");
    expect(
      await screen.findByRole("heading", { name: "تکمیل پروفایل" }),
    ).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "نام" }), "سارا");
    await userEvent.type(
      screen.getByRole("textbox", { name: /نام خانوادگی/ }),
      "محمدی",
    );
    await userEvent.click(
      screen.getByRole("button", { name: "ذخیره و ادامه" }),
    );
    await waitFor(() =>
      expect(router.state.location.pathname).toBe("/profile"),
    );
  });
});
