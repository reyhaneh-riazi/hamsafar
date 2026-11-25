import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks";
import { queryKeys } from "@/shared/api/query-keys";
import { notificationsApi } from "./api/notifications-api";

/** In-app notifications (FS 7). Polled every 30 s while the tab is visible. */
export function useNotifications() {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.notifications(user?.id ?? "guest"),
    queryFn: ({ signal }) => notificationsApi.list(signal),
    enabled: !!user,
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
  });
}

export function useMarkNotificationsRead() {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (ids?: string[]) => notificationsApi.markRead(ids),
    onSettled: () =>
      user &&
      qc.invalidateQueries({ queryKey: queryKeys.notifications(user.id) }),
  });
}
