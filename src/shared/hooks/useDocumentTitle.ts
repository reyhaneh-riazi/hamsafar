import { useEffect } from "react";

export function useDocumentTitle(title: string) {
  useEffect(() => {
    const previous = document.title;
    document.title = title
      ? `${title} | همسفر`
      : "همسفر | سفر بعدی‌ات از اینجا شروع می‌شه";
    return () => {
      document.title = previous;
    };
  }, [title]);
}
