import { isRouteErrorResponse, Link, useRouteError } from "react-router";

export function RouteError() {
  const error = useRouteError();
  const isChunkError =
    error instanceof Error &&
    /dynamically imported module|Loading chunk/i.test(error.message);
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-canvas p-6 text-center text-ink">
      <h1 className="text-2xl font-black">
        {isRouteErrorResponse(error) && error.status === 404
          ? "صفحه پیدا نشد"
          : "بارگذاری صفحه ممکن نشد"}
      </h1>
      <p className="max-w-md text-sm leading-7 text-ink-muted">
        {isChunkError
          ? "نسخه جدید سایت منتشر شده است؛ صفحه را دوباره بارگذاری کنید."
          : "لطفاً دوباره تلاش کنید."}
      </p>
      <div className="mt-2 flex gap-3">
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-xl bg-coral-500 px-6 text-sm font-bold text-white"
        >
          بارگذاری دوباره
        </button>
        <Link
          to="/"
          className="inline-flex h-11 items-center rounded-xl border border-line px-6 text-sm font-bold"
        >
          خانه
        </Link>
      </div>
    </div>
  );
}
