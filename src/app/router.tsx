import { createBrowserRouter } from "react-router";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { HomePage } from "@/features/home/ui/HomePage";
import { AppLayout } from "./layout/AppLayout";
import { NotFoundPage } from "./layout/NotFoundPage";
import { RouteError } from "./layout/RouteError";

/* Heavier routes are code-split; the home page ships in the main bundle for a fast first paint. */
const messagesRoute = () =>
  import("@/features/trip/ui/MessagesPage").then((m) => ({
    Component: () => (
      <RequireAuth>
        <m.MessagesPage />
      </RequireAuth>
    ),
  }));

export const router = createBrowserRouter([
  {
    path: "/auth",
    errorElement: <RouteError />,
    lazy: () =>
      import("@/features/auth/ui/AuthPage").then((m) => ({
        Component: m.AuthPage,
      })),
  },
  {
    element: <AppLayout />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <HomePage /> },
      {
        path: "tours",
        lazy: () =>
          import("@/features/tours/ui/ToursPage").then((m) => ({
            Component: m.ToursPage,
          })),
      },
      {
        path: "tours/:tourId",
        lazy: () =>
          import("@/features/tours/ui/TourDetailPage").then((m) => ({
            Component: m.TourDetailPage,
          })),
      },
      {
        path: "tours/:tourId/checkout",
        lazy: () =>
          import("@/features/tours/ui/CheckoutPage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.CheckoutPage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "tours/:tourId/manage",
        lazy: () =>
          import("@/features/trip/ui/ManageTourPage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.ManageTourPage />
              </RequireAuth>
            ),
          })),
      },
      { path: "messages", lazy: messagesRoute },
      { path: "messages/:tourId", lazy: messagesRoute },
      {
        path: "users/:userId",
        lazy: () =>
          import("@/features/users/ui/PublicProfilePage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.PublicProfilePage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "planner",
        lazy: () =>
          import("@/features/planner/ui/PlannerPage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.PlannerPage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "profile",
        lazy: () =>
          import("@/features/profile/ui/ProfilePage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.ProfilePage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "favorites",
        lazy: () =>
          import("@/features/favorites/ui/FavoritesPage").then((m) => ({
            Component: () => (
              <RequireAuth>
                <m.FavoritesPage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "admin",
        lazy: () =>
          import("@/features/admin/ui/AdminPage").then((m) => ({
            Component: () => (
              <RequireAuth role="admin">
                <m.AdminPage />
              </RequireAuth>
            ),
          })),
      },
      {
        path: "invite/:token",
        lazy: () =>
          import("@/features/invites/ui/InvitePage").then((m) => ({
            Component: m.InvitePage,
          })),
      },
      {
        path: "ui-kit",
        lazy: () =>
          import("@/features/ui-kit/UiKitPage").then((m) => ({
            Component: m.UiKitPage,
          })),
      },
      {
        path: "about",
        lazy: () =>
          import("@/features/content/ui/AboutPage").then((m) => ({
            Component: m.AboutPage,
          })),
      },
      {
        path: "rules",
        lazy: () =>
          import("@/features/content/ui/RulesPage").then((m) => ({
            Component: m.RulesPage,
          })),
      },
      {
        path: "contact",
        lazy: () =>
          import("@/features/content/ui/ContactPage").then((m) => ({
            Component: m.ContactPage,
          })),
      },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
