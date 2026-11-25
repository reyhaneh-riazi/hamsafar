import { apiRequest } from "@/shared/api/http";
import {
  contactResponseSchema,
  type ContactBody,
  type NewsletterBody,
} from "./content-schemas";

export const contentApi = {
  contact: (body: ContactBody) =>
    apiRequest("/contact", {
      method: "POST",
      body,
      schema: contactResponseSchema,
    }),
  subscribe: (body: NewsletterBody) =>
    apiRequest("/newsletter", { method: "POST", body }),
};
