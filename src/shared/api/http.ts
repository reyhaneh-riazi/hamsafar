import type { ZodType, ZodTypeDef } from "zod";
import { env } from "@/shared/config/env";
import { ApiError, networkError, toApiError } from "./errors";

type QueryValue =
  string | number | boolean | undefined | null | readonly (string | number)[];

export interface RequestOptions<T> {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  query?: Record<string, QueryValue>;
  body?: unknown;
  signal?: AbortSignal;
  /** Runtime schema for the success body. Omit only for empty (204) responses. */
  schema?: ZodType<T, ZodTypeDef, unknown>;
}

const TIMEOUT_MS = 30_000;
/** Fired on `window` when a non-auth request returns 401. */
export const UNAUTHORIZED_EVENT = "hamsafar:unauthorized";

function buildUrl(path: string, query?: Record<string, QueryValue>): string {
  const params = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") return;
    if (Array.isArray(value))
      value.forEach((item) => params.append(key, String(item)));
    else params.append(key, String(value));
  });
  const qs = params.toString();
  return `${env.apiBaseUrl}/api${path}${qs ? `?${qs}` : ""}`;
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return undefined;
  }
}

/**
 * The single HTTP client for the app.
 * - Session travels in an HttpOnly cookie (`credentials: 'include'`); no tokens in JS storage.
 * - Every success body is validated with a zod schema before it reaches the UI.
 * - Errors are normalised to ApiError (status 0 = network failure).
 */
export async function apiRequest<T = void>(
  path: string,
  options: RequestOptions<T> = {},
): Promise<T> {
  const { method = "GET", query, body, signal, schema } = options;
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(), TIMEOUT_MS);
  const onAbort = () => timeout.abort();
  signal?.addEventListener("abort", onAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      credentials: "include",
      headers: {
        Accept: "application/json",
        // FormData sets its own multipart boundary header.
        ...(body !== undefined && !isForm
          ? { "Content-Type": "application/json" }
          : {}),
      },
      body:
        isForm && body instanceof FormData
          ? body
          : body !== undefined
            ? JSON.stringify(body)
            : undefined,
      signal: timeout.signal,
    });
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.signal.aborted)
      throw new ApiError(0, "TIMEOUT", "پاسخ سرور طول کشید. دوباره تلاش کنید.");
    throw networkError();
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", onAbort);
  }

  const payload = await readJson(response);
  if (!response.ok) {
    // A private call answered 401: the session is gone. AppLayout listens and sends the user to /auth.
    if (
      response.status === 401 &&
      !path.startsWith("/auth/") &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(
        new CustomEvent(UNAUTHORIZED_EVENT, { detail: { method } }),
      );
    }
    throw toApiError(response.status, payload);
  }
  if (!schema) return undefined as T;

  const parsed = schema.safeParse(payload);
  if (!parsed.success) {
    if (import.meta.env.DEV)
      console.warn(
        `[api] ${method} ${path} returned an unexpected shape`,
        parsed.error.issues,
      );
    throw new ApiError(
      response.status,
      "INVALID_RESPONSE",
      "پاسخ سرور با قرارداد API همخوانی ندارد.",
    );
  }
  return parsed.data;
}
