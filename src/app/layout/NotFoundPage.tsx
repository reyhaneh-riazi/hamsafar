import { Compass } from "lucide-react";
import { ButtonLink } from "@/shared/ui/Button";
import { Container } from "@/shared/ui/Container";
import { Foliage } from "@/shared/ui/Foliage";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function NotFoundPage() {
  useDocumentTitle("صفحه پیدا نشد");
  return (
    <Container className="relative py-24 text-center">
      <Foliage
        variant="sprig-b"
        className="absolute -top-2 end-6 w-32 opacity-90"
      />
      <Compass className="mx-auto size-14 text-brand" aria-hidden="true" />
      <p className="mt-6 text-6xl font-black text-forest-800 dark:text-white">
        ۴۰۴
      </p>
      <h1 className="mt-3 text-xl font-black">مسیر اشتباه رفتیم!</h1>
      <p className="mt-2 text-sm text-ink-muted">
        صفحه‌ای که دنبالش بودی پیدا نشد.
      </p>
      <ButtonLink to="/" className="mt-8">
        بازگشت به خانه
      </ButtonLink>
    </Container>
  );
}
