import { useState } from "react";
import { Flag } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import { useSession } from "@/features/auth/hooks";
import { errorMessage } from "@/shared/api/errors";
import { Button } from "@/shared/ui/Button";
import { TextArea } from "@/shared/ui/Field";
import { Modal } from "@/shared/ui/Modal";
import { useToast } from "@/shared/ui/Toast";
import { useReport } from "../hooks";

/** Report a user, tour or comment to the admin queue (FS 10). */
export function ReportButton({
  targetType,
  targetId,
  label,
  iconOnly,
}: {
  targetType: "user" | "tour" | "comment";
  targetId: string;
  label: string;
  iconOnly?: boolean;
}) {
  const { user } = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const report = useReport();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (reason.trim().length < 5)
      return setError("دلیل گزارش را حداقل در ۵ حرف بنویسید.");
    setError(null);
    report.mutate(
      { targetType, targetId, reason: reason.trim() },
      {
        onSuccess: () => {
          setOpen(false);
          setReason("");
          toast.success("گزارش شما برای بررسی به مدیر سامانه ارسال شد.");
        },
        onError: (err) => setError(errorMessage(err)),
      },
    );
  };

  return (
    <>
      <button
        type="button"
        onClick={() =>
          user
            ? setOpen(true)
            : navigate(
                `/auth?next=${encodeURIComponent(location.pathname + location.search)}`,
              )
        }
        aria-label={label}
        title={label}
        className={
          iconOnly
            ? "inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-ink-soft transition hover:bg-danger/10 hover:text-danger"
            : "inline-flex items-center gap-1.5 text-xs font-bold text-ink-muted transition hover:text-danger"
        }
      >
        <Flag className="size-3.5" aria-hidden="true" />
        {!iconOnly && label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={label}
        description="گزارش‌ها محرمانه‌اند و توسط مدیر سامانه بررسی می‌شوند."
        size="sm"
        dismissible={!report.isPending}
      >
        <TextArea
          label="دلیل گزارش"
          required
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          error={error ?? undefined}
          data-autofocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={report.isPending}
          >
            انصراف
          </Button>
          <Button variant="danger" onClick={submit} loading={report.isPending}>
            ارسال گزارش
          </Button>
        </div>
      </Modal>
    </>
  );
}
