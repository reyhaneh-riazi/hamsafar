import { apiRequest } from "@/shared/api/http";
import { favoritesResponseSchema } from "./favorite-schemas";

export const favoritesApi = {
  list: (signal?: AbortSignal) =>
    apiRequest("/me/favorites", {
      signal,
      schema: favoritesResponseSchema,
    }).then((r) => r.items),
  add: (tourId: string) =>
    apiRequest(`/me/favorites/${encodeURIComponent(tourId)}`, {
      method: "PUT",
    }),
  remove: (tourId: string) =>
    apiRequest(`/me/favorites/${encodeURIComponent(tourId)}`, {
      method: "DELETE",
    }),
  update: (
    tourId: string,
    body: { label?: string | null; note?: string | null },
  ) =>
    apiRequest(`/me/favorites/${encodeURIComponent(tourId)}`, {
      method: "PATCH",
      body,
    }),
};
