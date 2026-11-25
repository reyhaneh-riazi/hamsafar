import { CircleAlert, CircleCheck } from "lucide-react";
import { describeError } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { Spinner } from "./Spinner";

export type RequestStatus = "idle" | "loading" | "success" | "error";

interface RequestFeedbackProps {
  status: RequestStatus;
  loadingText?: string;
  successText?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}

/**
 * Inline result of a write request (submit, upload, accept...). Announced to screen readers;
 * complements toasts on forms where the user should see the outcome next to the action.
 */
export function RequestFeedback({
  status,
  loadingText = "در حال ارسال...",
  successText = "انجام شد.",
  error,
  onRetry,
  className,
}: RequestFeedbackProps) {
  if (status === "idle") return null;
  const described = status === "error" ? describeError(error) : null;
  return (
    <div
      role={status === "error" ? "alert" : "status"}
      aria-live="polite"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        status === "loading" && "border-line bg-surface-muted text-ink-muted",
        status === "success" && "border-success/30 bg-success/10 text-success",
        status === "error" && "border-danger/30 bg-danger/10 text-danger",
        className,
      )}
    >
      {status === "loading" && <Spinner className="mt-0.5 size-4 shrink-0" />}
      {status === "success" && (
        <CircleCheck className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      {status === "error" && (
        <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      )}
      <div className="min-w-0 flex-1">
        {status === "loading" && loadingText}
        {status === "success" && successText}
        {described && (
          <>
            <span className="font-bold">{described.title}: </span>
            {described.text}
          </>
        )}
      </div>
      {status === "error" && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="shrink-0 text-xs font-bold underline-offset-4 hover:underline"
        >
          تلاش دوباره
        </button>
      )}
    </div>
  );
}

/** Maps a React Query mutation to {@link RequestStatus}. */
export function mutationStatus(m: {
  isPending: boolean;
  isError: boolean;
  isSuccess: boolean;
}): RequestStatus {
  if (m.isPending) return "loading";
  if (m.isError) return "error";
  if (m.isSuccess) return "success";
  return "idle";
}
