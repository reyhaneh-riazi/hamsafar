import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export interface MenuOption {
  value: string;
  label: string;
}

interface OptionMenuProps {
  icon: ReactNode;
  label: string;
  /** Text shown when a value is selected (falls back to the label). */
  valueLabel?: string;
  value: string;
  options: readonly MenuOption[];
  onChange: (value: string) => void;
  className?: string;
  align?: "start" | "end";
}

/** Compact single-select dropdown with keyboard support (arrows, Enter, Escape). */
export function OptionMenu({
  icon,
  label,
  valueLabel,
  value,
  options,
  onChange,
  className,
  align = "start",
}: OptionMenuProps) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    const idx = Math.max(
      0,
      options.findIndex((o) => o.value === value),
    );
    setActive(idx);
    requestAnimationFrame(() => listRef.current?.focus());
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, options, value]);

  const choose = (v: string) => {
    onChange(v);
    setOpen(false);
  };

  const onListKey = (e: KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => Math.min(options.length - 1, i + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[active];
      if (opt) choose(opt.value);
    } else if (e.key === "Escape" || e.key === "Tab") {
      setOpen(false);
    }
  };

  const selected = Boolean(value);

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        className={cn(
          "group flex w-full items-center justify-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors hover:bg-surface-muted",
          selected ? "text-forest-700 dark:text-forest-200" : "text-ink",
        )}
      >
        <span
          className={cn(
            "transition-transform group-hover:-translate-y-0.5",
            selected
              ? "text-coral-500"
              : "text-forest-800 dark:text-forest-200",
          )}
        >
          {icon}
        </span>
        <span className="truncate">
          {selected ? (valueLabel ?? label) : label}
        </span>
        <ChevronDown
          className={cn(
            "size-3.5 shrink-0 text-ink-soft transition-transform",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          tabIndex={-1}
          aria-label={label}
          aria-activedescendant={`${listId}-${active}`}
          onKeyDown={onListKey}
          className={cn(
            "absolute top-full z-drawer mt-2 max-h-72 w-56 animate-pop overflow-y-auto rounded-2xl border border-line bg-surface-raised p-1.5 shadow-float outline-none",
            align === "start" ? "start-0" : "end-0",
          )}
        >
          {options.map((o, i) => (
            <li
              key={o.value || "all"}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={o.value === value}
              onMouseEnter={() => setActive(i)}
              onClick={() => choose(o.value)}
              className={cn(
                "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-sm",
                i === active && "bg-surface-muted",
                o.value === value
                  ? "font-bold text-forest-700 dark:text-forest-200"
                  : "text-ink",
              )}
            >
              {o.label}
              {o.value === value && (
                <Check className="size-4 text-coral-500" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
