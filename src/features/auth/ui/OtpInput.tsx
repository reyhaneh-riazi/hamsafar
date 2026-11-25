import {
  useEffect,
  useRef,
  type ClipboardEvent,
  type KeyboardEvent,
} from "react";
import { toLatinDigits } from "@/shared/lib/digits";
import { cn } from "@/shared/lib/cn";

interface OtpInputProps {
  length: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  invalid?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}

/**
 * One-time-code cells. Digits run left-to-right (LTR island) inside the RTL page.
 * Supports typing, Persian/Arabic digits, paste of the full code, arrow keys and Backspace.
 */
export function OtpInput({
  length,
  value,
  onChange,
  onComplete,
  invalid,
  disabled,
  autoFocus,
}: OtpInputProps) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = Array.from({ length }, (_, i) => value[i] ?? "");

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  const focus = (i: number) =>
    refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  const commit = (next: string) => {
    const clean = next.slice(0, length);
    onChange(clean);
    if (clean.length === length && !clean.includes(" ")) onComplete?.(clean);
  };

  const setAt = (i: number, digit: string) => {
    const arr = digits.slice();
    arr[i] = digit;
    commit(arr.join("").replace(/\s+$/, ""));
  };

  const onInput = (i: number, raw: string) => {
    const only = toLatinDigits(raw).replace(/\D/g, "");
    if (!only) return;
    if (only.length > 1) {
      // Typed fast or OS autofill put several digits in one cell.
      const merged = (digits.slice(0, i).join("") + only).slice(0, length);
      commit(merged);
      focus(merged.length);
      return;
    }
    setAt(i, only);
    focus(i + 1);
  };

  const onKeyDown = (i: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      if (digits[i]) {
        commit(digits.slice(0, i).join(""));
      } else if (i > 0) {
        commit(digits.slice(0, i - 1).join(""));
        focus(i - 1);
      }
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      focus(i - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      focus(i + 1);
    }
  };

  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
    const pasted = toLatinDigits(e.clipboardData.getData("text"))
      .replace(/\D/g, "")
      .slice(0, length);
    if (!pasted) return;
    e.preventDefault();
    commit(pasted);
    focus(pasted.length);
  };

  return (
    <div
      dir="ltr"
      className={cn(
        "flex justify-center gap-2.5 sm:gap-3",
        invalid && "animate-shake",
      )}
      role="group"
      aria-label="کد تأیید"
    >
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          value={d}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
          onPaste={onPaste}
          onFocus={(e) => e.target.select()}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          maxLength={length}
          disabled={disabled}
          aria-label={`رقم ${i + 1} از ${length}`}
          aria-invalid={invalid || undefined}
          className={cn(
            "size-12 rounded-xl border-2 bg-surface text-center text-xl font-black text-ink outline-none transition-all sm:size-14 sm:text-2xl",
            "focus:border-forest-500 focus:ring-4 focus:ring-forest-500/15 disabled:opacity-60",
            invalid ? "border-danger" : d ? "border-forest-400" : "border-line",
          )}
        />
      ))}
    </div>
  );
}
