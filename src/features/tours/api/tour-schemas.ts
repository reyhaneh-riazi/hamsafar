import { z } from "zod";

/* Stable enum IDs — never use Persian labels for logic. Labels live in ../model/labels.ts */
export const categorySchema = z.enum([
  "camping",
  "family",
  "adventure",
  "historic",
  "beach",
  "nature",
]);
export type TourCategory = z.infer<typeof categorySchema>;

export const difficultySchema = z.enum(["easy", "moderate", "hard"]);
export type Difficulty = z.infer<typeof difficultySchema>;

export const tourStatusSchema = z.enum([
  "draft",
  "pending_review",
  "open",
  "confirmed",
  "cancelled",
  "completed",
  "rejected",
]);
export type TourStatus = z.infer<typeof tourStatusSchema>;

export const badgeSchema = z.enum([
  "special_offer",
  "new",
  "popular",
  "best_seller",
]);
export type TourBadge = z.infer<typeof badgeSchema>;

export const itemTypeSchema = z.enum([
  "accommodation",
  "restaurant",
  "attraction",
  "activity",
  "transport",
]);
export type ItineraryItemType = z.infer<typeof itemTypeSchema>;

export const joinStatusSchema = z.enum([
  "pending",
  "approved",
  "rejected",
  "cancelled",
]);
export type JoinStatus = z.infer<typeof joinStatusSchema>;

/** Date-only values are "YYYY-MM-DD"; money is integer Toman. */
export const tourSummarySchema = z.object({
  id: z.union([z.string(), z.number()]).transform(String),
  title: z.string().nullish().transform((v) => v ?? ""),
  destination: z.string().nullish().transform((v) => v ?? ""),
  province: z.string().nullish().transform((v) => v ?? ""),
  coverImageUrl: z
    .string()
    .nullable()
    .optional()
    .transform((v) => v || "/images/tours/tour-mesr-desert.webp"),
  startDate: z.string().nullish().transform((v) => v ?? ""),
  endDate: z.string().nullish().transform((v) => v ?? ""),
  durationDays: z.number().int().min(0).default(1),
  priceToman: z.number().int().nonnegative().default(0),
  capacity: z.number().int().min(0).default(0),
  minParticipants: z.number().int().min(0).default(0),
  confirmedCount: z.number().int().nonnegative().default(0),
  difficulty: difficultySchema.catch("easy"),
  categories: z.array(categorySchema.catch("nature")).nullish().transform((v) => v ?? []),
  badge: badgeSchema.nullable().catch(null),
  rating: z.number().min(0).max(5).nullable().default(null),
  reviewCount: z.number().int().nonnegative().default(0),
  status: tourStatusSchema.catch("draft"),
  createdAt: z.string().nullish().transform((v) => v || new Date().toISOString()),
});
export type TourSummary = z.infer<typeof tourSummarySchema>;

export const itemStatusSchema = z.enum([
  "planned",
  "done",
  "cancelled",
  "changed",
]);
export type ItemStatus = z.infer<typeof itemStatusSchema>;

export const personSchema = z.object({
  id: z.string(),
  displayName: z.string().nullish().transform((v) => v || "همسفر"),
  avatarUrl: z.string().nullish().transform((v) => v ?? null),
  city: z.string().nullish().transform((v) => v ?? null),
});
export type Person = z.infer<typeof personSchema>;

export const itemCommentSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
  author: personSchema,
  byLeader: z.boolean(),
});
export type ItemComment = z.infer<typeof itemCommentSchema>;

export const itineraryItemSchema = z.object({
  id: z.string(),
  type: itemTypeSchema,
  title: z.string(),
  location: z.string().nullable(),
  startTime: z.string().nullable(),
  note: z.string().nullable(),
  costToman: z.number().int().nonnegative().nullable(),
  link: z.string().nullable(),
  status: itemStatusSchema,
  comments: z.array(itemCommentSchema),
});
export type ItineraryItem = z.infer<typeof itineraryItemSchema>;

export const itineraryDaySchema = z.object({
  id: z.string(),
  dayNumber: z.number().int().positive(),
  date: z.string(),
  title: z.string(),
  items: z.array(itineraryItemSchema),
});
export type ItineraryDay = z.infer<typeof itineraryDaySchema>;

export const membershipSchema = z.union([
  z.object({
    requestId: z.string().nullish().transform((v) => v ?? ""),
    status: joinStatusSchema,
  }),
  joinStatusSchema.transform((status) => ({
    requestId: "",
    status,
  })),
]);

