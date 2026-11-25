import { apiRequest } from "@/shared/api/http";
import { notificationsResponseSchema } from "./notification-schemas";

export const notificationsApi = {
  list: (signal?: AbortSignal) =>
    apiRequest("/me/notifications", {
      signal,
      schema: notificationsResponseSchema,
    }),
  markRead: (ids?: string[]) =>
    apiRequest("/me/notifications/read", {
      method: "POST",
      body: ids ? { ids } : {},
    }),
};
