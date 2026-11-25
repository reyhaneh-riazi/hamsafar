import { delay, HttpResponse } from "msw";
import { currentUser, db, ensureMedia } from "./db";
import type { DbTour, DbUser } from "./seed";

export const API = "*/api";

export function fail(
  status: number,
  code: string,
  message: string,
  details?: Record<string, unknown>,
) {
  return HttpResponse.json(
    { error: { code, message, ...(details ? { details } : {}) } },
    { status },
  );
}

export function noContent() {
  return new HttpResponse(null, { status: 204 });
}

export async function latency() {
  await ensureMedia();
  await delay(import.meta.env.MODE === "test" ? 0 : 180 + Math.random() * 240);
}

export async function readBody(
  request: Request,
): Promise<Record<string, unknown>> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function requireUser(): DbUser | Response {
  const user = currentUser();
  if (!user)
    return fail(401, "UNAUTHENTICATED", "برای ادامه وارد حساب کاربری شوید.");
  return user;
}

export function requireComplete(): DbUser | Response {
  const user = requireUser();
  if (user instanceof Response) return user;
  if (!user.firstName || !user.lastName)
    return fail(403, "PROFILE_INCOMPLETE", "ابتدا پروفایل خود را تکمیل کنید.");
  return user;
}

export function findTour(
  id: string | readonly string[] | undefined,
): DbTour | undefined {
  return db().tours.find((t) => t.id === id);
}

/** Leader-only guard: the server is the authority, the UI only hides controls. */
export function requireLeader(
  tourId: string | readonly string[] | undefined,
): { user: DbUser; tour: DbTour } | Response {
  const user = requireUser();
  if (user instanceof Response) return user;
  const tour = findTour(tourId);
  if (!tour) return fail(404, "NOT_FOUND", "این تور پیدا نشد.");
  if (tour.creatorId !== user.id)
    return fail(
      403,
      "NOT_TOUR_LEADER",
      "فقط تورلیدر همین تور اجازه این کار را دارد.",
    );
  return { user, tour };
}

/** Reads an uploaded image from multipart form data and returns a data URL (mock storage). */
export async function readImage(
  request: Request,
  field = "file",
): Promise<{ dataUrl: string; form: FormData } | Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return fail(400, "VALIDATION_ERROR", "فایلی ارسال نشده است.");
  }
  const file = form.get(field);
  if (!file || typeof file === "string")
    return fail(400, "VALIDATION_ERROR", "فایلی ارسال نشده است.");
  if (!file.type.startsWith("image/"))
    return fail(415, "UNSUPPORTED_MEDIA_TYPE", "فقط تصویر قابل بارگذاری است.");
  if (file.size > 5 * 1024 * 1024)
    return fail(413, "FILE_TOO_LARGE", "حجم تصویر بیش از ۵ مگابایت است.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000)
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return { dataUrl: `data:${file.type};base64,${btoa(binary)}`, form };
}

export function requireAdmin(): DbUser | Response {
  const user = requireUser();
  if (user instanceof Response) return user;
  if (user.role !== "admin")
    return fail(403, "FORBIDDEN", "دسترسی مدیر لازم است.");
  return user;
}
