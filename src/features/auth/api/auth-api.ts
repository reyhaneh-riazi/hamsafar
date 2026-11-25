import { ApiError } from "@/shared/api/errors";
import { apiRequest } from "@/shared/api/http";
import {
  meResponseSchema,
  otpRequestResponseSchema,
  otpVerifyResponseSchema,
  sessionsResponseSchema,
  type OtpRequestBody,
  type OtpVerifyBody,
  type LoginBody,
  type RegisterBody,
  type UpdateProfileBody,
  type User,
} from "./auth-schemas";

export const authApi = {
  requestOtp: (body: OtpRequestBody) =>
    apiRequest("/auth/otp/request", {
      method: "POST",
      body,
      schema: otpRequestResponseSchema,
    }),

  verifyOtp: (body: OtpVerifyBody) =>
    apiRequest("/auth/otp/verify", {
      method: "POST",
      body,
      schema: otpVerifyResponseSchema,
    }),

  /** Creates an account with email + password and signs in (sets the session cookie). */
  register: (body: RegisterBody) =>
    apiRequest("/auth/register", {
      method: "POST",
      body,
      schema: otpVerifyResponseSchema,
    }),

  login: (body: LoginBody) =>
    apiRequest("/auth/login", {
      method: "POST",
      body,
      schema: otpVerifyResponseSchema,
    }),

  /** Current session user, or null when not signed in (401 is an expected state here). */
  async me(signal?: AbortSignal): Promise<User | null> {
    try {
      const res = await apiRequest("/auth/me", {
        signal,
        schema: meResponseSchema,
      });
      return res.user;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return null;
      throw error;
    }
  },

  updateProfile: (body: UpdateProfileBody) =>
    apiRequest("/users/me", {
      method: "PATCH",
      body,
      schema: meResponseSchema,
    }).then((r) => r.user),

  uploadAvatar: (file: Blob) => {
    const form = new FormData();
    form.append("file", file, "avatar.webp");
    return apiRequest("/users/me/avatar", {
      method: "POST",
      body: form,
      schema: meResponseSchema,
    }).then((r) => r.user);
  },

  removeAvatar: () =>
    apiRequest("/users/me/avatar", {
      method: "DELETE",
      schema: meResponseSchema,
    }).then((r) => r.user),

  logout: () => apiRequest("/auth/logout", { method: "POST" }),

  sessions: (signal?: AbortSignal) =>
    apiRequest("/auth/sessions", {
      signal,
      schema: sessionsResponseSchema,
    }).then((r) => r.items),

  revokeSession: (sessionId: string) =>
    apiRequest(`/auth/sessions/${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    }),
};
