import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks";
import { queryKeys } from "@/shared/api/query-keys";
import { usersApi } from "./api/users-api";
import type { ReportBody } from "./api/user-schemas";

export function usePublicProfile(userId: string) {
  return useQuery({
    queryKey: queryKeys.publicProfile(userId),
    queryFn: ({ signal }) => usersApi.profile(userId, signal),
  });
}

export function useBlockUser(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (block: boolean) =>
      block ? usersApi.block(userId) : usersApi.unblock(userId),
    onSettled: () =>
      qc.invalidateQueries({ queryKey: queryKeys.publicProfile(userId) }),
  });
}

export function useReport() {
  return useMutation({
    mutationFn: (body: ReportBody) => usersApi.report(body),
  });
}

export function useSimilarTravelers() {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.similar(user?.id ?? "guest"),
    queryFn: ({ signal }) => usersApi.similar(signal),
    enabled: !!user,
  });
}
