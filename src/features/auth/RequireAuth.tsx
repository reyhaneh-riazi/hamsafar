import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router";
import { ForbiddenState, PageLoader } from "@/shared/ui/StateViews";
import { Container } from "@/shared/ui/Container";
import { useSession } from "./hooks";

interface RequireAuthProps {
  children: ReactNode;
  role?: "admin";
}

/** Route guard: guests go to /auth (keeping the intended destination); wrong role sees a forbidden state. */
export function RequireAuth({ children, role }: RequireAuthProps) {
  const { user, isLoading } = useSession();
  const location = useLocation();

  if (isLoading) return <PageLoader />;
  if (!user) {
    const next = `${location.pathname}${location.search}`;
    return <Navigate to={`/auth?next=${encodeURIComponent(next)}`} replace />;
  }
  if (!user.profileComplete) {
    return (
      <Navigate
        to={`/auth?step=profile&next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  }
  if (role === "admin" && user.role !== "admin") {
    return (
      <Container className="py-16">
        <ForbiddenState text="این بخش فقط برای مدیران سامانه در دسترس است." />
      </Container>
    );
  }
  return <>{children}</>;
}

/** Only allows same-site relative paths as post-login destinations (prevents open redirects). */
export function safeNextPath(raw: string | null): string {
  if (!raw) return "/";
  if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\"))
    return "/";
  if (raw.startsWith("/auth")) return "/";
  return raw;
}
