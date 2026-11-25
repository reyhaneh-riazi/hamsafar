import { Star } from "lucide-react";
import { formatRating } from "@/shared/lib/format";

export function Rating({
  value,
  className,
}: {
  value: number;
  className?: string;
}) {
  return (
    <span
      className={
        className ??
        "inline-flex items-center gap-1 text-sm font-extrabold text-coral-500"
      }
    >
      <Star className="size-4 fill-current" aria-hidden="true" />
      <span aria-label={`امتیاز ${formatRating(value)} از ۵`}>
        {formatRating(value)}
      </span>
    </span>
  );
}
