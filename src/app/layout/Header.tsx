import { useEffect, useRef, useState } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  Map,
  Menu,
  MessagesSquare,
  Moon,
  ShieldCheck,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router";
import { displayName } from "@/features/auth/api/auth-schemas";
import { capabilitiesFor } from "@/features/auth/capabilities";
import { useLogout, useSession } from "@/features/auth/hooks";
import { NotificationBell } from "@/features/notifications/ui/NotificationBell";
import { MessagesLink } from "@/features/trip/ui/MessagesLink";
import { cn } from "@/shared/lib/cn";
import { Avatar } from "@/shared/ui/Avatar";
import { buttonClasses } from "@/shared/ui/Button";
import { BrandLogo } from "@/shared/ui/Logo";
import { useToast } from "@/shared/ui/Toast";
import { useTheme } from "@/shared/theme/ThemeProvider";

/* Figma «MainHeader» (144:412): white bar, 81px, nav centre, theme toggle + CTA on the left. */
const NAV = [
  { to: "/", label: "خانه", end: true, badge: null },
  { to: "/tours", label: "تورها", end: false, badge: null },
  { to: "/planner", label: "ساخت تور", end: false, badge: "رایگان" },
  { to: "/about", label: "درباره ما", end: false, badge: null },
  { to: "/contact", label: "ارتباط با ما", end: false, badge: null },
  { to: "/rules", label: "قوانین و مقررات", end: false, badge: null },
] as const;

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "inline-flex items-center gap-1.5 py-2 text-sm font-bold transition-colors",
    isActive
      ? "text-[#e8604c]"
      : "text-slate-700 hover:text-slate-950 dark:text-white/80 dark:hover:text-white",
  );
}

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggle } = useTheme();
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "حالت روشن" : "حالت تیره"}
      title={theme === "dark" ? "حالت روشن" : "حالت تیره"}
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-white/15 dark:bg-white/5 dark:text-white/85 dark:hover:bg-white/10",
        className,
      )}
    >
      {theme === "dark" ? (
        <Sun className="size-[18px]" />
      ) : (
        <Moon className="size-[18px]" />
      )}
    </button>
  );
}

export function UserMenu({ buttonClassName }: { buttonClassName?: string } = {}) {
  const { user } = useSession();
  const logout = useLogout();
  const toast = useToast();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!user) return null;
  const caps = capabilitiesFor(user);
  const name = displayName(user);
  const items = [
    { to: "/profile", label: "پروفایل من", icon: UserRound },
    { to: "/profile?tab=trips", label: "سفرهای من", icon: Map },
    { to: "/messages", label: "پیام‌ها", icon: MessagesSquare },
    { to: "/favorites", label: "علاقه‌مندی‌ها", icon: Heart },
    ...(caps.canAccessAdmin
      ? [{ to: "/admin", label: "پنل مدیریت", icon: LayoutDashboard }]
      : []),
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={
          buttonClassName ??
          "flex items-center gap-2 rounded-xl py-1.5 ps-1.5 pe-3 text-slate-800 transition hover:bg-slate-100 dark:text-white dark:hover:bg-white/10"
        }
      >
        <Avatar name={name} src={user.avatarUrl} size="sm" />
        <span className="hidden max-w-32 truncate text-sm font-bold lg:inline">
          {name}
        </span>
      </button>
      {open && (
        <div
          role="menu"
          className="absolute end-0 top-full z-drawer mt-2 w-56 animate-pop overflow-hidden rounded-2xl border border-line bg-surface-raised p-1.5 text-ink shadow-float"
        >
          <div className="border-b border-line px-3 pb-3 pt-2">
            <p className="truncate text-sm font-black">{name}</p>
            <p className="ltr-island mt-0.5 text-end text-xs text-ink-soft">
              {user.phone || user.email}
            </p>
          </div>
          {items.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-surface-muted"
            >
              <Icon className="size-4 text-brand" aria-hidden="true" />
              {label}
            </Link>
          ))}
          <button
            type="button"
            role="menuitem"
            disabled={logout.isPending}
            onClick={() =>
              logout.mutate(undefined, {
                onSuccess: () => toast.success("از حساب خارج شدید."),
                onSettled: () => {
                  setOpen(false);
                  navigate("/");
                },
              })
            }
            className="mt-1 flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-danger hover:bg-danger/10"
          >
            <LogOut className="size-4" aria-hidden="true" />
            خروج از حساب
          </button>
        </div>
      )}
    </div>
  );
}

