import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks";
import { queryKeys } from "@/shared/api/query-keys";
import { invitesApi } from "./api/invites-api";
import type { CreateInviteBody } from "./api/invite-schemas";

export function useInvite(token: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.invite(token, user?.id ?? null),
    queryFn: ({ signal }) => invitesApi.get(token, signal),
    staleTime: 0,
  });
}

export function useAcceptInvite(token: string) {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: () => invitesApi.accept(token),
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["invites"] });
      void qc.invalidateQueries({ queryKey: queryKeys.tours });
      if (user) void qc.invalidateQueries({ queryKey: queryKeys.me(user.id) });
    },
  });
}

export function useTourInvites(tourId: string) {
  return useQuery({
    queryKey: queryKeys.tourInvites(tourId),
    queryFn: ({ signal }) => invitesApi.listForTour(tourId, signal),
  });
}

export function useCreateInvite(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateInviteBody) => invitesApi.create(tourId, body),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.tourInvites(tourId) }),
  });
}

export function useRevokeInvite(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (token: string) => invitesApi.revoke(token),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.tourInvites(tourId) }),
  });
}
