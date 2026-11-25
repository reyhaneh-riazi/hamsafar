import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ChevronDown, FlaskConical, X } from "lucide-react";
import { env } from "@/shared/config/env";
import {
  getMockNetworkMode,
  MOCK_NETWORK_MODES,
  setMockNetworkMode,
  type MockNetworkMode,
} from "@/shared/config/mock-network";
import { cn } from "@/shared/lib/cn";

/**
 * Visible marker that the app is running on the mock API (never silently fake data).
 * In demo mode it also offers a network simulator to show loading / error / offline states.
 */
export function DemoBadge({ className }: { className?: string } = {}) {
  const [open, setOpen] = useState(true);
  const [menu, setMenu] = useState(false);
  const [mode, setMode] = useState<MockNetworkMode>(getMockNetworkMode);
  const qc = useQueryClient();
  if (env.apiMode !== "mock" || !open) return null;
  const current = MOCK_NETWORK_MODES.find((m) => m.value === mode);

  const choose = (next: MockNetworkMode) => {
    setMockNetworkMode(next);
    setMode(next);
    setMenu(false);
    void qc.invalidateQueries();
  };

  return (
    <div
      className={cn(
        "fixed bottom-20 end-4 z-toast lg:bottom-4 flex max-w-[calc(100vw-2rem)] flex-col items-end gap-2",
        className,
      )}
    >
      {menu && (
        <div
          role="menu"
          aria-label="شبیه‌سازی شبکه"
          className="w-64 rounded-2xl border border-line bg-surface-raised p-2 shadow-float"
        >
          <p className="px-2 pb-1.5 pt-1 text-[11px] font-bold text-ink-soft">
            شبیه‌سازی شبکه (فقط نسخه نمایشی)
          </p>
          {MOCK_NETWORK_MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              role="menuitemradio"
              aria-checked={m.value === mode}
              onClick={() => choose(m.value)}
              className={cn(
                "flex w-full flex-col rounded-xl px-3 py-2 text-start transition hover:bg-surface-muted",
                m.value === mode && "bg-surface-muted",
              )}
            >
              <span className="text-xs font-bold text-ink">{m.label}</span>
              <span className="text-[11px] text-ink-soft">{m.hint}</span>
            </button>
          ))}
        </div>
      )}
      <div
        className={cn(
          "flex items-center gap-2 rounded-full border py-1.5 ps-3 pe-1.5 text-xs font-bold shadow-float backdrop-blur",
          mode === "normal"
            ? "border-line bg-surface-raised/95 text-ink-muted"
            : "border-warning/40 bg-warning/15 text-warning",
        )}
      >
        <FlaskConical className="size-4 text-coral-500" aria-hidden="true" />
        <span>
          نسخه نمایشی
          {mode !== "normal" && current
            ? ` · ${current.label}`
            : " · داده‌ها آزمایشی هستند"}
        </span>
        <button
          type="button"
          onClick={() => setMenu((v) => !v)}
          aria-expanded={menu}
          aria-label="شبیه‌سازی شبکه"
          className="rounded-full p-1 hover:bg-surface-muted"
        >
          <ChevronDown
            className={cn("size-3.5 transition", menu && "rotate-180")}
          />
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="بستن"
          className="rounded-full p-1 hover:bg-surface-muted"
        >
          <X className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
