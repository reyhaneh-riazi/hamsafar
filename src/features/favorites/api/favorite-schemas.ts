import { z } from "zod";
import { tourSummarySchema } from "@/features/tours/api/tour-schemas";

/** GET /me/favorites — includes cancelled/completed tours so their status can be shown. */
export const favoritesResponseSchema = z.object({
  items: z.array(
    z.object({
      addedAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
      label: z.string().nullish().default(null),
      note: z.string().nullish().default(null),
      tour: tourSummarySchema,
    }),
  ).default([]),
});
export type FavoritesResponse = z.infer<typeof favoritesResponseSchema>;
export type FavoriteEntry = FavoritesResponse["items"][number];
