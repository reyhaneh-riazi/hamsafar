import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { env } from "@/shared/config/env";
import "@/styles/index.css";
import { App } from "./App";

async function bootstrap() {
  const container = document.getElementById("root");
  if (!container) throw new Error("#root element is missing");
  const root = createRoot(container);

  if (env.apiMode === "mock") {
    try {
      const { startMockApi } = await import("@/mocks/browser");
      await startMockApi();
    } catch (error) {
      // Never fall back silently to a different data source: show the problem instead.
      console.error("[mock-api] failed to start", error);
      root.render(
        <div
          dir="rtl"
          style={{ padding: 32, fontFamily: "Vazirmatn, sans-serif" }}
        >
          راه‌اندازی API نمایشی ممکن نشد. فایل public/mockServiceWorker.js را با
          «bun run msw:init» بسازید.
        </div>,
      );
      return;
    }
  } else {
    // Unregister any active Mock Service Workers to ensure fresh live API requests
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          void registration.unregister();
        }
      });
    }
  }

  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void bootstrap();
