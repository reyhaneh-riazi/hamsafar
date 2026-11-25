import { useEffect, useId, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  /** Prevent closing (e.g. while a request is in flight). */
  dismissible?: boolean;
}

const SIZES = { sm: "max-w-md", md: "max-w-xl", lg: "max-w-3xl" } as const;
const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

/** Accessible dialog: focus trap, Escape to close, focus returns to the opener, body scroll lock. */
export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  size = "md",
  dismissible = true,
}: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const opener = document.activeElement as HTMLElement | null;
    const panel = panelRef.current;
    const first =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && dismissible) {
        event.stopPropagation();
        onCloseRef.current();
      }
      if (event.key === "Tab" && panel) {
        const items = Array.from(
          panel.querySelectorAll<HTMLElement>(FOCUSABLE),
        );
        const firstItem = items[0];
        const lastItem = items[items.length - 1];
        if (!firstItem || !lastItem) return;
        if (event.shiftKey && document.activeElement === firstItem) {
          event.preventDefault();
          lastItem.focus();
        } else if (!event.shiftKey && document.activeElement === lastItem) {
          event.preventDefault();
          firstItem.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      opener?.focus?.();
    };
  }, [open, dismissible]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-end justify-center p-0 sm:items-center sm:p-6">
      <div
        className="absolute inset-0 animate-fade-in bg-forest-950/55 backdrop-blur-[2px]"
        onClick={dismissible ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descId : undefined}
        className={cn(
          "relative max-h-[92dvh] w-full animate-pop overflow-y-auto rounded-t-panel bg-surface-raised p-6 shadow-float sm:rounded-panel sm:p-8",
          SIZES[size],
        )}
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 id={titleId} className="text-lg font-black text-ink sm:text-xl">
              {title}
            </h2>
            {description && (
              <p id={descId} className="mt-1 text-sm leading-7 text-ink-muted">
                {description}
              </p>
            )}
          </div>
          {dismissible && (
            <button
              type="button"
              onClick={onClose}
              aria-label="بستن"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-full text-ink-muted hover:bg-surface-muted hover:text-ink"
            >
              <X className="size-5" />
            </button>
          )}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
