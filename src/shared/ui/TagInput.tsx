import { useId, useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";

interface TagInputProps {
  label: string;
  value: readonly string[];
  onChange: (next: string[]) => void;
  maxItems: number;
  maxLength: number;
  placeholder?: string;
  hint?: string;
  error?: string;
  suggestions?: readonly string[];
}

/**
 * Free-text list field (languages, interests): type and press Enter or «،» to add, Backspace on an
 * empty input removes the last item. Prevents duplicates and enforces count/length limits.
 */
export function TagInput({
  label,
  value,
  onChange,
  maxItems,
  maxLength,
  placeholder,
  hint,
  error,
  suggestions = [],
}: TagInputProps) {
  const id = useId();
  const [draft, setDraft] = useState("");
  const [local, setLocal] = useState<string | null>(null);
  const full = value.length >= maxItems;

  const add = (raw: string) => {
    const tag = raw.replace(/[،,]/g, "").trim();
    if (!tag) return;
    if (tag.length > maxLength)
      return setLocal(`هر مورد حداکثر ${toFaDigits(maxLength)} حرف است.`);
    if (value.includes(tag)) return setLocal("این مورد قبلاً اضافه شده است.");
    if (full) return setLocal(`حداکثر ${toFaDigits(maxItems)} مورد.`);
    setLocal(null);
    onChange([...value, tag]);
    setDraft("");
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === "," || e.key === "،") {
      e.preventDefault();
      add(draft);
    } else if (e.key === "Backspace" && !draft && value.length) {
      onChange(value.slice(0, -1));
    }
  };

  const message = error ?? local;
  const unused = suggestions.filter((s) => !value.includes(s)).slice(0, 6);

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-bold text-ink">
        {label}
        <span className="ms-2 text-xs font-normal text-ink-soft">
          {toFaDigits(value.length)} از {toFaDigits(maxItems)}
        </span>
      </label>
      <div
        className={cn(
          "flex min-h-12 flex-wrap items-center gap-1.5 rounded-xl border bg-surface px-2 py-1.5 focus-within:ring-4",
          message
            ? "border-danger focus-within:ring-danger/15"
            : "border-line focus-within:border-forest-500 focus-within:ring-forest-500/12",
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-tint-mint py-1 pe-1 ps-2.5 text-xs font-bold text-forest-800 dark:text-forest-100"
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(value.filter((t) => t !== tag))}
              aria-label={`حذف ${tag}`}
              className="rounded-full p-0.5 hover:bg-black/10"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            if (/[،,]$/.test(e.target.value)) add(e.target.value);
          }}
          onKeyDown={onKeyDown}
          onBlur={() => draft.trim() && add(draft)}
          disabled={full}
          placeholder={full ? "به سقف رسیدید" : placeholder}
          aria-invalid={message ? true : undefined}
          aria-describedby={`${id}-hint`}
          maxLength={maxLength + 1}
          className="h-8 min-w-[8rem] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-ink-soft disabled:cursor-not-allowed"
        />
      </div>
      {unused.length > 0 && !full && (
        <div className="flex flex-wrap gap-1.5">
          {unused.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-full border border-dashed border-line px-2.5 py-0.5 text-[11px] text-ink-muted hover:border-forest-400 hover:text-ink"
            >
              + {s}
            </button>
          ))}
        </div>
      )}
      <p
        id={`${id}-hint`}
        role={message ? "alert" : undefined}
        className={cn(
          "text-xs",
          message ? "font-medium text-danger" : "text-ink-soft",
        )}
      >
        {message ?? hint ?? "بنویسید و Enter بزنید."}
      </p>
    </div>
  );
}
