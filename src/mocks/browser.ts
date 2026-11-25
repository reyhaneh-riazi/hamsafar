import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

export const worker = setupWorker(...handlers);

/** Starts the in-browser mock API. Only called when VITE_API_MOCKING=enabled. */
export async function startMockApi(): Promise<void> {
  await worker.start({
    onUnhandledRequest: "bypass",
    quiet: !import.meta.env.DEV,
    serviceWorker: { url: "/mockServiceWorker.js" },
  });
}
