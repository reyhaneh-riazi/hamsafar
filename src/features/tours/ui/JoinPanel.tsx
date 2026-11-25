import { useState } from "react";
import { LogIn, UserCheck, UserPlus } from "lucide-react";
import { useLocation } from "react-router";
import { useSession } from "@/features/auth/hooks";
import { errorMessage } from "@/shared/api/errors";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/Toast";
import type { TourDetail } from "../api/tour-schemas";
import { useCancelJoin } from "../hooks";
import { JOIN_STATUS_META } from "../model/labels";

/** Join / cancel actions. Nothing is shown as confirmed until the server says so. */
export function JoinPanel({
  tour,
  onJoin,
}: {
  tour: TourDetail;
  onJoin: () => void;
}) {
  const { user } = useSession();
  const location = useLocation();
  const toast = useToast();
  const [confirmCancel, setConfirmCancel] = useState(false);
  const cancel = useCancelJoin(tour.id);
  const membership = tour.viewer.membership;
  const closed = tour.status === "cancelled" || tour.status === "completed";

  if (!user) {
    return (
      <ButtonLink
        to={`/auth?next=${encodeURIComponent(location.pathname)}`}
        size="lg"
        className="mt-5 w-full"
        icon={<LogIn className="size-5" />}
      >
        ورود برای پیوستن به تور
      </ButtonLink>
    );
  }
  if (tour.viewer.isCreator) {
    return (
      <p className="mt-6 rounded-2xl bg-tint-mint p-4 text-center text-sm font-bold text-forest-800 dark:text-forest-100">
        شما برگزارکننده این تور هستید.
      </p>
    );
  }

  const doCancel = () => {
    cancel.mutate(undefined, {
      onSuccess: () => {
        setConfirmCancel(false);
        toast.success("درخواست شما لغو شد.");
      },
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  return (
    <div className="mt-5 space-y-3">
      {membership && membership.status !== "rejected" && (
        <div className="flex items-center justify-between rounded-2xl bg-surface-muted p-3">
          <span className="flex items-center gap-2 text-sm font-bold">
            <UserCheck className="size-4 text-forest-600" aria-hidden="true" />
            وضعیت شما
          </span>
          <Badge tone={JOIN_STATUS_META[membership.status].tone}>
            {JOIN_STATUS_META[membership.status].label}
          </Badge>
        </div>
      )}
      {membership?.status === "rejected" && (
        <p className="text-xs text-danger">
          درخواست قبلی شما رد شده است؛ می‌توانید دوباره درخواست دهید.
        </p>
      )}

      {tour.viewer.canRequestJoin && (
        <Button
          size="lg"
          fullWidth
          icon={<UserPlus className="size-5" />}
          onClick={onJoin}
        >
          درخواست پیوستن
        </Button>
      )}
      {membership &&
        (membership.status === "pending" || membership.status === "approved") &&
        !closed && (
          <Button
            variant="outline"
            fullWidth
            onClick={() => setConfirmCancel(true)}
          >
            {membership.status === "pending" ? "لغو درخواست" : "انصراف از سفر"}
          </Button>
        )}
      {!tour.viewer.canRequestJoin && !membership && (
        <p className="rounded-2xl bg-surface-muted p-4 text-center text-sm text-ink-muted">
          {closed
            ? "این تور دیگر درخواست جدید نمی‌پذیرد."
            : "ظرفیت این تور تکمیل شده است."}
        </p>
      )}

      <Modal
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        title="لغو حضور در تور؟"
        size="sm"
        dismissible={!cancel.isPending}
      >
        <p className="text-sm leading-7 text-ink-muted">
          با لغو، جای شما آزاد می‌شود و برای پیوستن دوباره باید درخواست جدید
          بدهید. شرایط بازگشت هزینه طبق قوانین تور اعمال می‌شود.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            variant="ghost"
            onClick={() => setConfirmCancel(false)}
            disabled={cancel.isPending}
          >
            منصرف شدم
          </Button>
          <Button
            variant="danger"
            onClick={doCancel}
            loading={cancel.isPending}
          >
            بله، لغو شود
          </Button>
        </div>
      </Modal>
    </div>
  );
}
