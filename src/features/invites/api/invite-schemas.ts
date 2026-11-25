import { z } from "zod";
import { tourSummarySchema } from "@/features/tours/api/tour-schemas";

/**
 * Status of a tour invite link, computed by the server at request time:
 * - `valid`   — can be used now
 * - `expired` — `expiresAt` has passed
 * - `used`    — single-use link already consumed
 * - `revoked` — the tour leader disabled it
 */
export const inviteStatusSchema = z.enum([
  "valid",
  "expired",
  "used",
  "revoked",
]);
export type InviteStatus = z.infer<typeof inviteStatusSchema>;

/** GET /invites/:token (public) */
export const inviteSchema = z.object({
  token: z.string(),
  status: inviteStatusSchema.catch("valid"),
  createdAt: z.string(),
  expiresAt: z.string(),
  usedAt: z.string().nullable().optional().default(null),
  /** Display name of whoever used the link (null while unused). */
  usedByName: z.string().nullable().optional().default(null),
  /** True when the signed-in viewer is the one who used it. */
  usedByMe: z.boolean().nullish().transform((v) => Boolean(v)),
  invitedBy: z.object({
    id: z.string().nullish().transform((v) => v || "leader"),
    displayName: z.string().nullish().transform((v) => v || "برگزارکننده"),
    avatarUrl: z.string().nullable().optional().default(null),
  }),
  tour: tourSummarySchema,
});
export type Invite = z.infer<typeof inviteSchema>;

/** POST /invites/:token/accept */
export const acceptInviteResponseSchema = z.object({
  tourId: z.string(),
  requestStatus: z.enum(["pending", "approved"]),
});
export type AcceptInviteResponse = z.infer<typeof acceptInviteResponseSchema>;

/** Single item in GET /tours/:id/invites (leader) */
export const tourInviteItemSchema = inviteSchema.omit({
  tour: true,
  invitedBy: true,
  usedByMe: true,
});
export type TourInvite = z.infer<typeof tourInviteItemSchema>;

/** GET /tours/:id/invites (leader) */
export const tourInvitesResponseSchema = z.preprocess(
  (val: unknown) => {
    if (Array.isArray(val)) return { items: val };
    if (val && typeof val === "object") {
      const obj = val as Record<string, unknown>;
      if (Array.isArray(obj.items)) return { items: obj.items };
      if (Array.isArray(obj.results)) return { items: obj.results };
    }
    return val;
  },
  z.object({
    items: z.array(tourInviteItemSchema),
  }),
);

/** POST /tours/:id/invites (leader) */
export const createInviteBodySchema = z.object({
  expiresInHours: z
    .number()
    .int()
    .min(1)
    .max(24 * 14),
});
export type CreateInviteBody = z.infer<typeof createInviteBodySchema>;
