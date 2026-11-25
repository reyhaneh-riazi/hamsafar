import { useState } from "react";
import { Copy, Link2, Plus, Trash2 } from "lucide-react";
import { errorMessage } from "@/shared/api/errors";
import { formatDateTime } from "@/shared/lib/format";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { QueryState } from "@/shared/ui/QueryState";
import { EmptyState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useCreateInvite, useRevokeInvite, useTourInvites } from "../hooks";
import { INVITE_STATUS_META, inviteUrl } from "../model/invite-status";

const EXPIRY_OPTIONS = [
  { hours: 24, label: "۲۴ ساعت" },
  { hours: 72, label: "۳ روز" },
  { hours: 168, label: "۷ روز" },
] as const;

/** Leader tool: create single-use invite links and see whether each one is valid, expired or used. */
export function InviteLinksPanel({
  tourId,
  disabled,
}: {
  tourId: string;
  disabled?: boolean;
}) {
  const invites = useTourInvites(tourId);
  const create = useCreateInvite(tourId);
  const revoke = useRevokeInvite(tourId);
  const toast = useToast();
  const [hours, setHours] = useState<number>(72);

  const copy = async (token: string) => {
    try {
      await navigator.clipboard.writeText(inviteUrl(token));
      toast.success("لینک دعوت کپی شد.");
    } catch {
      toast.info(inviteUrl(token));
    }
  };

  return (
    <div>
      <p className="mb-4 text-xs leading-6 text-ink-muted">
        هر لینک فقط یک بار قابل استفاده است. کسی که با لینک معتبر وارد شود بدون
        نیاز به تأیید جداگانه عضو تور می‌شود (تا تکمیل ظرفیت).
      </p>
      {!disabled && (
        <div className="mb-5 flex flex-col gap-3 rounded-2xl bg-surface-muted p-4 sm:flex-row sm:items-end">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-bold">
            مدت اعتبار لینک
            <select
              value={hours}
              onChange={(e) => setHours(Number(e.target.value))}
              className="h-11 rounded-xl border border-line bg-surface px-3 text-sm font-medium"
            >
              {EXPIRY_OPTIONS.map((o) => (
                <option key={o.hours} value={o.hours}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <Button
            icon={<Plus className="size-4" />}
            loading={create.isPending}
            onClick={() =>
              create.mutate(
                { expiresInHours: hours },
                {
                  onSuccess: (inv) => {
                    toast.success("لینک دعوت ساخته شد.");
                    void copy(inv.token);
                  },
                  onError: (e) => toast.error(errorMessage(e)),
                },
              )
            }
          >
            ساخت لینک دعوت
          </Button>
        </div>
      )}
      <QueryState
        query={invites}
        errorText="فهرست لینک‌ها دریافت نشد."
        loading={<Skeleton className="h-24" />}
        isEmpty={(items) => items.length === 0}
        empty={
          <EmptyState
            className="py-8"
            icon={<Link2 className="size-7" />}
            title="هنوز لینکی نساخته‌اید"
            text="با لینک دعوت، دوستانتان مستقیم به این تور می‌پیوندند."
          />
        }
      >
        {(items) => (
          <ul className="space-y-2.5">
            {items.map((inv) => {
              const meta = INVITE_STATUS_META[inv.status];
              return (
                <li
                  key={inv.token}
                  className="flex flex-col gap-3 rounded-2xl border border-line p-3.5 sm:flex-row sm:items-center"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                      <code
                        className="ltr-island truncate text-xs text-ink-muted"
                        dir="ltr"
                      >
                        /invite/{inv.token}
                      </code>
                    </div>
                    <p className="mt-1.5 text-[11px] text-ink-soft">
                      {inv.status === "used" && inv.usedAt
                        ? `استفاده‌شده توسط ${inv.usedByName ?? "یک همسفر"} در ${formatDateTime(inv.usedAt)}`
                        : inv.status === "expired"
                          ? `منقضی‌شده در ${formatDateTime(inv.expiresAt)}`
                          : inv.status === "revoked"
                            ? "توسط شما غیرفعال شد"
                            : `معتبر تا ${formatDateTime(inv.expiresAt)}`}
                    </p>
                  </div>
                  {inv.status === "valid" && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        icon={<Copy className="size-4" />}
                        onClick={() => void copy(inv.token)}
                      >
                        کپی لینک
                      </Button>
                      {!disabled && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-danger"
                          icon={<Trash2 className="size-4" />}
                          loading={
                            revoke.isPending && revoke.variables === inv.token
                          }
                          onClick={() =>
                            revoke.mutate(inv.token, {
                              onSuccess: () =>
                                toast.success("لینک غیرفعال شد."),
                              onError: (e) => toast.error(errorMessage(e)),
                            })
                          }
                        >
                          غیرفعال
                        </Button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </QueryState>
    </div>
  );
}
