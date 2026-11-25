import { ArrowRight, MessagesSquare } from "lucide-react";
import { Link, useParams } from "react-router";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateTime } from "@/shared/lib/format";
import { ButtonLink } from "@/shared/ui/Button";
import { PageHeader } from "@/shared/ui/PageHeader";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useConversations } from "../hooks";
import { ChatThread } from "./ChatThread";

/** Inbox: every tour chat the user belongs to, with unread counts; opening one marks it read. */
export function MessagesPage() {
  useDocumentTitle("پیام‌ها");
  const { tourId } = useParams();
  const { data, isPending, isError, refetch } = useConversations();
  const active = data?.items.find((c) => c.tourId === tourId);

  return (
    <div className="pb-12">
      <PageHeader
        title="پیام‌ها"
        subtitle="گفت‌وگوی گروهی تورهایی که عضوشان هستید؛ پیام‌ها ذخیره می‌شوند و هر وقت وارد شوید آن‌ها را می‌بینید."
        crumbs={[{ label: "خانه", to: "/" }, { label: "پیام‌ها" }]}
      />
      <div className="relative z-[1] mx-auto -mt-12 grid max-w-page gap-5 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        <aside
          className={cn(
            "rounded-panel border border-line bg-surface p-2 shadow-card lg:col-span-4",
            tourId && "hidden lg:block",
          )}
          aria-label="گفت‌وگوها"
        >
          {isPending && <Skeleton className="m-2 h-16" />}
          {isError && (
            <ErrorState
              text="دریافت گفت‌وگوها ممکن نشد."
              onRetry={() => void refetch()}
            />
          )}
          {data?.items.length === 0 && (
            <EmptyState
              icon={<MessagesSquare className="size-7" />}
              title="گفت‌وگویی ندارید"
              text="بعد از اینکه توری که عضوش هستید قطعی شود، گفت‌وگوی گروهی آن اینجا نمایش داده می‌شود."
              action={
                <ButtonLink to="/tours" size="sm">
                  پیدا کردن تور
                </ButtonLink>
              }
              className="border-0"
            />
          )}
          <ul>
            {data?.items.map((c) => (
              <li key={c.tourId}>
                <Link
                  to={`/messages/${c.tourId}`}
                  aria-current={c.tourId === tourId ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl p-3 transition",
                    c.tourId === tourId
                      ? "bg-forest-50 dark:bg-white/5"
                      : "hover:bg-surface-muted",
                  )}
                >
                  <img
                    src={c.coverImageUrl}
                    alt=""
                    className="size-14 shrink-0 rounded-xl object-cover"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-black">
                        {c.tourTitle}
                      </span>
                      {c.lastMessage && (
                        <span className="shrink-0 text-[10px] text-ink-soft">
                          {formatDateTime(c.lastMessage.createdAt)}
                        </span>
                      )}
                    </span>
                    <span className="mt-1 flex items-center justify-between gap-2">
                      <span className="truncate text-xs text-ink-muted">
                        {c.lastMessage
                          ? `${c.lastMessage.isMine ? "شما" : c.lastMessage.author.displayName}: ${c.lastMessage.text}`
                          : `${toFaDigits(c.memberCount)} عضو`}
                      </span>
                      {c.unread > 0 && (
                        <span className="shrink-0 rounded-full bg-coral-500 px-2 text-[10px] font-black leading-5 text-white">
                          {toFaDigits(c.unread)}
                        </span>
                      )}
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </aside>
        <section
          className={cn("lg:col-span-8", !tourId && "hidden lg:block")}
          aria-label="گفت‌وگو"
        >
          {tourId ? (
            <>
              <div className="mb-3 flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface px-4 py-3 shadow-card">
                <Link
                  to="/messages"
                  className="inline-flex items-center gap-1 text-xs font-bold text-ink-muted lg:hidden"
                >
                  <ArrowRight className="size-4" aria-hidden="true" />
                  همه گفت‌وگوها
                </Link>
                <p className="truncate text-sm font-black">
                  {active?.tourTitle ?? "گفت‌وگوی تور"}
                </p>
                <Link
                  to={`/tours/${tourId}`}
                  className="shrink-0 text-xs font-bold text-coral-500 hover:text-coral-600"
                >
                  صفحه تور
                </Link>
              </div>
              <ChatThread
                tourId={tourId}
                enabled
                className="h-[min(70dvh,40rem)]"
              />
            </>
          ) : (
            <div className="flex h-full min-h-80 items-center justify-center rounded-panel border border-dashed border-line bg-surface/60 text-sm text-ink-muted">
              یک گفت‌وگو را از فهرست انتخاب کنید.
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
