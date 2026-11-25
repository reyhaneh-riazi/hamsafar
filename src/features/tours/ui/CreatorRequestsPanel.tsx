import { Check, Inbox, X } from "lucide-react";
import { Link } from "react-router";
import { errorMessage } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useCreatorRequests, useDecideRequest } from "../hooks";
import { JOIN_STATUS_META } from "../model/labels";

/** Creator-only panel: membership requests for this tour (server enforces the permission). */
export function CreatorRequestsPanel({ tourId }: { tourId: string }) {
  const { data, isPending, isError, refetch } = useCreatorRequests(
    tourId,
    true,
  );
  const decide = useDecideRequest();
  const toast = useToast();

  const act = (requestId: string, decision: "approve" | "reject") =>
    decide.mutate(
      { requestId, decision },
      {
        onSuccess: () =>
          toast.success(
            decision === "approve" ? "درخواست تأیید شد." : "درخواست رد شد.",
          ),
        onError: (err) => toast.error(errorMessage(err)),
      },
    );

  return (
    <section
      className="rounded-panel border-2 border-dashed border-forest-200 bg-surface p-6 sm:p-7 dark:border-line"
      aria-labelledby="creator-requests"
    >
      <h2 id="creator-requests" className="text-lg font-black">
        درخواست‌های پیوستن
      </h2>
      <p className="mt-1 text-xs text-ink-muted">
        فقط شما به‌عنوان برگزارکننده این بخش را می‌بینید.
      </p>
      <div className="mt-5 space-y-3">
        {isPending && <Skeleton className="h-20" />}
        {isError && (
          <ErrorState
            text="دریافت درخواست‌ها ممکن نشد."
            onRetry={() => void refetch()}
          />
        )}
        {data?.length === 0 && (
          <p className="flex items-center gap-2 rounded-2xl bg-surface-muted p-4 text-sm text-ink-muted">
            <Inbox className="size-5" aria-hidden="true" />
            هنوز درخواستی ثبت نشده است.
          </p>
        )}
        {data?.map((r) => {
          const busy = decide.isPending && decide.variables?.requestId === r.id;
          return (
            <div
              key={r.id}
              className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-center"
            >
              <div className="flex flex-1 items-start gap-3">
                <Avatar
                  name={r.applicant.displayName}
                  src={r.applicant.avatarUrl}
                />
                <div className="min-w-0">
                  <p className="text-sm font-black">
                    <Link
                      to={`/users/${r.applicant.id}`}
                      className="hover:text-coral-500"
                    >
                      {r.applicant.displayName}
                    </Link>
                    {r.applicant.city && (
                      <span className="ms-2 text-xs font-medium text-ink-soft">
                        {r.applicant.city}
                      </span>
                    )}
                  </p>
                  {r.message && (
                    <p className="mt-1 text-xs leading-6 text-ink-muted">
                      «{r.message}»
                    </p>
                  )}
                  <p className="mt-1 text-[11px] text-ink-soft">
                    {formatDateTime(r.createdAt)}
                  </p>
                </div>
              </div>
              {r.status === "pending" ? (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={<Check className="size-4" />}
                    loading={busy && decide.variables?.decision === "approve"}
                    disabled={busy}
                    onClick={() => act(r.id, "approve")}
                  >
                    تأیید
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    icon={<X className="size-4" />}
                    loading={busy && decide.variables?.decision === "reject"}
                    disabled={busy}
                    onClick={() => act(r.id, "reject")}
                  >
                    رد
                  </Button>
                </div>
              ) : (
                <Badge tone={JOIN_STATUS_META[r.status].tone}>
                  {JOIN_STATUS_META[r.status].label}
                </Badge>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
