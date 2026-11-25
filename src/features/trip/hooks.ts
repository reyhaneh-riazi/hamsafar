import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/features/auth/hooks";
import { queryKeys } from "@/shared/api/query-keys";
import { tripApi } from "./api/trip-api";
import type {
  CreateExpenseBody,
  CreatePollBody,
  ItineraryUpdateBody,
  ReviewBody,
  TourUpdateBody,
} from "./api/trip-schemas";

type Part = Parameters<typeof queryKeys.trip>[1];

function useTripInvalidate(tourId: string) {
  const qc = useQueryClient();
  const { user } = useSession();
  return (...parts: Part[]) => {
    parts.forEach((p) =>
      qc.invalidateQueries({ queryKey: queryKeys.trip(tourId, p) }),
    );
    qc.invalidateQueries({ queryKey: ["tours"] });
    if (user) qc.invalidateQueries({ queryKey: queryKeys.me(user.id) });
  };
}

/* ---------- leader management ---------- */
export function useUpdateTour(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (body: TourUpdateBody) => tripApi.updateTour(tourId, body),
    onSettled: () => invalidate(),
  });
}
export function useUploadCover(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (file: Blob) => tripApi.uploadCover(tourId, file),
    onSettled: () => invalidate(),
  });
}
export function useCancelTour(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (reason: string) => tripApi.cancelTour(tourId, reason),
    onSettled: () => invalidate("expenses"),
  });
}
export function useUpdateItinerary(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (body: ItineraryUpdateBody) =>
      tripApi.updateItinerary(tourId, body),
    onSettled: () => invalidate(),
  });
}
export function useAddComment(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: ({ itemId, text }: { itemId: string; text: string }) =>
      tripApi.addComment(tourId, itemId, text),
    onSettled: () => invalidate(),
  });
}

/* ---------- expenses ---------- */
export function useExpenses(tourId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trip(tourId, "expenses"),
    queryFn: ({ signal }) => tripApi.expenses(tourId, signal),
    enabled,
  });
}
export function useAddExpense(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateExpenseBody) => tripApi.addExpense(tourId, body),
    onSuccess: (data) =>
      qc.setQueryData(queryKeys.trip(tourId, "expenses"), data),
  });
}
export function useDeleteExpense(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (expenseId: string) => tripApi.deleteExpense(tourId, expenseId),
    onSettled: () => invalidate("expenses"),
  });
}
export function usePay(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (simulate: "success" | "fail") => tripApi.pay(tourId, simulate),
    onSettled: () => invalidate("expenses"),
  });
}

/* ---------- chat (polling; stops when the view unmounts or the tab is hidden) ---------- */
export function useConversations() {
  const { user } = useSession();
  return useQuery({
    queryKey: queryKeys.conversations(user?.id ?? "guest"),
    queryFn: ({ signal }) => tripApi.conversations(signal),
    enabled: !!user,
    refetchInterval: 15_000,
    refetchIntervalInBackground: false,
  });
}
export function useMessages(tourId: string, enabled: boolean) {
  const qc = useQueryClient();
  const { user } = useSession();
  const query = useQuery({
    queryKey: queryKeys.trip(tourId, "messages"),
    queryFn: ({ signal }) => tripApi.messages(tourId, signal),
    enabled,
    refetchInterval: enabled ? 4_000 : false,
    refetchIntervalInBackground: false,
  });
  const count = query.data?.items.length ?? 0;
  useEffect(() => {
    if (!enabled || count === 0) return;
    tripApi
      .markRead(tourId)
      .then(
        () =>
          user &&
          qc.invalidateQueries({ queryKey: queryKeys.conversations(user.id) }),
      )
      .catch(() => undefined);
  }, [enabled, count, tourId, qc, user]);
  return query;
}
export function useSendMessage(tourId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => tripApi.sendMessage(tourId, text),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.trip(tourId, "messages") }),
  });
}

/* ---------- polls & checklist ---------- */
export function usePolls(tourId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trip(tourId, "polls"),
    queryFn: ({ signal }) => tripApi.polls(tourId, signal),
    enabled,
  });
}
export function useCreatePoll(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (body: CreatePollBody) => tripApi.createPoll(tourId, body),
    onSettled: () => invalidate("polls"),
  });
}
export function useVote(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: ({ pollId, optionId }: { pollId: string; optionId: string }) =>
      tripApi.vote(pollId, optionId),
    onSettled: () => invalidate("polls"),
  });
}
export function useChecklist(tourId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trip(tourId, "checklist"),
    queryFn: ({ signal }) => tripApi.checklist(tourId, signal),
    enabled,
  });
}
export function useSaveChecklist(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (items: { id?: string; title: string; required: boolean }[]) =>
      tripApi.saveChecklist(tourId, items),
    onSettled: () => invalidate("checklist"),
  });
}
export function useToggleChecklist(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (itemId: string) => tripApi.toggleChecklist(itemId),
    onSettled: () => invalidate("checklist"),
  });
}

/* ---------- album ---------- */
export function usePhotos(tourId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.trip(tourId, "photos"),
    queryFn: ({ signal }) => tripApi.photos(tourId, signal),
    enabled,
  });
}
export function useUploadPhoto(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: ({ file, caption }: { file: Blob; caption: string }) =>
      tripApi.uploadPhoto(tourId, file, caption),
    onSettled: () => invalidate("photos"),
  });
}
export function useDeletePhoto(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (photoId: string) => tripApi.deletePhoto(photoId),
    onSettled: () => invalidate("photos"),
  });
}

/* ---------- reviews ---------- */
export function useReviewTargets(tourId: string, enabled: boolean) {
  return useQuery({
    queryKey: queryKeys.trip(tourId, "review-targets"),
    queryFn: ({ signal }) => tripApi.reviewTargets(tourId, signal),
    enabled,
  });
}
export function useSubmitReview(tourId: string) {
  const invalidate = useTripInvalidate(tourId);
  return useMutation({
    mutationFn: (body: ReviewBody) => tripApi.review(tourId, body),
    onSettled: () => invalidate("review-targets"),
  });
}
