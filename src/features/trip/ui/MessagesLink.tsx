import { MessagesSquare } from "lucide-react";
import { Link } from "react-router";
import { toFaDigits } from "@/shared/lib/digits";
import { useConversations } from "../hooks";

/** Header shortcut to the inbox with the unread message count. */
export function MessagesLink() {
  const { data } = useConversations();
  const unread = data?.totalUnread ?? 0;
  return (
    <Link
      to="/messages"
      aria-label={
        unread ? `پیام‌ها، ${toFaDigits(unread)} خوانده‌نشده` : "پیام‌ها"
      }
      className="relative inline-flex size-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-white/85 dark:hover:bg-white/10 dark:hover:text-white"
    >
      <MessagesSquare className="size-[19px]" />
      {unread > 0 && (
        <span className="absolute -end-0.5 -top-0.5 flex min-w-5 items-center justify-center rounded-full bg-coral-500 px-1 text-[10px] font-black leading-5 text-white ring-2 ring-white dark:ring-forest-950">
          {toFaDigits(unread > 9 ? "9+" : unread)}
        </span>
      )}
    </Link>
  );
}
