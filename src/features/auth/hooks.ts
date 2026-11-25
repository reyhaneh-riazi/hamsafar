import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/shared/api/query-keys";
import { authApi } from "./api/auth-api";
import type {
  LoginBody,
  OtpVerifyBody,
  RegisterBody,
  UpdateProfileBody,
  User,
} from "./api/auth-schemas";

/** The signed-in user (null for guests). The server cookie is the source of truth. */
export function useSession() {
  const query = useQuery({
    queryKey: queryKeys.session,
    queryFn: ({ signal }) => authApi.me(signal),
    staleTime: 5 * 60_000,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.requestOtp({ phone }),
  });
}

export function useVerifyOtp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: OtpVerifyBody) => authApi.verifyOtp(body),
    onSuccess: ({ user }) => {
      // A different account may have been cached on this device: drop all private data first.
      qc.removeQueries({ queryKey: ["me"] });
      qc.removeQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: queryKeys.tours });
      qc.setQueryData<User | null>(queryKeys.session, user);
    },
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileBody) => authApi.updateProfile(body),
    onSuccess: (user) => qc.setQueryData<User | null>(queryKeys.session, user),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => {
      qc.removeQueries({ queryKey: ["me"] });
      qc.removeQueries({ queryKey: ["admin"] });
      qc.invalidateQueries({ queryKey: queryKeys.tours });
      qc.setQueryData<User | null>(queryKeys.session, null);
    },
  });
}

export function useSessions(userId: string) {
  return useQuery({
    queryKey: queryKeys.sessions(userId),
    queryFn: ({ signal }) => authApi.sessions(signal),
  });
}

export function useRevokeSession(userId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) => authApi.revokeSession(sessionId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: queryKeys.sessions(userId) }),
  });
}

export function useAvatar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (file: Blob | null) =>
      file ? authApi.uploadAvatar(file) : authApi.removeAvatar(),
    onSuccess: (user) => {
      qc.setQueryData<User | null>(queryKeys.session, user);
      qc.invalidateQueries({ queryKey: ["tours"] });
    },
  });
}

/** Email registration / login both return `{ user, isNewUser }` and start a session like OTP. */
export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: RegisterBody) => authApi.register(body),
    onSuccess: ({ user }) =>
      qc.setQueryData<User | null>(queryKeys.session, user),
  });
}

export function useEmailLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: LoginBody) => authApi.login(body),
    onSuccess: ({ user }) =>
      qc.setQueryData<User | null>(queryKeys.session, user),
  });
}
