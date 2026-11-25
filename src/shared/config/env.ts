/**
 * Validated public configuration. Everything read here is bundled into the browser,
 * so it must never contain secrets.
 */
export type ApiMode = "mock" | "live";

function readApiMode(): ApiMode {
  const value = import.meta.env.VITE_API_MOCKING;
  if (value === "enabled") return "mock";
  if (value === "disabled") return "live";
  if (value === undefined || value === "") {
    // Development defaults to the mock API; production builds must opt in explicitly.
    return import.meta.env.DEV ? "mock" : "live";
  }
  throw new Error(
    `VITE_API_MOCKING must be "enabled" or "disabled" (received "${String(value)}").`,
  );
}

function readApiBaseUrl(): string {
  const value = (import.meta.env.VITE_API_BASE_URL ?? "").trim();
  if (value === "") {
    // Development defaults to relative URL (proxied via Vite dev server.proxy);
    // Production defaults to the deployed Liara backend API URL.
    return import.meta.env.DEV ? "" : "https://website-api.liara.run";
  }
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`VITE_API_BASE_URL is not a valid URL: "${value}"`);
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error("VITE_API_BASE_URL must use http(s).");
  }
  return value.replace(/\/+$/, "");
}

export const env = {
  apiMode: readApiMode(),
  apiBaseUrl: readApiBaseUrl(),
  isDev: import.meta.env.DEV,
} as const;
