import { useMutation } from "@tanstack/react-query";
import { contentApi } from "./api/content-api";
import type { ContactBody } from "./api/content-schemas";

export function useSubscribeNewsletter() {
  return useMutation({
    mutationFn: (email: string) => contentApi.subscribe({ email }),
  });
}

export function useSendContact() {
  return useMutation({
    mutationFn: (body: ContactBody) => contentApi.contact(body),
  });
}
