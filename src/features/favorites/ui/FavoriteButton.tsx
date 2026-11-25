import { Heart } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useSession } from "@/features/auth/hooks";
import type { TourSummary } from "@/features/tours/api/tour-schemas";
import { errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { useToast } from "@/shared/ui/Toast";
import { useFavoriteIds, useToggleFavorite } from "../hooks";

/** Heart toggle used on every tour card and the tour page — state is shared through React Query. */
export function FavoriteButton({
  tour,
  variant = "glass",
}: {
  tour: TourSummary;
  variant?: "glass" | "surface" | "block";
}) {
  const { user } = useSession();
  const ids = useFavoriteIds();
  const toggle = useToggleFavorite();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const active = ids.has(tour.id);

  const onClick = () => {
    if (!user) {
      navigate(
        `/auth?next=${encodeURIComponent(location.pathname + location.search)}`,
      );
      return;
    }
    toggle.mutate(
      { tour, favorite: !active },
      {
        onSuccess: () =>
          toast.success(
            active ? "از علاقه‌مندی‌ها حذف شد." : "به علاقه‌مندی‌ها اضافه شد.",
          ),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );
  };

  if (variant === "block") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface px-4 py-2.5 text-sm font-bold text-ink transition hover:border-coral-300"
      >
        <Heart
          className={cn("size-4", active && "fill-coral-500 text-coral-500")}
          aria-hidden="true"
        />
        {active ? "ذخیره شده" : "ذخیره سفر"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={
        active
          ? `حذف ${tour.title} از علاقه‌مندی‌ها`
          : `افزودن ${tour.title} به علاقه‌مندی‌ها`
      }
      className={cn(
        "relative z-[1] inline-flex size-9 items-center justify-center rounded-full transition-all duration-200 active:scale-90",
        variant === "glass"
          ? "size-8 bg-white/80 text-slate-500 backdrop-blur-[6px] hover:bg-white dark:bg-forest-950/70 dark:text-white/80"
          : "border border-line bg-surface text-ink shadow-card hover:-translate-y-0.5",
      )}
    >
      <Heart
        className={cn(
          variant === "glass" ? "size-4" : "size-[18px]",
          "transition-transform",
          active && "scale-110 fill-coral-500 text-coral-500",
        )}
        aria-hidden="true"
      />
    </button>
  );
}
