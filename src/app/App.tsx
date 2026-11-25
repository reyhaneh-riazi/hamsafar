import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router/dom';
import { createQueryClient } from '@/shared/api/query-client';
import { ToastProvider } from '@/shared/ui/Toast';
import { ErrorBoundary } from './ErrorBoundary';
import { router } from './router';
import { ThemeProvider } from '@/shared/theme/ThemeProvider';

export function App() {
  const [queryClient] = useState(createQueryClient);
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <RouterProvider router={router} />
          </ToastProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
