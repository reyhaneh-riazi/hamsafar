import { useEffect, useRef, useState, type FormEvent } from "react";
import { Lock, SendHorizontal } from "lucide-react";
import { Link } from "react-router";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { cn } from "@/shared/lib/cn";
import { formatDateTime } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useMessages, useSendMessage } from "../hooks";

/**
 * Group chat for one tour (FS 11). Messages are stored on the server, so whoever opens the chat
 * later — in the tour page or in «پیام‌ها» — sees everything that was sent. Polls every 4 s.
 */
export function ChatThread({
  tourId,
  enabled,
  className,
}: {
  tourId: string;
  enabled: boolean;
  className?: string;
}) {
  const { data, isPending, isError, error, refetch } = useMessages(
    tourId,
    enabled,
  );
  const send = useSendMessage(tourId);
  const toast = useToast();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const count = data?.items.length ?? 0;

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [count]);

  if (!enabled) {
    return (
      <EmptyState
        icon={<Lock className="size-7" />}
        title="گفت‌وگوی گروهی هنوز فعال نیست"
        text="چت برای اعضای تأییدشده و تورلیدر، بعد از رسیدن تور به حد نصاب باز می‌شود."
        className={className}
      />
    );
  }

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    send.mutate(value, {
      onSuccess: () => setText(""),
      onError: (err) => toast.error(errorMessage(err)),
    });
  };

  if (isError) {
    const locked = error instanceof ApiError && error.code === "CHAT_LOCKED";
    return locked ? (
      <EmptyState
        icon={<Lock className="size-7" />}
        title="گفت‌وگو بسته است"
        text={error.message}
        className={className}
      />
    ) : (
      <ErrorState
        text="دریافت پیام‌ها ممکن نشد."
        onRetry={() => void refetch()}
        className={className}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[28rem] flex-col overflow-hidden rounded-panel border border-line bg-surface",
        className,
      )}
    >
      <div
        ref={listRef}
        className="flex-1 space-y-3 overflow-y-auto bg-[radial-gradient(circle_at_1px_1px,rgb(var(--c-line))_1px,transparent_0)] [background-size:18px_18px] p-4 sm:p-5"
        aria-live="polite"
      >
        {isPending && <Skeleton className="h-16 w-2/3" />}
        {data?.items.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-muted">
            هنوز پیامی نیست؛ اولین پیام را بفرستید.
          </p>
        )}
        {data?.items.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex items-end gap-2",
              m.isMine ? "flex-row" : "flex-row-reverse",
            )}
          >
            {!m.isMine && (
              <Link
                to={`/users/${m.author.id}`}
                aria-label={m.author.displayName}
              >
                <Avatar
                  name={m.author.displayName}
                  src={m.author.avatarUrl}
                  size="sm"
                />
              </Link>
            )}
            <div
              className={cn(
                "max-w-[78%] rounded-2xl px-4 py-2.5 text-sm leading-7 shadow-sm",
                m.isMine
                  ? "rounded-br-md bg-forest-700 text-white dark:bg-forest-600"
                  : "rounded-bl-md bg-surface-raised text-ink ring-1 ring-line",
              )}
            >
              {!m.isMine && (
                <p className="mb-0.5 flex items-center gap-1.5 text-[11px] font-black text-coral-600 dark:text-coral-300">
                  {m.author.displayName}
                  {m.byLeader && (
                    <span className="rounded bg-coral-100 px-1 text-[9px] text-coral-700 dark:bg-coral-700/30 dark:text-coral-200">
                      تورلیدر
                    </span>
                  )}
                </p>
              )}
              <p className="whitespace-pre-wrap break-words">{m.text}</p>
              <p
                className={cn(
                  "mt-1 text-[10px]",
                  m.isMine ? "text-white/60" : "text-ink-soft",
                )}
              >
                {formatDateTime(m.createdAt)}
              </p>
            </div>
          </div>
        ))}
      </div>
      {data?.canPost ? (
        <form
          onSubmit={submit}
          className="flex items-end gap-2 border-t border-line bg-surface p-3"
        >
          <label htmlFor={`chat-${tourId}`} className="sr-only">
            متن پیام
          </label>
          <textarea
            id={`chat-${tourId}`}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                e.currentTarget.form?.requestSubmit();
              }
            }}
            rows={1}
            maxLength={1000}
            placeholder="پیام خود را بنویسید..."
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-line bg-surface-muted px-4 py-2.5 text-sm outline-none focus:border-forest-400"
          />
          <button
            type="submit"
            disabled={!text.trim() || send.isPending}
            aria-label="ارسال پیام"
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-xl bg-coral-500 text-white shadow-cta transition hover:bg-coral-600 disabled:opacity-50"
          >
            <SendHorizontal className="size-5 -scale-x-100" />
          </button>
        </form>
      ) : (
        data && (
          <p className="border-t border-line p-3 text-center text-xs text-ink-muted">
            این گفت‌وگو فقط‌خواندنی است.
          </p>
        )
      )}
    </div>
  );
}
