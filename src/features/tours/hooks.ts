import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { useSession } from "@/features/auth/hooks";
import { toursApi } from "./api/tours-api";
import type {
  CheckoutBody,
  CreateTourBody,
  TourSearchParams,
} from "./api/tour-schemas";

export function useFeaturedTours() {
  return useQuery({
    queryKey: queryKeys.featured,
    queryFn: ({ signal }) => toursApi.featured(signal),
  });
}

export function useDestinations() {
  return useQuery({
    queryKey: queryKeys.destinations,
    queryFn: ({ signal }) => toursApi.destinations(signal),
    staleTime: 10 * 60_000,
  });
}

/** Server-side filtering/sorting/pagination; previous page stays visible while the next loads. */
export function useTourList(params: TourSearchParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.tourList(params),
    queryFn: ({ signal }) => toursApi.list(params, signal),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Descriptive search. The query key carries the text, and React Query cancels stale requests. */
export function useDescribeSearch(text: string) {
  return useQuery({
    queryKey: queryKeys.describe(text),
    queryFn: ({ signal }) => toursApi.describe(text, signal),
    enabled: text.trim().length >= 2,
    placeholderData: keepPreviousData,
  });
}

export function useTourDetail(tourId: string) {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.tourDetail(tourId, user?.id ?? null),
    queryFn: ({ signal }) => toursApi.detail(tourId, signal),
  });
}

function invalidateTourData(
  qc: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  qc.invalidateQueries({ queryKey: queryKeys.tours });
  if (userId) qc.invalidateQueries({ queryKey: queryKeys.me(userId) });
  qc.invalidateQueries({ queryKey: ["admin"] });
}

export function useRequestJoin(tourId: string) {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (message: string) => toursApi.requestJoin(tourId, message),
    onSettled: () => invalidateTourData(qc, user?.id),
  });
}

export function useCancelJoin(tourId: string) {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: () => toursApi.cancelJoin(tourId),
    onSettled: () => invalidateTourData(qc, user?.id),
  });
}

export function useMyTrips(userId: string) {
  return useQuery({
    queryKey: queryKeys.myTrips(userId),
    queryFn: ({ signal }) => toursApi.myTrips(signal),
  });
}

export function useMyTours(userId: string) {
  return useQuery({
    queryKey: queryKeys.myTours(userId),
    queryFn: ({ signal }) => toursApi.myTours(signal),
  });
}

export function useCreatorRequests(tourId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.tourRequests(tourId),
    queryFn: ({ signal }) => toursApi.creatorRequests(tourId, signal),
    enabled,
  });
}

export function useDecideRequest() {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: ({
      requestId,
      decision,
    }: {
      requestId: string;
      decision: "approve" | "reject";
    }) => toursApi.decideRequest(requestId, decision),
    onSettled: () => invalidateTourData(qc, user?.id),
  });
}

export function useCreateTour() {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (body: CreateTourBody) => toursApi.create(body),
    onSuccess: () => invalidateTourData(qc, user?.id),
  });
}

/** Saves the planner either as a new tour or onto an existing server draft. */
export function useSaveTourDraft() {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: ({
      draftId,
      body,
    }: {
      draftId: string | null;
      body: CreateTourBody;
    }) =>
      draftId ? toursApi.updateDraft(draftId, body) : toursApi.create(body),
    onSuccess: () => invalidateTourData(qc, user?.id),
  });
}

export function useValidateDiscount(tourId: string) {
  return useMutation({
    mutationFn: (code: string) => toursApi.validateDiscount(tourId, code),
  });
}

/** Join request + simulated deposit payment (test gateway). */
export function useCheckout(tourId: string) {
  const qc = useQueryClient();
  const { user } = useSession();
  return useMutation({
    mutationFn: (body: CheckoutBody) => toursApi.checkout(tourId, body),
    onSettled: () => invalidateTourData(qc, user?.id),
  });
}
