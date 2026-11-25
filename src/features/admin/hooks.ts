import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { adminApi } from "./api/admin-api";
import type {
  ReportDecisionBody,
  ReviewDecisionBody,
} from "./api/admin-schemas";

export function useAdminStats() {
  return useQuery({
    queryKey: queryKeys.adminStats,
    queryFn: ({ signal }) => adminApi.stats(signal),
  });
}

export function useAdminTours(status: string) {
  return useQuery({
    queryKey: queryKeys.adminTours(status),
    queryFn: ({ signal }) => adminApi.tours(status, signal),
  });
}

export function useReviewTour() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      tourId,
      body,
    }: {
      tourId: string;
      body: ReviewDecisionBody;
    }) => adminApi.review(tourId, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: queryKeys.tours });
    },
  });
}

export function useAdminUsers(q: string) {
  return useQuery({
    queryKey: queryKeys.adminUsers(q),
    queryFn: ({ signal }) => adminApi.users(q, signal),
  });
}

export function useSetUserBlocked() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, blocked }: { userId: string; blocked: boolean }) =>
      adminApi.setBlocked(userId, blocked),
    onSettled: () => qc.invalidateQueries({ queryKey: ["admin"] }),
  });
}

export function useAdminReports(status: string) {
  return useQuery({
    queryKey: queryKeys.adminReports(status),
    queryFn: ({ signal }) => adminApi.reports(status, signal),
  });
}

export function useDecideReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      reportId,
      body,
    }: {
      reportId: string;
      body: ReportDecisionBody;
    }) => adminApi.decideReport(reportId, body),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}
