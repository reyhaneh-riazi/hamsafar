import { setupServer } from "msw/node";
import { handlers } from "./handlers";

/** Same handlers for Vitest — tests run fully offline. */
export const server = setupServer(...handlers);
