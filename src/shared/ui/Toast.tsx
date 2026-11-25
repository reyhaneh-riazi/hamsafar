import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Check, Info, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

type ToastKind = "success" | "error" | "info";
interface ToastItem {
  id: number;
  kind: ToastKind;
  text: string;
}

interface ToastApi {
  success: (text: string) => void;
  error: (text: string) => void;
  info: (text: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS = { success: Check, error: X, info: Info } as const;
const BADGE = {
  success: "bg-[#22c55e]",
  error: "bg-danger",
  info: "bg-info",
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    setItems((list) => list.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
  }, []);

  const push = useCallback(
    (kind: ToastKind, text: string) => {
      const id = nextId.current++;
      setItems((list) => [...list.slice(-3), { id, kind, text }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), kind === "error" ? 6000 : 4000),
      );
    },
    [dismiss],
  );

  useEffect(() => {
    const map = timers.current;
    return () => map.forEach((timer) => clearTimeout(timer));
  }, []);

  const api = useMemo<ToastApi>(
    () => ({
      success: (text) => push("success", text),
      error: (text) => push("error", text),
      info: (text) => push("info", text),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* Figma «FLOATING SUCCESS MODAL / TOAST» (41:187): white pill, bottom-right corner. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 z-toast flex flex-col items-center gap-2 px-4 sm:items-start sm:ps-6 lg:bottom-6"
      >
        {items.map((t) => {
          const Icon = ICONS[t.kind];
          return (
            <div
              key={t.id}
              role={t.kind === "error" ? "alert" : "status"}
              className="pointer-events-auto flex w-full max-w-md animate-pop items-center gap-2.5 rounded-full border border-slate-300/80 bg-surface-raised py-2 pe-3 ps-2.5 shadow-[0_20px_40px_-12px_rgba(0,0,0,0.18)] sm:w-auto dark:border-line"
            >
              <span
                className={cn(
                  "inline-flex size-6 shrink-0 items-center justify-center rounded-full text-white",
                  BADGE[t.kind],
                )}
              >
                <Icon className="size-4" aria-hidden="true" />
              </span>
              <p className="flex-1 text-sm font-bold leading-6 text-ink">
                {t.text}
              </p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="بستن پیام"
                className="rounded-full p-1 text-ink-soft hover:bg-surface-muted hover:text-ink"
              >
                <X className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
