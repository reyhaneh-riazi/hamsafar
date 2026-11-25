import type { ReactNode } from "react";
import { CloudOff, Lock, SearchX, WifiOff } from "lucide-react";
import { describeError } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { Button } from "./Button";

interface StateProps {
  title: string;
  text?: string;
  action?: ReactNode;
  className?: string;
}

function StateShell({
  icon,
  title,
  text,
  action,
  className,
}: StateProps & { icon: ReactNode }) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-panel border border-dashed border-line bg-surface/60 px-6 py-14 text-center",
        className,
      )}
    >
      <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-surface-muted text-brand">
        {icon}
      </div>
      <h3 className="text-base font-black text-ink">{title}</h3>
      {text && (
        <p className="mt-2 max-w-md text-sm leading-7 text-ink-muted">{text}</p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function EmptyState(props: StateProps & { icon?: ReactNode }) {
  return (
    <StateShell
      icon={props.icon ?? <SearchX className="size-7" />}
      {...props}
    />
  );
}

/**
 * Error view. Pass `error` to get a title/message that matches the failure (offline, server
 * error, timeout...). `title`/`text` override it.
 */
export function ErrorState({
  title,
  text,
  error,
  onRetry,
  className,
}: {
  title?: string;
  text?: string;
  error?: unknown;
  onRetry?: () => void;
  className?: string;
}) {
  const described = error !== undefined ? describeError(error) : null;
  const offline =
    described?.kind === "network" || described?.kind === "timeout";
  const canRetry =
    onRetry &&
    (described ? described.retryable || described.kind === "client" : true);
  return (
    <StateShell
      icon={
        offline ? (
          <WifiOff className="size-7" />
        ) : (
          <CloudOff className="size-7" />
        )
      }
      title={title ?? described?.title ?? "مشکلی پیش آمد"}
      text={
        [text, described && described.text !== text ? described.text : null]
          .filter(Boolean)
          .join(" ") || undefined
      }
      className={className}
      action={
        canRetry ? (
          <Button variant="outline" size="sm" onClick={onRetry}>
            تلاش دوباره
          </Button>
        ) : undefined
      }
    />
  );
}

export function ForbiddenState({
  text = "دسترسی به این بخش برای حساب شما فعال نیست.",
}: {
  text?: string;
}) {
  return (
    <StateShell
      icon={<Lock className="size-7" />}
      title="دسترسی محدود"
      text={text}
    />
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("skeleton rounded-xl", className)} aria-hidden="true" />
  );
}

export function PageLoader() {
  return (
    <div
      className="mx-auto max-w-page px-4 py-16 sm:px-6 lg:px-8"
      role="status"
      aria-label="در حال بارگذاری"
    >
      <Skeleton className="h-8 w-56" />
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }, (_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
