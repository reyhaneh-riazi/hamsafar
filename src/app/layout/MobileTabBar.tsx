import { Compass, MessagesSquare, PlusCircle, UserRound } from "lucide-react";
import { NavLink } from "react-router";
import { cn } from "@/shared/lib/cn";

/* Figma mobile frames (390px) show a bottom tab bar with «کشف تورها» as tab 1. */
const TABS = [
  { to: "/tours", label: "کشف تورها", icon: Compass },
  { to: "/planner", label: "ساخت تور", icon: PlusCircle },
  { to: "/messages", label: "پیام‌ها", icon: MessagesSquare },
  { to: "/profile", label: "پروفایل", icon: UserRound },
] as const;

export function MobileTabBar() {
  return (
    <nav
      aria-label="منوی پایین"
      className="fixed inset-x-0 bottom-0 z-header border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden dark:border-white/10 dark:bg-forest-950/95"
    >
      <ul className="mx-auto grid max-w-md grid-cols-4">
        {TABS.map(({ to, label, icon: Icon }) => (
          <li key={to}>
            <NavLink
              to={to}
              className={({ isActive }) =>
                cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px] font-bold transition",
                  isActive
                    ? "text-[#e8604c]"
                    : "text-slate-500 dark:text-white/60",
                )
              }
            >
              <Icon className="size-5" aria-hidden="true" />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  );
}
