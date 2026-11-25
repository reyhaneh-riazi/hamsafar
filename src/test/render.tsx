import type { ReactElement } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { ThemeProvider } from "@/shared/theme/ThemeProvider";
import { ToastProvider } from "@/shared/ui/Toast";

/** Renders a route element with the real providers and the MSW-backed mock API. */
export function renderRoute(
  element: ReactElement,
  { path = "/", url = "/" }: { path?: string; url?: string } = {},
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const router = createMemoryRouter(
    [
      { path, element },
      { path: "*", element: <p>navigated</p> },
    ],
    { initialEntries: [url] },
  );
  const utils = render(
    <ThemeProvider>
      <QueryClientProvider client={client}>
        <ToastProvider>
          <RouterProvider router={router} />
        </ToastProvider>
      </QueryClientProvider>
    </ThemeProvider>,
  );
  return { ...utils, router, client };
}
