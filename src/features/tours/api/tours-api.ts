import { z } from "zod";
import { apiRequest } from "@/shared/api/http";
import {
  checkoutResponseSchema,
  createTourResponseSchema,
  discountResponseSchema,
  creatorRequestsResponseSchema,
  describeResponseSchema,
  destinationListSchema,
  joinRequestSchema,
  myToursResponseSchema,
  myTripsResponseSchema,
  tourDetailSchema,
  tourListResponseSchema,
  tourSummarySchema,
  type CheckoutBody,
  type CreateTourBody,
  type TourSearchParams,
} from "./tour-schemas";

const id = (value: string) => encodeURIComponent(value);

export const toursApi = {
  list: (params: TourSearchParams, signal?: AbortSignal) =>
    apiRequest("/tours", {
      query: { ...params },
      signal,
      schema: tourListResponseSchema,
    }),

  featured: (signal?: AbortSignal) =>
    apiRequest("/tours/featured", {
      signal,
      schema: z.object({ items: z.array(tourSummarySchema) }),
    }).then((r) => r.items),

  detail: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}`, { signal, schema: tourDetailSchema }),

  describe: (text: string, signal?: AbortSignal) =>
    apiRequest("/search/describe", {
      method: "POST",
      body: { text },
      signal,
      schema: describeResponseSchema,
    }),

  destinations: (signal?: AbortSignal) =>
    apiRequest("/destinations", { signal, schema: destinationListSchema }).then(
      (r) => r.items,
    ),

  requestJoin: (tourId: string, message: string) =>
    apiRequest(`/tours/${id(tourId)}/join-requests`, {
      method: "POST",
      body: { message },
      schema: joinRequestSchema,
    }),

  cancelJoin: (tourId: string) =>
    apiRequest(`/tours/${id(tourId)}/join-requests/me`, { method: "DELETE" }),

  myTrips: (signal?: AbortSignal) =>
    apiRequest("/me/trips", { signal, schema: myTripsResponseSchema }).then(
      (r) => r.items,
    ),

  myTours: (signal?: AbortSignal) =>
    apiRequest("/me/tours", { signal, schema: myToursResponseSchema }).then(
      (r) => r.items,
    ),

  creatorRequests: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/join-requests`, {
      signal,
      schema: creatorRequestsResponseSchema,
    }).then((r) => r.items),

  decideRequest: (requestId: string, decision: "approve" | "reject") =>
    apiRequest(`/join-requests/${id(requestId)}`, {
      method: "PATCH",
      body: { decision },
      schema: joinRequestSchema,
    }),

  create: (body: CreateTourBody) =>
    apiRequest("/tours", {
      method: "POST",
      body,
      schema: createTourResponseSchema,
    }),

  validateDiscount: (tourId: string, code: string) =>
    apiRequest("/discounts/validate", {
      method: "POST",
      body: { tourId, code },
      schema: discountResponseSchema,
    }),

  checkout: (tourId: string, body: CheckoutBody) =>
    apiRequest(`/tours/${id(tourId)}/checkout`, {
      method: "POST",
      body,
      schema: checkoutResponseSchema,
    }),

  /** Replaces a tour that is still a draft (creator only). `submit: true` sends it for review. */
  updateDraft: (tourId: string, body: CreateTourBody) =>
    apiRequest(`/tours/${id(tourId)}/draft`, {
      method: "PUT",
      body,
      schema: createTourResponseSchema,
    }),
};
