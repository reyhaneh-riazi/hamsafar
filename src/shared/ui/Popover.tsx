import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/shared/lib/cn";

interface PopoverProps {
  /** Renders the trigger; receives props to spread onto a button. */
  trigger: (props: {
    onClick: () => void;
    "aria-expanded": boolean;
    "aria-controls": string;
  }) => ReactNode;
  children: (close: () => void) => ReactNode;
  className?: string;
  panelClassName?: string;
}

/** Small dropdown panel: closes on outside click and Escape, returns focus to the trigger area. */
export function Popover({
  trigger,
  children,
  className,
  panelClassName,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) =>
      !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={cn("relative", className)}>
      {trigger({
        onClick: () => setOpen((v) => !v),
        "aria-expanded": open,
        "aria-controls": id,
      })}
      {open && (
        <div
          id={id}
          className={cn(
            "absolute top-full z-drawer mt-2 animate-pop rounded-2xl border border-slate-200 bg-white shadow-float dark:border-line dark:bg-surface-raised",
            panelClassName,
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}
