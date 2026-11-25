import type { User } from "./api/auth-schemas";

/**
 * UI capabilities derived from the session. This only decides what to *show*;
 * the backend remains the authority and answers 401/403 for anything not allowed.
 */
export interface Capabilities {
  isAuthenticated: boolean;
  canCreateTour: boolean;
  canFavorite: boolean;
  canRequestJoin: boolean;
  canAccessAdmin: boolean;
}

export function capabilitiesFor(user: User | null): Capabilities {
  const signedIn = user !== null;
  return {
    isAuthenticated: signedIn,
    canCreateTour: signedIn && user.profileComplete,
    canFavorite: signedIn,
    canRequestJoin: signedIn && user.profileComplete,
    canAccessAdmin: user?.role === "admin",
  };
}
