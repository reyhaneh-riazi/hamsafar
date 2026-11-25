import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  hasError: boolean;
}

/** Last-resort boundary for render errors. Error reporting (Sentry or similar) plugs in here. */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV)
      console.error("[ui] render error", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-canvas p-6 text-center text-ink">
        <h1 className="text-2xl font-black">متأسفیم، مشکلی پیش آمد</h1>
        <p className="max-w-md text-sm leading-7 text-ink-muted">
          صفحه با خطا روبه‌رو شد. لطفاً صفحه را دوباره بارگذاری کنید.
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="h-11 rounded-xl bg-coral-500 px-6 text-sm font-bold text-white hover:bg-coral-600"
        >
          بارگذاری دوباره
        </button>
      </div>
    );
  }
}
