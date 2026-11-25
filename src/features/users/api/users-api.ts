import { apiRequest } from "@/shared/api/http";
import {
  publicProfileSchema,
  similarTravelersSchema,
  type ReportBody,
} from "./user-schemas";

const id = (v: string) => encodeURIComponent(v);

export const usersApi = {
  profile: (userId: string, signal?: AbortSignal) =>
    apiRequest(`/users/${id(userId)}`, { signal, schema: publicProfileSchema }),
  block: (userId: string) =>
    apiRequest(`/users/${id(userId)}/block`, { method: "POST" }),
  unblock: (userId: string) =>
    apiRequest(`/users/${id(userId)}/block`, { method: "DELETE" }),
  report: (body: ReportBody) =>
    apiRequest("/reports", { method: "POST", body }),
  similar: (signal?: AbortSignal) =>
    apiRequest("/me/similar-travelers", {
      signal,
      schema: similarTravelersSchema,
    }).then((r) => r.items),
};
