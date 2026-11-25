import { z } from "zod";
import {
  itemStatusSchema,
  itemTypeSchema,
  personSchema,
} from "@/features/tours/api/tour-schemas";

/* ---------------- FS 6 — expenses, shares, settlement ---------------- */
export const expenseCategorySchema = z.enum([
  "accommodation",
  "transport",
  "food",
  "activity",
  "other",
]);
export type ExpenseCategory = z.infer<typeof expenseCategorySchema>;
export const paymentStatusSchema = z.enum(["paid", "pending", "refunded"]);

export const expenseSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: expenseCategorySchema,
  amountToman: z.number().int().nonnegative(),
  paidBy: personSchema,
  createdAt: z.string(),
});
export type Expense = z.infer<typeof expenseSchema>;

export const expensesResponseSchema = z.object({
  items: z.array(expenseSchema),
  totalToman: z.number().int().nonnegative(),
  sharePerMemberToman: z.number().int().nonnegative(),
  members: z.array(
    z.object({
      person: personSchema,
      isLeader: z.boolean(),
      shareToman: z.number().int().nonnegative(),
      paidToman: z.number().int().nonnegative(),
      /** Positive = owes the group, negative = should receive. */
      balanceToman: z.number().int(),
      paymentStatus: paymentStatusSchema,
    }),
  ),
  canEdit: z.boolean(),
});
export type ExpensesResponse = z.infer<typeof expensesResponseSchema>;

export const createExpenseBodySchema = z.object({
  title: z.string().min(2).max(80),
  category: expenseCategorySchema,
  amountToman: z.number().int().positive(),
});
export type CreateExpenseBody = z.infer<typeof createExpenseBodySchema>;

export const paymentResultSchema = z.object({
  status: paymentStatusSchema,
  reference: z.string(),
  amountToman: z.number().int(),
});

/* ---------------- FS 11 — chat ---------------- */
export const messageSchema = z.object({
  id: z.string(),
  text: z.string(),
  createdAt: z.string(),
  author: personSchema,
  isMine: z.boolean(),
  byLeader: z.boolean(),
});
export type ChatMessage = z.infer<typeof messageSchema>;
export const messagesResponseSchema = z.object({
  items: z.array(messageSchema),
  canPost: z.boolean(),
});

export const conversationSchema = z.object({
  tourId: z.string(),
  tourTitle: z.string(),
  coverImageUrl: z.string().nullish().transform((v) => v ?? ""),
  unread: z.number().int().nonnegative().default(0),
  lastMessage: messageSchema.nullable().default(null),
  memberCount: z.number().int().default(0),
});
export type Conversation = z.infer<typeof conversationSchema>;
export const conversationsResponseSchema = z.object({
  items: z.array(conversationSchema),
  totalUnread: z.number().int(),
});

/* ---------------- FS 11 — polls & checklist ---------------- */
export const pollSchema = z.object({
  id: z.string(),
  question: z.string(),
  deadline: z.string().nullish().transform((v) => v ?? ""),
  closed: z.boolean().default(false),
  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
      votes: z.number().int().nullable().default(0),
    }),
  ).default([]),
  myVote: z.string().nullable().default(null),
  totalVotes: z.number().int().default(0),
  winnerOptionId: z.string().nullable().default(null),
});
export type Poll = z.infer<typeof pollSchema>;
export const pollsResponseSchema = z.object({
  items: z.array(pollSchema),
  canCreate: z.boolean(),
  canVote: z.boolean(),
});
export const createPollBodySchema = z.object({
  question: z.string().min(4).max(120),
  options: z.array(z.string().min(1).max(60)).min(2).max(6),
  deadline: z.string(),
});
export type CreatePollBody = z.infer<typeof createPollBodySchema>;

export const checklistResponseSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      required: z.boolean().default(false),
      done: z.boolean().default(false),
      doneCount: z.number().int().default(0),
    }),
  ).default([]),
  canEdit: z.boolean().default(false),
  memberCount: z.number().int().default(0),
});
export type ChecklistResponse = z.infer<typeof checklistResponseSchema>;

/* ---------------- FS 12 — album ---------------- */
export const photoSchema = z.object({
  id: z.string(),
  url: z.string(),
  caption: z.string(),
  createdAt: z.string(),
  uploader: personSchema,
  canDelete: z.boolean(),
});
export type Photo = z.infer<typeof photoSchema>;
export const photosResponseSchema = z.object({
  items: z.array(photoSchema),
  canUpload: z.boolean(),
  myCount: z.number().int(),
  limitPerMember: z.number().int(),
});

/* ---------------- FS 3 — leader edits the official plan ---------------- */
export const itineraryUpdateBodySchema = z.object({
  days: z.array(
    z.object({
      dayNumber: z.number().int().positive(),
      title: z.string().max(80),
      items: z.array(
        z.object({
          id: z.string().nullable(),
          type: itemTypeSchema,
          title: z.string().min(2).max(80),
          location: z.string().max(80).nullable(),
          startTime: z.string().nullable(),
          note: z.string().max(200).nullable(),
          costToman: z.number().int().nonnegative().nullable(),
          link: z.string().max(200).nullable(),
          status: itemStatusSchema,
        }),
      ),
    }),
  ),
  changeNote: z.string().max(200).optional(),
});
export type ItineraryUpdateBody = z.infer<typeof itineraryUpdateBodySchema>;

export const tourUpdateBodySchema = z.object({
  title: z.string().min(5).max(80).optional(),
  description: z.string().min(20).max(2000).optional(),
  priceToman: z.number().int().min(0).optional(),
  capacity: z.number().int().min(2).max(60).optional(),
  minParticipants: z.number().int().min(1).optional(),
  startDate: z.string().optional(),
  meetingPoint: z.string().max(120).nullable().optional(),
  requiresApproval: z.boolean().optional(),
});
export type TourUpdateBody = z.infer<typeof tourUpdateBodySchema>;

/* ---------------- FS 10 — ratings after the trip ---------------- */
export const reviewTargetsSchema = z.object({
  items: z.array(
    z.object({
      person: personSchema,
      myRating: z.number().int().nullable(),
      myComment: z.string().nullable(),
    }),
  ),
});
export const reviewBodySchema = z.object({
  targetUserId: z.string(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(300),
});
export type ReviewBody = z.infer<typeof reviewBodySchema>;
