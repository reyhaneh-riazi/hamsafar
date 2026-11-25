import { z } from "zod";

export const notificationTypeSchema = z.enum([
  "join_request",
  "request_approved",
  "request_rejected",
  "quorum_reached",
  "plan_changed",
  "tour_cancelled",
  "tour_approved",
  "tour_rejected",
  "new_message",
  "system",
]).catch("system");

export const notificationSchema = z.object({
  id: z.string(),
  type: notificationTypeSchema,
  title: z.string(),
  body: z.string(),
  tourId: z.string().nullable().default(null),
  createdAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
  read: z.boolean().default(false),
});
export type AppNotification = z.infer<typeof notificationSchema>;
export const notificationsResponseSchema = z.object({
  items: z.array(notificationSchema).default([]),
  unread: z.number().int().default(0),
});