const rawTourDetailSchema = tourSummarySchema.extend({
  description: z.string().nullish().transform((v) => v ?? ""),
  highlights: z.array(z.string()).nullish().transform((v) => v ?? []),
  includes: z.array(z.string()).nullish().transform((v) => v ?? []),
  meetingPoint: z.string().nullable().default(null),
  requiresApproval: z.boolean().default(false),
  gallery: z.array(z.string()).nullish().transform((v) => v ?? []),
  cancelReason: z.string().nullable().default(null),
  itinerary: z.array(itineraryDaySchema).nullish().transform((v) => v ?? []),
  changeLog: z.array(
    z.object({ id: z.string(), at: z.string(), text: z.string() }),
  ).nullish().transform((v) => v ?? []),
  /** `tagline` (v0.7): short label under the name, e.g. «عکاسی» (first interest/travel style). */
  members: z.array(
    personSchema.extend({
      isLeader: z.boolean().default(false),
      tagline: z.string().nullable().default(null),
    }),
  ).nullish().transform((v) => v ?? []),
  anonymousMembers: z.number().int().nonnegative().default(0),
  creator: z
    .object({
      id: z.string().default("creator"),
      displayName: z.string().default("برگزارکننده"),
      avatarUrl: z.string().nullable().default(null),
      rating: z.number().nullable().default(null),
      toursLed: z.number().int().nonnegative().default(0),
      /** v0.7 — organizer modal (Figma 129:3557). */
      bio: z.string().nullable().default(null),
      memberSince: z.string().nullable().default(null),
      reviewCount: z.number().int().nonnegative().default(0),
      verifications: z.array(z.string()).default([]),
    })
    .default({
      id: "creator",
      displayName: "برگزارکننده",
      avatarUrl: null,
      rating: null,
      toursLed: 0,
      bio: null,
      memberSince: null,
      reviewCount: 0,
      verifications: [],
    }),
  /** v0.7 — latest reviews the organizer received on earlier trips («نظر همسفرهای قبلی»). */
  leaderReviews: z
    .array(
      z.object({
        id: z.string(),
        authorName: z.string(),
        rating: z.number().int().min(1).max(5),
        comment: z.string(),
        createdAt: z.string(),
        tourTitle: z.string(),
      }),
    )
    .nullish().transform((v) => v ?? []),
  viewer: z
    .object({
      isFavorite: z.boolean().default(false),
      isCreator: z.boolean().default(false),
      isMember: z.boolean().default(false),
      membership: membershipSchema.nullable().default(null),
      canRequestJoin: z.boolean().default(true),
      /** Approved members + leader, only after the tour reached its quorum (FS 11). */
      canChat: z.boolean().default(false),
      /** Only the tour leader, while the tour is still active. */
      canManage: z.boolean().default(false),
      canReview: z.boolean().default(false),
    })
    .default({
      isFavorite: false,
      isCreator: false,
      isMember: false,
      membership: null,
      canRequestJoin: true,
      canChat: false,
      canManage: false,
      canReview: false,
    }),
});

export const tourDetailSchema = z.preprocess((input: unknown) => {
  if (input && typeof input === "object") {
    if ("items" in input && Array.isArray((input as { items: unknown[] }).items)) {
      const items = (input as { items: unknown[] }).items;
      if (items.length > 0) return items[0];
    }
    if ("tour" in input && typeof (input as { tour: unknown }).tour === "object") {
      return (input as { tour: unknown }).tour;
    }
  }
  return input;
}, rawTourDetailSchema);

export type TourDetail = z.infer<typeof tourDetailSchema>;

export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    items: z.array(item),
    page: z.number().int().min(0).default(1),
    pageSize: z.number().int().min(0).default(10),
    total: z.number().int().nonnegative().default(0),
  });
}

export const tourListResponseSchema = paginatedSchema(tourSummarySchema);
export type TourListResponse = z.infer<typeof tourListResponseSchema>;

export const tourSortSchema = z.enum([
  "relevance",
  "soonest",
  "newest",
  "spots",
  "price_asc",
  "price_desc",
  "rating",
]);
export type TourSort = z.infer<typeof tourSortSchema>;

/** GET /tours query parameters */
export interface TourSearchParams {
  q?: string;
  destination?: string;
  category?: TourCategory;
  difficulty?: Difficulty;
  maxPrice?: number;
  from?: string;
  to?: string;
  sort?: TourSort;
  page?: number;
  pageSize?: number;
}

