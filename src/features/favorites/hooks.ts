import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { useSession } from "@/features/auth/hooks";
import type { TourSummary } from "@/features/tours/api/tour-schemas";
import { favoritesApi } from "./api/favorites-api";
import type { FavoriteEntry } from "./api/favorite-schemas";

export function useFavorites() {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.favorites(user?.id ?? "guest"),
    queryFn: ({ signal }) => favoritesApi.list(signal),
    enabled: user !== null,
  });
}

/** Set of favourite tour IDs — shared by every heart button on every page. */
export function useFavoriteIds(): Set<string> {
  const { data } = useFavorites();
  return useMemo(() => new Set((data ?? []).map((f) => f.tour.id)), [data]);
}

/**
 * Optimistic toggle with rollback: the heart flips instantly, the server result is reconciled
 * by refetching favourites and tour detail afterwards.
 */
export function useToggleFavorite() {
  const qc = useQueryClient();
  const { user } = useSession();
  const key = queryKeys.favorites(user?.id ?? "guest");

  return useMutation({
    mutationFn: ({
      tour,
      favorite,
    }: {
      tour: TourSummary;
      favorite: boolean;
    }) => (favorite ? favoritesApi.add(tour.id) : favoritesApi.remove(tour.id)),
    onMutate: async ({ tour, favorite }) => {
      await qc.cancelQueries({ queryKey: key });
      const previous = qc.getQueryData<FavoriteEntry[]>(key);
      qc.setQueryData<FavoriteEntry[]>(key, (list = []) =>
        favorite
          ? [
              {
                addedAt: new Date().toISOString(),
                label: null,
                note: null,
                tour,
              },
              ...list.filter((f) => f.tour.id !== tour.id),
            ]
          : list.filter((f) => f.tour.id !== tour.id),
      );
      return { previous };
    },
    onError: (_error, _vars, context) => {
      if (context?.previous) qc.setQueryData(key, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: key });
      qc.invalidateQueries({ queryKey: ["tours", "detail"] });
    },
  });
}

export function useUpdateFavorite() {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: ({
      tourId,
      label,
      note,
    }: {
      tourId: string;
      label?: string | null;
      note?: string | null;
    }) => favoritesApi.update(tourId, { label, note }),
    onSettled: () =>
      qc.invalidateQueries({
        queryKey: queryKeys.favorites(user?.id ?? "guest"),
      }),
  });
}
