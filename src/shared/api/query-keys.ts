/**
 * Central query-key factory. Private (per-user) data is partitioned by user ID so one account
 * can never see another account's cached data; everything under `me` is dropped on logout.
 */
export const queryKeys = {
  session: ["session"] as const,
  me: (userId: string) => ["me", userId] as const,
  myTrips: (userId: string) => ["me", userId, "trips"] as const,
  myTours: (userId: string) => ["me", userId, "tours"] as const,
  favorites: (userId: string) => ["me", userId, "favorites"] as const,
  sessions: (userId: string) => ["me", userId, "sessions"] as const,
  tours: ["tours"] as const,
  tourList: (params: object) => ["tours", "list", params] as const,
  featured: ["tours", "featured"] as const,
  tourDetail: (tourId: string, viewerId: string | null) =>
    ["tours", "detail", tourId, viewerId ?? "guest"] as const,
  tourRequests: (tourId: string) => ["tours", "requests", tourId] as const,
  describe: (text: string) => ["tours", "describe", text] as const,
  destinations: ["destinations"] as const,
  notifications: (userId: string) => ["me", userId, "notifications"] as const,
  conversations: (userId: string) => ["me", userId, "conversations"] as const,
  similar: (userId: string) => ["me", userId, "similar"] as const,
  trip: (
    tourId: string,
    part:
      | "expenses"
      | "messages"
      | "polls"
      | "checklist"
      | "photos"
      | "review-targets",
  ) => ["trip", tourId, part] as const,
  publicProfile: (userId: string) => ["users", userId] as const,
  adminUsers: (q: string) => ["admin", "users", q] as const,
  adminReports: (status: string) => ["admin", "reports", status] as const,
  adminStats: ["admin", "stats"] as const,
  adminTours: (status: string) => ["admin", "tours", status] as const,
  invite: (token: string, viewerId: string | null) =>
    ["invites", token, viewerId ?? "guest"] as const,
  tourInvites: (tourId: string) => ["invites", "tour", tourId] as const,
};