export const destinationSchema = z.object({
  id: z.string(),
  name: z.string(),
  province: z.string(),
  imageUrl: z.string(),
  typicalDays: z.number().int().positive(),
  tourCount: z.number().int().nonnegative(),
});
export type Destination = z.infer<typeof destinationSchema>;
export const destinationListSchema = z.object({
  items: z.array(destinationSchema),
});

/** POST /search/describe — descriptive ("smart") search */
export const describeBodySchema = z.object({
  text: z.string().min(2).max(300),
});
export const describeResponseSchema = z.object({
  understood: z.array(z.string()),
  items: z.array(
    tourSummarySchema.extend({
      matchScore: z.number().min(0).max(100),
      matchReasons: z.array(z.string()),
    }),
  ),
});
export type DescribeResponse = z.infer<typeof describeResponseSchema>;
export type DescribedTour = DescribeResponse["items"][number];

/** Join requests */
export const joinRequestBodySchema = z.object({ message: z.string().max(400) });
export const joinRequestSchema = z.object({
  id: z.string(),
  tourId: z.string(),
  status: joinStatusSchema,
  message: z.string(),
  createdAt: z.string(),
  decidedAt: z.string().nullable(),
});
export type JoinRequest = z.infer<typeof joinRequestSchema>;

export const myTripSchema = z.object({
  request: joinRequestSchema,
  tour: tourSummarySchema,
});
export type MyTrip = z.infer<typeof myTripSchema>;
export const myTripsResponseSchema = z.object({ items: z.array(myTripSchema) });

export const creatorRequestSchema = joinRequestSchema.extend({
  applicant: personSchema,
});
export type CreatorRequest = z.infer<typeof creatorRequestSchema>;
export const creatorRequestsResponseSchema = z.object({
  items: z.array(creatorRequestSchema),
});

export const joinDecisionBodySchema = z.object({
  decision: z.enum(["approve", "reject"]),
});

/** POST /tours — create (creator) */
export const createTourBodySchema = z.object({
  title: z.string().min(5).max(80),
  destination: z.string().min(2).max(60),
  province: z.string().min(2).max(40),
  /** YYYY-MM-DD, after today and at most a year ahead (checked by the server). */
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  durationDays: z.number().int().min(1).max(30),
  /** Budget per person in Toman. */
  priceToman: z.number().int().min(1).max(500_000_000),
  capacity: z.number().int().min(2).max(60),
  minParticipants: z.number().int().min(1),
  difficulty: difficultySchema,
  categories: z.array(categorySchema).min(1).max(6),
  description: z.string().min(20).max(2000),
  meetingPoint: z.string().max(120).nullable(),
  requiresApproval: z.boolean(),
  submit: z.boolean(),
  itinerary: z.array(
    z.object({
      dayNumber: z.number().int().positive(),
      title: z.string().max(80),
      items: z.array(
        z.object({
          type: itemTypeSchema,
          title: z.string().min(2).max(80),
          location: z.string().max(80).nullable(),
          startTime: z
            .string()
            .regex(/^([01]\d|2[0-3]):[0-5]\d$/)
            .nullable(),
          note: z.string().max(200).nullable(),
        }),
      ),
    }),
  ),
});
export type CreateTourBody = z.infer<typeof createTourBodySchema>;
export const createTourResponseSchema = z.object({
  id: z.string(),
  status: tourStatusSchema,
});

export const myToursResponseSchema = z.object({
  items: z.array(
    tourSummarySchema.extend({
      pendingRequests: z.number().int().nonnegative(),
    }),
  ),
});
export type MyCreatedTour = z.infer<
  typeof myToursResponseSchema
>["items"][number];

/** POST /discounts/validate (v0.7) */
export const discountResponseSchema = z.object({
  code: z.string(),
  percent: z.number().int().min(1).max(100),
  label: z.string(),
});
export type Discount = z.infer<typeof discountResponseSchema>;

/** POST /tours/:id/checkout (v0.7) — join + simulated deposit payment. */
export const checkoutBodySchema = z.object({
  seats: z.number().int().min(1).max(4),
  discountCode: z.string().max(20).nullable(),
  /** Test gateway only: the UI lets the user try both outcomes. Never send real card data. */
  simulate: z.enum(["success", "fail"]),
  message: z.string().max(400).default(""),
});
export type CheckoutBody = z.input<typeof checkoutBodySchema>;
export const checkoutResponseSchema = z.object({
  requestId: z.string(),
  requestStatus: joinStatusSchema,
  seats: z.number().int(),
  subtotalToman: z.number().int(),
  discountToman: z.number().int(),
  totalToman: z.number().int(),
  paymentRef: z.string(),
});
export type CheckoutResult = z.infer<typeof checkoutResponseSchema>;
