import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router";
import { UNAUTHORIZED_EVENT } from "@/shared/api/http";
import { queryKeys } from "@/shared/api/query-keys";
import { useToast } from "@/shared/ui/Toast";

/**
 * A private request answered 401: either the session expired or a guest tried a private action.
 * Clear the cached user and send them to /auth, keeping the page to return to.
 * Background reads by a guest (GET while already signed out) are ignored so public pages never bounce.
 */
export function SessionWatcher() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();

  useEffect(() => {
    const onUnauthorized = (event: Event) => {
      const method =
        (event as CustomEvent<{ method?: string }>).detail?.method ?? "GET";
      const wasSignedIn = Boolean(qc.getQueryData(queryKeys.session));
      if (!wasSignedIn && method === "GET") return;
      if (location.pathname.startsWith("/auth")) return;
      qc.setQueryData(queryKeys.session, null);
      toast.info(
        wasSignedIn
          ? "نشست شما به پایان رسیده است؛ دوباره وارد شوید."
          : "برای این کار ابتدا وارد حساب کاربری شوید.",
      );
      navigate(
        `/auth?next=${encodeURIComponent(location.pathname + location.search)}`,
        { replace: false },
      );
    };
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
  }, [qc, navigate, location.pathname, location.search, toast]);

  return null;
}
