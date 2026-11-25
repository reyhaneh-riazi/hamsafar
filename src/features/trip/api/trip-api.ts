import { z } from "zod";
import { apiRequest } from "@/shared/api/http";
import {
  checklistResponseSchema,
  conversationsResponseSchema,
  expensesResponseSchema,
  messageSchema,
  messagesResponseSchema,
  paymentResultSchema,
  photosResponseSchema,
  pollsResponseSchema,
  reviewTargetsSchema,
  type CreateExpenseBody,
  type CreatePollBody,
  type ItineraryUpdateBody,
  type ReviewBody,
  type TourUpdateBody,
} from "./trip-schemas";

const id = (v: string) => encodeURIComponent(v);

function imageForm(file: Blob, extra: Record<string, string> = {}): FormData {
  const form = new FormData();
  form.append("file", file, "photo.webp");
  Object.entries(extra).forEach(([k, v]) => form.append(k, v));
  return form;
}

export const tripApi = {
  /* leader-only management */
  updateTour: (tourId: string, body: TourUpdateBody) =>
    apiRequest(`/tours/${id(tourId)}`, { method: "PATCH", body }),
  uploadCover: (tourId: string, file: Blob) =>
    apiRequest(`/tours/${id(tourId)}/cover`, {
      method: "POST",
      body: imageForm(file),
      schema: z.object({ coverImageUrl: z.string().nullable() }),
    }),
  cancelTour: (tourId: string, reason: string) =>
    apiRequest(`/tours/${id(tourId)}/cancel`, {
      method: "POST",
      body: { reason },
    }),
  updateItinerary: (tourId: string, body: ItineraryUpdateBody) =>
    apiRequest(`/tours/${id(tourId)}/itinerary`, { method: "PUT", body }),

  /* members */
  addComment: (tourId: string, itemId: string, text: string) =>
    apiRequest(`/tours/${id(tourId)}/items/${id(itemId)}/comments`, {
      method: "POST",
      body: { text },
      schema: z.object({ id: z.string() }),
    }),

  expenses: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/expenses`, {
      signal,
      schema: expensesResponseSchema,
    }),
  addExpense: (tourId: string, body: CreateExpenseBody) =>
    apiRequest(`/tours/${id(tourId)}/expenses`, {
      method: "POST",
      body,
      schema: expensesResponseSchema,
    }),
  deleteExpense: (tourId: string, expenseId: string) =>
    apiRequest(`/tours/${id(tourId)}/expenses/${id(expenseId)}`, {
      method: "DELETE",
    }),
  pay: (tourId: string, simulate: "success" | "fail") =>
    apiRequest(`/tours/${id(tourId)}/payments`, {
      method: "POST",
      body: { simulate },
      schema: paymentResultSchema,
    }),

  conversations: (signal?: AbortSignal) =>
    apiRequest("/me/conversations", {
      signal,
      schema: conversationsResponseSchema,
    }),
  messages: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/messages`, {
      signal,
      schema: messagesResponseSchema,
    }),
  sendMessage: (tourId: string, text: string) =>
    apiRequest(`/tours/${id(tourId)}/messages`, {
      method: "POST",
      body: { text },
      schema: messageSchema,
    }),
  markRead: (tourId: string) =>
    apiRequest(`/tours/${id(tourId)}/messages/read`, { method: "POST" }),

  polls: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/polls`, {
      signal,
      schema: pollsResponseSchema,
    }),
  createPoll: (tourId: string, body: CreatePollBody) =>
    apiRequest(`/tours/${id(tourId)}/polls`, { method: "POST", body }),
  vote: (pollId: string, optionId: string) =>
    apiRequest(`/polls/${id(pollId)}/vote`, {
      method: "POST",
      body: { optionId },
    }),

  checklist: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/checklist`, {
      signal,
      schema: checklistResponseSchema,
    }),
  saveChecklist: (
    tourId: string,
    items: { id?: string; title: string; required: boolean }[],
  ) =>
    apiRequest(`/tours/${id(tourId)}/checklist`, {
      method: "PUT",
      body: { items },
    }),
  toggleChecklist: (itemId: string) =>
    apiRequest(`/checklist/${id(itemId)}/toggle`, { method: "POST" }),

  photos: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/photos`, {
      signal,
      schema: photosResponseSchema,
    }),
  uploadPhoto: (tourId: string, file: Blob, caption: string) =>
    apiRequest(`/tours/${id(tourId)}/photos`, {
      method: "POST",
      body: imageForm(file, { caption }),
      schema: z.object({ url: z.string().nullable() }),
    }),
  deletePhoto: (photoId: string) =>
    apiRequest(`/photos/${id(photoId)}`, { method: "DELETE" }),

  reviewTargets: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/reviews/targets`, {
      signal,
      schema: reviewTargetsSchema,
    }),
  review: (tourId: string, body: ReviewBody) =>
    apiRequest(`/tours/${id(tourId)}/reviews`, { method: "POST", body }),
};
