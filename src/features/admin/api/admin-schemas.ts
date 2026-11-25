import { z } from "zod";
import { tourSummarySchema } from "@/features/tours/api/tour-schemas";

export const funnelStageSchema = z.enum([
  "created",
  "submitted",
  "approved",
  "first_request",
  "confirmed",
]);
export type FunnelStage = z.infer<typeof funnelStageSchema>;

/** GET /admin/stats — real metrics only; `null` means "not available" (never coerced to 0). */
export const adminStatsSchema = z.object({
  usersTotal: z.number().int().nullable(),
  openReports: z.number().int().nullable(),
  quorumRate: z.number().nullable(),
  toursOpen: z.number().int().nullable(),
  toursPendingReview: z.number().int().nullable(),
  joinRequestsLast7Days: z.number().int().nullable(),
  funnel: z.array(
    z.object({
      stage: funnelStageSchema,
      count: z.number().int().nonnegative(),
    }),
  ),
});
export type AdminStats = z.infer<typeof adminStatsSchema>;

export const adminTourSchema = tourSummarySchema.extend({
  creatorName: z.string().nullish().transform((v) => v || "نامشخص"),
  submittedAt: z.string().nullable().optional().default(null),
});
export type AdminTour = z.infer<typeof adminTourSchema>;
export const adminToursResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) return { items: val };
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj.items)) return { items: obj.items };
      if (Array.isArray(obj.results)) return { items: obj.results };
      if (Array.isArray(obj.tours)) return { items: obj.tours };
    }
    return val;
  },
  z.object({
    items: z.array(adminTourSchema),
  }),
);

export const reviewDecisionBodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
  reason: z.string().max(300).optional(),
});
export type ReviewDecisionBody = z.infer<typeof reviewDecisionBodySchema>;

export const adminUserSchema = z.preprocess(
  (val: unknown) => {
    if (!val || typeof val !== "object") return val;
    const raw = val as Record<string, unknown>;
    return {
      ...raw,
      id: raw.id !== undefined && raw.id !== null ? String(raw.id) : "",
      displayName:
        raw.displayName ||
        raw.name ||
        [raw.firstName, raw.lastName].filter(Boolean).join(" ") ||
        raw.username ||
        raw.email ||
        "کاربر",
      phone: raw.phone ?? null,
      city: raw.city ?? null,
      role:
        typeof raw.role === "string" &&
        (raw.role.toLowerCase().includes("admin") ||
          raw.role.toLowerCase().includes("staff") ||
          raw.role.toLowerCase().includes("super"))
          ? "admin"
          : "user",
      blocked: Boolean(raw.blocked ?? raw.is_blocked ?? raw.isBlocked ?? false),
      createdAt:
        typeof raw.createdAt === "string"
          ? raw.createdAt
          : typeof raw.created_at === "string"
            ? raw.created_at
            : new Date().toISOString(),
      toursLed: Number(raw.toursLed ?? raw.tours_led ?? 0) || 0,
      reportsAgainst:
        Number(raw.reportsAgainst ?? raw.reports_against ?? 0) || 0,
    };
  },
  z.object({
    id: z.string(),
    displayName: z.string(),
    phone: z.string().nullable().transform((v) => v || "—"),
    city: z.string().nullable(),
    role: z.enum(["user", "admin"]),
    blocked: z.boolean(),
    createdAt: z.string(),
    toursLed: z.number().int(),
    reportsAgainst: z.number().int(),
  }),
);
export type AdminUser = z.infer<typeof adminUserSchema>;
export const adminUsersResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) {
      return { items: val };
    }
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj.items)) return { items: obj.items };
      if (Array.isArray(obj.results)) return { items: obj.results };
      if (Array.isArray(obj.users)) return { items: obj.users };
      if (Array.isArray(obj.data)) return { items: obj.data };
    }
    return val;
  },
  z.object({
    items: z.array(adminUserSchema),
  }),
);

export const adminReportSchema = z.preprocess(
  (val: unknown) => {
    if (!val || typeof val !== "object") return val;
    const raw = val as Record<string, unknown>;
    return {
      ...raw,
      id: raw.id !== undefined && raw.id !== null ? String(raw.id) : "",
      targetId:
        raw.targetId !== undefined && raw.targetId !== null
          ? String(raw.targetId)
          : raw.target_id
            ? String(raw.target_id)
            : "",
      targetLabel: raw.targetLabel || raw.target_label || "مورد گزارش شده",
      reporterName: raw.reporterName || raw.reporter_name || "کاربر",
      decisionNote: raw.decisionNote ?? raw.decision_note ?? null,
      decidedAt: raw.decidedAt ?? raw.decided_at ?? null,
      decidedByName: raw.decidedByName ?? raw.decided_by_name ?? null,
      createdAt: raw.createdAt || raw.created_at || new Date().toISOString(),
    };
  },
  z.object({
    id: z.string(),
    targetType: z.enum(["user", "tour", "comment"]).catch("user"),
    targetId: z.string(),
    targetLabel: z.string(),
    reason: z.string().nullish().transform((v) => v || "—"),
    reporterName: z.string(),
    status: z.enum(["open", "resolved", "dismissed"]).catch("open"),
    decisionNote: z.string().nullable(),
    decidedAt: z.string().nullable(),
    decidedByName: z.string().nullable(),
    createdAt: z.string(),
  }),
);
export type AdminReport = z.infer<typeof adminReportSchema>;
export const adminReportsResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) return { items: val };
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj.items)) return { items: obj.items };
      if (Array.isArray(obj.results)) return { items: obj.results };
      if (Array.isArray(obj.reports)) return { items: obj.reports };
    }
    return val;
  },
  z.object({
    items: z.array(adminReportSchema),
  }),
);

export const reportDecisionBodySchema = z.object({
  decision: z.enum(["resolve", "dismiss"]),
  note: z.string().min(3).max(300),
  /** Optional enforcement: block the reported user or cancel the reported tour. */
  action: z.enum(["none", "block_user", "remove_tour"]),
});
export type ReportDecisionBody = z.infer<typeof reportDecisionBodySchema>;
