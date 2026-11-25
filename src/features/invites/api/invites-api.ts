import { apiRequest } from "@/shared/api/http";
import {
  tourInvitesResponseSchema,
  tourInviteItemSchema,
  acceptInviteResponseSchema,
  inviteSchema,
  type CreateInviteBody,
} from "./invite-schemas";

const id = (v: string) => encodeURIComponent(v);

export const invitesApi = {
  get: (token: string, signal?: AbortSignal) =>
    apiRequest(`/invites/${id(token)}`, { signal, schema: inviteSchema }),
  accept: (token: string) =>
    apiRequest(`/invites/${id(token)}/accept`, {
      method: "POST",
      schema: acceptInviteResponseSchema,
    }),
  listForTour: (tourId: string, signal?: AbortSignal) =>
    apiRequest(`/tours/${id(tourId)}/invites`, {
      signal,
      schema: tourInvitesResponseSchema,
    }).then((r) => r.items),
  create: (tourId: string, body: CreateInviteBody) =>
    apiRequest(`/tours/${id(tourId)}/invites`, {
      method: "POST",
      body,
      schema: tourInviteItemSchema,
    }),
  revoke: (token: string) =>
    apiRequest(`/invites/${id(token)}`, { method: "DELETE" }),
};
