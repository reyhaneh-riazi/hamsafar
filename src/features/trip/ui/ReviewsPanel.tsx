import { useState } from "react";
import { Star } from "lucide-react";
import { Link } from "react-router";
import { ReportButton } from "@/features/users/ui/ReportButton";
import { errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useReviewTargets, useSubmitReview } from "../hooks";

/** Post-trip ratings (FS 10): once per co-traveller, 1–5 stars + comment, members only. */
export function ReviewsPanel({ tourId }: { tourId: string }) {
  const { data, isPending, isError, refetch } = useReviewTargets(tourId, true);
  if (isPending) return <Skeleton className="h-48" />;
  if (isError || !data)
    return (
      <ErrorState
        text="دریافت همسفران ممکن نشد."
        onRetry={() => void refetch()}
      />
    );
  return (
    <section
      className="rounded-panel border border-line bg-surface p-5 sm:p-6"
      aria-labelledby="rv-title"
    >
      <h2 id="rv-title" className="text-base font-black">
        امتیاز به همسفران
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        به هر همسفر فقط یک بار می‌توانید امتیاز بدهید؛ امتیازها در پروفایل عمومی
        او نمایش داده می‌شود.
      </p>
      <ul className="mt-5 space-y-4">
        {data.items.map((t) => (
          <ReviewRow key={t.person.id} tourId={tourId} target={t} />
        ))}
      </ul>
    </section>
  );
}

function ReviewRow({
  tourId,
  target,
}: {
  tourId: string;
  target: {
    person: { id: string; displayName: string; avatarUrl: string | null };
    myRating: number | null;
    myComment: string | null;
  };
}) {
  const submit = useSubmitReview(tourId);
  const toast = useToast();
  const [rating, setRating] = useState(target.myRating ?? 0);
  const [comment, setComment] = useState(target.myComment ?? "");
  const done = target.myRating !== null;

  return (
    <li className="rounded-2xl border border-line p-4">
      <div className="flex items-center gap-3">
        <Avatar
          name={target.person.displayName}
          src={target.person.avatarUrl}
        />
        <Link
          to={`/users/${target.person.id}`}
          className="flex-1 text-sm font-black hover:text-coral-500"
        >
          {target.person.displayName}
        </Link>
        <ReportButton
          targetType="user"
          targetId={target.person.id}
          label="گزارش تخلف"
        />
      </div>
      <div
        className="mt-3 flex items-center gap-1"
        role="radiogroup"
        aria-label={`امتیاز به ${target.person.displayName}`}
      >
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${toFaDigits(n)} ستاره`}
            disabled={done}
            onClick={() => setRating(n)}
            className="rounded p-0.5 disabled:cursor-default"
          >
            <Star
              className={cn(
                "size-6 transition",
                n <= rating ? "fill-coral-500 text-coral-500" : "text-line",
              )}
            />
          </button>
        ))}
      </div>
      {done ? (
        target.myComment && (
          <p className="mt-2 text-xs leading-6 text-ink-muted">
            «{target.myComment}»
          </p>
        )
      ) : (
        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            maxLength={300}
            placeholder="نظر کوتاه درباره همسفری با او..."
            aria-label="نظر"
            className="h-11 flex-1 rounded-xl border border-line bg-surface px-3 text-sm outline-none focus:border-forest-400"
          />
          <Button
            disabled={!rating}
            loading={submit.isPending}
            onClick={() =>
              submit.mutate(
                {
                  targetUserId: target.person.id,
                  rating,
                  comment: comment.trim(),
                },
                {
                  onSuccess: () => toast.success("امتیاز ثبت شد."),
                  onError: (e) => toast.error(errorMessage(e)),
                },
              )
            }
          >
            ثبت امتیاز
          </Button>
        </div>
      )}
    </li>
  );
}
