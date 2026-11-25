import { z } from "zod";

/** Support topics (Figma contact form «موضوع پیام»). Stable IDs; labels live in the UI. */
export const contactSubjectSchema = z.enum([
  "create_tour",
  "buy_tour",
  "payment_refund",
  "report",
  "suggestion",
  "other",
]);
export type ContactSubject = z.infer<typeof contactSubjectSchema>;

/** POST /contact (v0.7: phone instead of email, subject is an enum). */
export const contactBodySchema = z.object({
  name: z.string().min(2).max(60),
  phone: z.string().regex(/^09\d{9}$/),
  subject: contactSubjectSchema,
  message: z.string().min(10).max(1000),
});
export type ContactBody = z.infer<typeof contactBodySchema>;
export const contactResponseSchema = z.object({
  ticketId: z.string().optional(),
}).passthrough();

export const newsletterBodySchema = z.object({ email: z.string().email() });
export type NewsletterBody = z.infer<typeof newsletterBodySchema>;
