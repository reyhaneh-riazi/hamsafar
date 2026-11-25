import type { ReactNode } from "react";
import { EmptyState, ErrorState, Skeleton } from "./StateViews";

interface QueryLike<T> {
  data: T | undefined;
  isPending: boolean;
  isError: boolean;
  error: unknown;
  refetch: () => unknown;
}

interface QueryStateProps<T> {
  query: QueryLike<T>;
  /** Shown while the first response is loading (defaults to a block skeleton). */
  loading?: ReactNode;
  /** Returns true when the loaded data has nothing to show. */
  isEmpty?: (data: T) => boolean;
  empty?: ReactNode;
  errorText?: string;
  children: (data: T) => ReactNode;
}

/**
 * One place for the loading → error → empty → success sequence of a server query, so every
 * screen handles all four states the same way (and none is forgotten).
 */
export function QueryState<T>({
  query,
  loading,
  isEmpty,
  empty,
  errorText,
  children,
}: QueryStateProps<T>) {
  if (query.isPending) {
    return (
      <div role="status" aria-label="در حال بارگذاری">
        {loading ?? <Skeleton className="h-32" />}
      </div>
    );
  }
  if (query.isError || query.data === undefined) {
    return (
      <ErrorState
        error={query.error}
        text={errorText}
        onRetry={() => void query.refetch()}
      />
    );
  }
  if (isEmpty?.(query.data))
    return <>{empty ?? <EmptyState title="موردی برای نمایش نیست" />}</>;
  return <>{children(query.data)}</>;
}
