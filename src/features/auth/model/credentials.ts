import { EMAIL_PATTERN, PASSWORD_MAX, PASSWORD_MIN } from "../api/auth-schemas";

export interface PasswordChecks {
  length: boolean;
  letter: boolean;
  digit: boolean;
}

export function passwordChecks(password: string): PasswordChecks {
  return {
    length: password.length >= PASSWORD_MIN && password.length <= PASSWORD_MAX,
    letter: /\p{L}/u.test(password),
    digit: /\d|[۰-۹]/.test(password),
  };
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export type CredentialErrors = Partial<
  Record<"email" | "password" | "confirm", string>
>;

/** Client-side checks for the email forms (the server repeats them). */
export function validateCredentials(
  form: { email: string; password: string; confirm?: string },
  mode: "login" | "register",
): CredentialErrors {
  const e: CredentialErrors = {};
  const email = normalizeEmail(form.email);
  if (!email) e.email = "ایمیل را وارد کنید.";
  else if (!EMAIL_PATTERN.test(email))
    e.email = "ایمیل معتبر نیست (مثل name@example.com).";
  if (!form.password) e.password = "رمز عبور را وارد کنید.";
  else if (mode === "register") {
    const c = passwordChecks(form.password);
    if (!c.length)
      e.password = `رمز عبور باید ${PASSWORD_MIN} تا ${PASSWORD_MAX} کاراکتر باشد.`;
    else if (!c.letter || !c.digit)
      e.password = "رمز عبور باید هم حرف و هم عدد داشته باشد.";
  }
  if (mode === "register") {
    if (!form.confirm) e.confirm = "تکرار رمز عبور را وارد کنید.";
    else if (form.confirm !== form.password)
      e.confirm = "تکرار رمز عبور با رمز یکسان نیست.";
  }
  return e;
}
