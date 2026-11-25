import { useState } from "react";
import { cn } from "@/shared/lib/cn";

const TONES = [
  "bg-forest-100 text-forest-800",
  "bg-coral-100 text-coral-700",
  "bg-tint-lilac text-forest-800 dark:text-forest-100",
  "bg-tint-sky text-info",
  "bg-tint-butter text-warning",
] as const;

function hash(text: string) {
  let h = 0;
  for (const ch of text) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h;
}

/** Profile photo when available, otherwise an initials avatar with a deterministic colour. */
export function Avatar({
  name,
  src,
  size = "md",
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length > 1
      ? `${parts[0]?.[0] ?? ""}‌${parts[1]?.[0] ?? ""}`
      : (parts[0]?.slice(0, 2) ?? "؟");
  const sizes = {
    sm: "size-8 text-xs",
    md: "size-10 text-sm",
    lg: "size-14 text-lg",
    xl: "size-24 text-3xl",
  } as const;

  const showImage = Boolean(src && failedSrc !== src);

  if (showImage && src) {
    return (
      <img
        src={src}
        alt=""
        aria-hidden="true"
        onError={() => setFailedSrc(src)}
        className={cn(
          "shrink-0 rounded-full object-cover",
          sizes[size],
          className,
        )}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-black",
        TONES[hash(name) % TONES.length],
        sizes[size],
        className,
      )}
    >
      {initials}
    </span>
  );
}
