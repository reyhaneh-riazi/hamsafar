import { apiRequest } from "@/shared/api/http";
import {
  adminReportsResponseSchema,
  adminStatsSchema,
  adminToursResponseSchema,
  adminUsersResponseSchema,
  type ReportDecisionBody,
  type ReviewDecisionBody,
} from "./admin-schemas";

export const adminApi = {
  stats: (signal?: AbortSignal) =>
    apiRequest("/admin/stats", { signal, schema: adminStatsSchema }),
  tours: (status: string, signal?: AbortSignal) =>
    apiRequest("/admin/tours", {
      query: { status },
      signal,
      schema: adminToursResponseSchema,
    }).then((r) => r.items),
  review: (tourId: string, body: ReviewDecisionBody) =>
    apiRequest(`/admin/tours/${encodeURIComponent(tourId)}/review`, {
      method: "POST",
      body,
    }),
  users: (q: string, signal?: AbortSignal) =>
    apiRequest("/admin/users", {
      query: { q },
      signal,
      schema: adminUsersResponseSchema,
    }).then((r) => r.items),
  setBlocked: (userId: string, blocked: boolean) =>
    apiRequest(`/admin/users/${encodeURIComponent(userId)}/block`, {
      method: "POST",
      body: { blocked },
    }),
  reports: (status: string, signal?: AbortSignal) =>
    apiRequest("/admin/reports", {
      query: { status },
      signal,
      schema: adminReportsResponseSchema,
    }).then((r) => r.items),
  decideReport: (reportId: string, body: ReportDecisionBody) =>
    apiRequest(`/admin/reports/${encodeURIComponent(reportId)}/decision`, {
      method: "POST",
      body,
    }),
};
