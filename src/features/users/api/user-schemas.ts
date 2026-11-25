import { z } from "zod";
import { tourSummarySchema } from "@/features/tours/api/tour-schemas";

export const publicProfileSchema = z.object({
  id: z.string(),
  displayName: z.string(),
  avatarUrl: z.string().nullable(),
  city: z.string().nullable(),
  bio: z.string().nullable(),
  travelStyles: z.array(z.string()),
  languages: z.array(z.string()),
  interests: z.array(z.string()),
  /** Free-text travel budget the user chose to show, e.g. "۳ تا ۷ میلیون تومان". */
  budgetRange: z.string().nullable(),
  rating: z.number().nullable(),
  reviewCount: z.number().int(),
  tripsCount: z.number().int(),
  joinedAt: z.string(),
  reviews: z.array(
    z.object({
      id: z.string(),
      rating: z.number().int(),
      comment: z.string(),
      createdAt: z.string(),
      authorName: z.string(),
      tourTitle: z.string(),
    }),
  ),
  ledTours: z.array(tourSummarySchema),
  publicFavorites: z
    .array(z.object({ label: z.string().nullable(), tour: tourSummarySchema }))
    .nullable(),
  isMe: z.boolean(),
  blockedByMe: z.boolean(),
});
export type PublicProfile = z.infer<typeof publicProfileSchema>;

export const reportTargetSchema = z.enum(["user", "tour", "comment"]);
export const reportBodySchema = z.object({
  targetType: reportTargetSchema,
  targetId: z.string(),
  reason: z.string().min(5).max(300),
});
export type ReportBody = z.infer<typeof reportBodySchema>;

export const similarTravelersSchema = z.object({
  items: z
    .array(
      z.object({
        person: z.object({
          id: z.string(),
          displayName: z.string().nullish().transform((v) => v || "همسفر"),
          avatarUrl: z.string().nullish().transform((v) => v ?? null),
          city: z.string().nullish().transform((v) => v ?? null),
        }),
        sharedTours: z.number().int().default(0),
        sharedLabels: z.array(z.string()).nullish().transform((v) => v ?? []),
      }),
    )
    .nullish()
    .transform((v) => v ?? []),
});
