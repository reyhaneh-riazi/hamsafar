import { z } from "zod";

/** Error envelope agreed in docs/api-contract.md: `{ "error": { "code", "message", "details"? } }` */
const errorEnvelopeSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
    details: z.record(z.unknown()).optional(),
  }),
});

export type ApiErrorCode =
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "INVALID_RESPONSE"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | (string & {});

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details: Record<string, unknown> = {},
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** Number of seconds the server asked us to wait (429 responses). */
  get retryAfterSec(): number | undefined {
    const value = this.details.retryAfterSec;
    return typeof value === "number" && Number.isFinite(value)
      ? value
      : undefined;
  }

  /** Field-level validation messages, e.g. `{ phone: 'شماره معتبر نیست' }`. */
  get fieldErrors(): Record<string, string> {
    const fields = this.details.fields;
    if (!fields || typeof fields !== "object") return {};
    return Object.fromEntries(
      Object.entries(fields).filter(
        (entry): entry is [string, string] => typeof entry[1] === "string",
      ),
    );
  }

  get isUnauthenticated(): boolean {
    return this.status === 401;
  }

  get isForbidden(): boolean {
    return this.status === 403;
  }
}

const FALLBACK_MESSAGES: Record<number, string> = {
  400: "اطلاعات ارسال‌شده معتبر نیست.",
  401: "برای ادامه وارد حساب کاربری شوید.",
  403: "اجازه انجام این کار را ندارید.",
  404: "موردی پیدا نشد.",
  409: "این عملیات با وضعیت فعلی سازگار نیست.",
  429: "تعداد درخواست‌ها زیاد است؛ کمی بعد دوباره تلاش کنید.",
};

function fallbackCode(status: number): ApiErrorCode {
  if (status === 401) return "UNAUTHENTICATED";
  if (status === 403) return "FORBIDDEN";
  if (status === 404) return "NOT_FOUND";
  if (status === 409) return "CONFLICT";
  if (status === 422 || status === 400) return "VALIDATION_ERROR";
  if (status === 429) return "RATE_LIMITED";
  return "SERVER_ERROR";
}

const GENERIC_SERVER =
  "خطایی در سرور رخ داد. لطفاً چند لحظه بعد دوباره تلاش کنید.";
/** Things that must never reach the screen: stack traces, SQL, paths, tokens, HTML pages, English internals. */
const SENSITIVE =
  /(exception|traceback|stack|error:|sql|select\s|insert\s|duplicate key|constraint|null pointer|undefined|object|\bat\s+\S+\s*\(|[a-z]:\\|\/(home|var|usr|app|srv|etc)\/|\.(py|js|ts|java|php|cs):\d|bearer|token|jwt|password|secret|api[_-]?key|<\/?[a-z]+[\s>]|\b\d{1,3}(\.\d{1,3}){3}\b)/i;
const PERSIAN = /[\u0600-\u06FF]/;

/** Server text is shown only if it is a short Persian sentence without internals; otherwise a safe fallback. */
export function safeServerText(text: unknown, fallback: string): string {
  if (typeof text !== "string") return fallback;
  const t = text.trim();
  if (!t || t.length > 220 || !PERSIAN.test(t) || SENSITIVE.test(t))
    return fallback;
  return t;
}

function safeDetails(
  details: Record<string, unknown>,
): Record<string, unknown> {
  const fields = details.fields;
  if (!fields || typeof fields !== "object") return details;
  const clean: Record<string, string> = {};
  for (const [k, v] of Object.entries(fields as Record<string, unknown>))
    clean[k] = safeServerText(v, "مقدار این فیلد معتبر نیست.");
  return { ...details, fields: clean };
}

/** Turns any non-2xx response body into an ApiError without trusting its shape. */
export function toApiError(status: number, body: unknown): ApiError {
  const parsed = errorEnvelopeSchema.safeParse(body);
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    // Generic 5xx text comes from infrastructure, not product copy: never show it.
    // Specific codes (e.g. 502 DELIVERY_FAILED) may keep their Persian text if it passes the filter.
    const generic =
      status >= 500 &&
      /^(SERVER_ERROR|INTERNAL|INTERNAL_ERROR|UNKNOWN)$/.test(code);
    const text = generic
      ? GENERIC_SERVER
      : safeServerText(
          message,
          status >= 500
            ? GENERIC_SERVER
            : (FALLBACK_MESSAGES[status] ?? GENERIC_SERVER),
        );
    return new ApiError(status, code, text, safeDetails(details ?? {}));
  }
  return new ApiError(
    status,
    fallbackCode(status),
    status >= 500
      ? GENERIC_SERVER
      : (FALLBACK_MESSAGES[status] ??
          "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید."),
  );
}

export function networkError(): ApiError {
  return new ApiError(
    0,
    "NETWORK_ERROR",
    "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.",
  );
}

/** User-facing message for any thrown value. */
export function errorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  return "خطای غیرمنتظره‌ای رخ داد. لطفاً دوباره تلاش کنید.";
}

export type ErrorKind =
  | "network"
  | "timeout"
  | "server"
  | "forbidden"
  | "unauthenticated"
  | "not_found"
  | "rate_limited"
  | "client";

/** Groups an error into the few situations the UI explains differently. */
export function errorKind(error: unknown): ErrorKind {
  if (!(error instanceof ApiError)) return "server";
  if (error.code === "TIMEOUT") return "timeout";
  if (error.status === 0) return "network";
  if (error.status === 401) return "unauthenticated";
  if (error.status === 403) return "forbidden";
  if (error.status === 404) return "not_found";
  if (error.status === 429) return "rate_limited";
  if (error.status >= 500 || error.code === "INVALID_RESPONSE") return "server";
  return "client";
}

const ERROR_TITLES: Record<ErrorKind, string> = {
  network: "اتصال برقرار نیست",
  timeout: "پاسخ سرور طول کشید",
  server: "خطا در سرور",
  forbidden: "دسترسی ندارید",
  unauthenticated: "نیاز به ورود",
  not_found: "پیدا نشد",
  rate_limited: "کمی صبر کنید",
  client: "درخواست انجام نشد",
};

/** Title + message pair for error views; `retryable` tells whether «تلاش دوباره» makes sense. */
export function describeError(error: unknown): {
  kind: ErrorKind;
  title: string;
  text: string;
  retryable: boolean;
} {
  const kind = errorKind(error);
  return {
    kind,
    title: ERROR_TITLES[kind],
    text: errorMessage(error),
    retryable:
      kind === "network" ||
      kind === "timeout" ||
      kind === "server" ||
      kind === "rate_limited",
  };
}