export function Header() {
  const { user, isLoading } = useSession();
  const [drawer, setDrawer] = useState(false);
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setDrawer(false), [location.pathname]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    if (!drawer) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawer(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawer]);

  const next = encodeURIComponent(`${location.pathname}${location.search}`);

  return (
    <header
      className={cn(
        "sticky top-0 z-header border-b border-slate-200/80 bg-white/95 backdrop-blur transition-shadow duration-300 dark:border-white/10 dark:bg-forest-950/95",
        scrolled && "shadow-[0_8px_24px_-16px_rgb(0_0_0/0.35)]",
      )}
    >
      <div className="mx-auto flex h-[72px] max-w-page items-center justify-between gap-4 px-4 sm:px-6 lg:h-20 lg:px-8">
        <BrandLogo />

        <nav
          aria-label="منوی اصلی"
          className="hidden items-center gap-6 lg:flex xl:gap-8"
        >
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={navClass}
            >
              {item.label}
              {item.badge && (
                <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          {isLoading ? (
            <span
              className="h-10 w-32 animate-pulse rounded-xl bg-slate-100 dark:bg-white/10"
              aria-hidden="true"
            />
          ) : user ? (
            <div className="flex items-center gap-1">
              <MessagesLink />
              <NotificationBell />
              <UserMenu />
            </div>
          ) : (
            <>
              <div className="hidden sm:block">
                <Link
                  to={`/auth?next=${next}`}
                  className={buttonClasses(
                    "primary",
                    "md",
                    "bg-[#e8604c] shadow-cta",
                  )}
                >
                  ورود / ثبت‌نام
                </Link>
              </div>
              <Link
                to={`/auth?next=${next}`}
                aria-label="ورود / ثبت‌نام"
                className="inline-flex size-10 items-center justify-center rounded-xl bg-[#e8604c] text-white shadow-cta sm:hidden"
              >
                <UserRound className="size-5" aria-hidden="true" />
              </Link>
            </>
          )}
          <button
            type="button"
            onClick={() => setDrawer(true)}
            aria-label="باز کردن منو"
            aria-expanded={drawer}
            className="inline-flex size-10 items-center justify-center rounded-xl text-slate-700 hover:bg-slate-100 lg:hidden dark:text-white dark:hover:bg-white/10"
          >
            <Menu className="size-6" />
          </button>
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-drawer lg:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-forest-950/60"
            onClick={() => setDrawer(false)}
            aria-hidden="true"
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="منو"
            className="absolute inset-y-0 start-0 flex w-[82%] max-w-xs animate-fade-in flex-col bg-white p-5 text-slate-900 shadow-float dark:bg-forest-950 dark:text-white"
          >
            <div className="flex items-center justify-between">
              <BrandLogo tagline={null} />
              <button
                type="button"
                onClick={() => setDrawer(false)}
                aria-label="بستن منو"
                className="rounded-xl p-2 hover:bg-slate-100 dark:hover:bg-white/10"
              >
                <X className="size-6" />
              </button>
            </div>
            <nav aria-label="منوی موبایل" className="mt-8 flex flex-col gap-1">
              {NAV.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-xl px-4 py-3 text-base font-bold",
                      isActive
                        ? "bg-coral-50 text-[#e8604c] dark:bg-white/10"
                        : "text-slate-700 hover:bg-slate-50 dark:text-white/90 dark:hover:bg-white/5",
                    )
                  }
                >
                  {item.label}
                  {item.badge && (
                    <span className="rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-bold text-emerald-700">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
            <div className="mt-auto flex flex-col gap-3 border-t border-slate-200 pt-5 dark:border-white/10">
              <ThemeToggle className="self-start" />
              {!user && (
                <>
                  <Link
                    to={`/auth?next=${next}`}
                    className={buttonClasses("primary", "md", "w-full")}
                  >
                    <UserRound className="size-[18px]" aria-hidden="true" />
                    ورود / ثبت‌نام
                  </Link>
                  <Link
                    to={`/auth?next=${encodeURIComponent("/admin")}&as=admin`}
                    className={buttonClasses("outline", "md", "w-full")}
                  >
                    <ShieldCheck className="size-[18px]" aria-hidden="true" />
                    ورود مدیر
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
