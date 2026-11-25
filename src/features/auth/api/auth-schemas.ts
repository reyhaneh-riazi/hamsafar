import { z } from "zod";

export const roleSchema = z.enum(["user", "admin"]);
export type Role = z.infer<typeof roleSchema>;

export const userSchema = z.object({
  id: z.string(),
  phone: z.string().nullable().optional().default(null),
  firstName: z.string().nullable().optional().default(""),
  lastName: z.string().nullable().optional().default(""),
  email: z.string().nullable().optional(),
  city: z.string().nullable().optional().default(""),
  bio: z.string().nullable().optional().default(null),
  role: roleSchema.optional().default("user"),
  profileComplete: z.boolean().optional().default(false),
  createdAt: z.string(),
  avatarUrl: z.string().nullable().optional().default(null),
  /** Category IDs (same enum as tours: camping, family, adventure, historic, beach, nature). */
  travelStyles: z.array(z.string()).optional().default([]),
  languages: z.array(z.string()).optional().default([]),
  interests: z.array(z.string()).optional().default([]),
  budgetRange: z.string().nullable().optional().default(null),
  favoritesPublic: z.boolean().optional().default(false),
  rating: z.number().nullable().optional().default(null),
  tripsCount: z.number().int().nonnegative().optional().default(0),
});
export type User = z.infer<typeof userSchema>;

/** POST /auth/otp/request */
export const otpRequestBodySchema = z.object({ phone: z.string() });
export type OtpRequestBody = z.infer<typeof otpRequestBodySchema>;
export const otpRequestResponseSchema = z.object({
  phone: z.string(),
  expiresInSec: z.number().int().positive(),
  resendInSec: z.number().int().nonnegative(),
  codeLength: z.number().int().positive(),
});
export type OtpRequestResponse = z.infer<typeof otpRequestResponseSchema>;

/** POST /auth/otp/verify — on success the server sets the HttpOnly session cookie. */
export const otpVerifyBodySchema = z.object({
  phone: z.string(),
  code: z.string(),
});
export type OtpVerifyBody = z.infer<typeof otpVerifyBodySchema>;
export const otpVerifyResponseSchema = z.object({
  user: userSchema,
  isNewUser: z.boolean().optional().default(false),
});
export type OtpVerifyResponse = z.infer<typeof otpVerifyResponseSchema>;

/** Email + password credentials (v0.6). Rules are repeated by the server. */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** POST /auth/register */
export const registerBodySchema = z.object({
  email: z.string().regex(EMAIL_PATTERN),
  password: z.string().min(PASSWORD_MIN).max(PASSWORD_MAX),
});
export type RegisterBody = z.infer<typeof registerBodySchema>;

/** POST /auth/login */
export const loginBodySchema = z.object({
  email: z.string(),
  password: z.string(),
});
export type LoginBody = z.infer<typeof loginBodySchema>;

/** GET /auth/me */
export const meResponseSchema = z.object({ user: userSchema });

/** PATCH /users/me */
export const updateProfileBodySchema = z.object({
  firstName: z.string().min(2).max(40),
  lastName: z.string().min(2).max(60),
  email: z.string().email().nullable().optional(),
  city: z.string().max(40).nullable().optional(),
  bio: z.string().max(300).nullable().optional(),
  travelStyles: z.array(z.string()).max(6).optional(),
  languages: z.array(z.string().max(30)).max(8).optional(),
  interests: z.array(z.string().max(40)).max(12).optional(),
  budgetRange: z.string().max(60).nullable().optional(),
  favoritesPublic: z.boolean().optional(),
});
export type UpdateProfileBody = z.infer<typeof updateProfileBodySchema>;

/** GET /auth/sessions */
export const sessionSchema = z.object({
  id: z.string(),
  device: z.string(),
  location: z.string().nullable(),
  lastActiveAt: z.string(),
  current: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;
export const sessionsResponseSchema = z.object({
  items: z.array(sessionSchema),
});

export function displayName(
  user: Pick<User, "firstName" | "lastName" | "phone">,
): string {
  const name = [user.firstName, user.lastName].filter(Boolean).join(" ").trim();
  return name || "همسفر جدید";
}
