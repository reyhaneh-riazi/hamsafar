import { CalendarDays, LogIn, MapPin, UsersRound } from "lucide-react";
import { Link, useParams } from "react-router";
import { useSession } from "@/features/auth/hooks";
import {
  formatDateRange,
  formatDateTime,
  formatToman,
} from "@/shared/lib/format";
import { ApiError } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits } from "@/shared/lib/digits";
import { Avatar } from "@/shared/ui/Avatar";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { Container } from "@/shared/ui/Container";
import { mutationStatus, RequestFeedback } from "@/shared/ui/RequestFeedback";
import { ErrorState, Skeleton } from "@/shared/ui/StateViews";
import type { Invite } from "../api/invite-schemas";
import { useAcceptInvite, useInvite } from "../hooks";
import { LinkStatusCard } from "./LinkStatusCard";

/** `/invite/:token` — a tour invite link with valid / expired / used / revoked / invalid states. */
export function InvitePage() {
  const { token = "" } = useParams();
  const invite = useInvite(token);
  useDocumentTitle("دعوت به سفر");

  return (
    <Container className="py-10 sm:py-16">
      <div className="mx-auto max-w-2xl">
        {invite.isPending ? (
          <InviteSkeleton />
        ) : invite.isError &&
          invite.error instanceof ApiError &&
          invite.error.status === 404 ? (
          <LinkStatusCard
            state="invalid"
            title="این لینک دعوت معتبر نیست"
            text="ممکن است لینک ناقص کپی شده باشد یا اصلاً وجود نداشته باشد. لینک را دوباره از تورلیدر بگیرید."
          >
            <div className="flex justify-center">
              <ButtonLink to="/tours" variant="outline">
                دیدن تورهای دیگر
              </ButtonLink>
            </div>
          </LinkStatusCard>
        ) : invite.isError || !invite.data ? (
          <ErrorState
            error={invite.error}
            text="بررسی لینک دعوت ممکن نشد."
            onRetry={() => void invite.refetch()}
          />
        ) : (
          <InviteView
            invite={invite.data}
            onRecheck={() => void invite.refetch()}
          />
        )}
      </div>
    </Container>
  );
}

function InviteView({
  invite,
  onRecheck,
}: {
  invite: Invite;
  onRecheck: () => void;
}) {
  const { user } = useSession();
  const accept = useAcceptInvite(invite.token);
  const leader = invite.invitedBy.displayName;
  const preview = <TourPreview invite={invite} />;
  const toTour = (
    <div className="mt-5 flex justify-center">
      <ButtonLink to={`/tours/${invite.tour.id}`} variant="outline">
        مشاهده صفحه تور
      </ButtonLink>
    </div>
  );

  // Right after accepting, the refetched link reads "used"; keep showing the success state instead.
  if (accept.data)
    return (
      <AcceptedView invite={invite} requestStatus={accept.data.requestStatus} />
    );

  if (invite.status === "expired") {
    return (
      <LinkStatusCard
        state="expired"
        title="این لینک دعوت منقضی شده است"
        text={
          <>
            اعتبار این لینک در{" "}
            <b className="text-ink">{formatDateTime(invite.expiresAt)}</b> به
            پایان رسیده است. برای پیوستن، از {leader} لینک تازه بخواهید یا از
            صفحه تور درخواست عضویت بدهید.
          </>
        }
      >
        {preview}
        {toTour}
      </LinkStatusCard>
    );
  }

  if (invite.status === "used") {
    return invite.usedByMe ? (
      <LinkStatusCard
        state="used"
        title="شما قبلاً با این لینک عضو شده‌اید"
        text={`این دعوت در ${formatDateTime(invite.usedAt ?? invite.createdAt)} توسط شما پذیرفته شد.`}
      >
        {preview}
        <div className="mt-5 flex justify-center">
          <ButtonLink to={`/tours/${invite.tour.id}`}>رفتن به تور</ButtonLink>
        </div>
      </LinkStatusCard>
    ) : (
      <LinkStatusCard
        state="used"
        title="این لینک قبلاً استفاده شده است"
        text={`هر لینک دعوت فقط یک بار قابل استفاده است و این لینک${invite.usedAt ? ` در ${formatDateTime(invite.usedAt)}` : ""} مصرف شده. اگر شما هم دعوت شده‌اید، از ${leader} لینک جداگانه بخواهید.`}
      >
        {preview}
        {toTour}
      </LinkStatusCard>
    );
  }

  if (invite.status === "revoked") {
    return (
      <LinkStatusCard
        state="revoked"
        title="این لینک غیرفعال شده است"
        text={`${leader} این لینک دعوت را غیرفعال کرده است. در صورت نیاز با تورلیدر هماهنگ کنید.`}
      >
        {preview}
        {toTour}
      </LinkStatusCard>
    );
  }

  // valid
  return (
    <LinkStatusCard
      state="valid"
      title={`${leader} شما را به این سفر دعوت کرده است`}
      text={`این لینک تا ${formatDateTime(invite.expiresAt)} معتبر است و فقط یک بار قابل استفاده است.`}
    >
      {preview}
      <div className="mt-5 space-y-3">
        <RequestFeedback
          status={mutationStatus(accept)}
          loadingText="در حال ثبت پذیرش دعوت..."
          successText="دعوت با موفقیت پذیرفته شد."
          error={accept.error}
          onRetry={() => accept.mutate()}
        />
        {accept.isError &&
          accept.error instanceof ApiError &&
          (accept.error.status === 409 || accept.error.status === 410) && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={onRecheck}>
                بررسی دوباره وضعیت لینک
              </Button>
            </div>
          )}
        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          {user ? (
            <Button
              onClick={() => accept.mutate()}
              loading={accept.isPending}
              disabled={accept.isPending}
            >
              پذیرش دعوت و پیوستن به سفر
            </Button>
          ) : (
            <ButtonLink
              to={`/auth?next=${encodeURIComponent(`/invite/${invite.token}`)}`}
              icon={<LogIn className="size-4" />}
            >
              ورود برای پذیرش دعوت
            </ButtonLink>
          )}
          <ButtonLink to={`/tours/${invite.tour.id}`} variant="ghost">
            اول جزئیات تور را ببینم
          </ButtonLink>
        </div>
      </div>
    </LinkStatusCard>
  );
}

function AcceptedView({
  invite,
  requestStatus,
}: {
  invite: Invite;
  requestStatus: "pending" | "approved";
}) {
  return (
    <LinkStatusCard
      state="valid"
      title="دعوت پذیرفته شد"
      text={
        requestStatus === "approved"
          ? "شما عضو این تور شدید. جزئیات، برنامه روزانه و گفت‌وگوی گروه در صفحه تور در دسترس است."
          : "درخواست عضویت شما ثبت شد و پس از تأیید تورلیدر عضو می‌شوید."
      }
    >
      <TourPreview invite={invite} />
      <RequestFeedback
        className="mt-5"
        status="success"
        successText="دعوت با موفقیت پذیرفته شد."
      />
      <div className="mt-5 flex justify-center">
        <ButtonLink to={`/tours/${invite.tour.id}`}>
          رفتن به صفحه تور
        </ButtonLink>
      </div>
    </LinkStatusCard>
  );
}

function TourPreview({ invite }: { invite: Invite }) {
  const t = invite.tour;
  return (
    <div className="flex flex-col gap-4 rounded-2xl bg-surface-muted p-3 sm:flex-row sm:items-center">
      <img
        src={t.coverImageUrl}
        alt=""
        className="h-32 w-full rounded-xl object-cover sm:h-24 sm:w-36"
      />
      <div className="min-w-0 flex-1 space-y-1.5 text-xs text-ink-muted">
        <Link
          to={`/tours/${t.id}`}
          className="block truncate text-sm font-black text-ink hover:text-coral-500"
        >
          {t.title}
        </Link>
        <p className="flex items-center gap-1.5">
          <MapPin className="size-4" aria-hidden="true" />
          {t.destination}، {t.province}
        </p>
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-4" aria-hidden="true" />
          {formatDateRange(t.startDate, t.endDate)}
        </p>
        <p className="flex items-center gap-1.5">
          <UsersRound className="size-4" aria-hidden="true" />
          {toFaDigits(t.confirmedCount)} از {toFaDigits(t.capacity)} نفر ·{" "}
          {formatToman(t.priceToman)} هر نفر
        </p>
      </div>
      <div className="flex items-center gap-2 sm:flex-col sm:items-end">
        <Avatar
          name={invite.invitedBy.displayName}
          src={invite.invitedBy.avatarUrl}
          size="sm"
        />
        <span className="text-[11px] text-ink-soft">
          تورلیدر: {invite.invitedBy.displayName}
        </span>
      </div>
    </div>
  );
}

function InviteSkeleton() {
  return (
    <div
      className="rounded-panel border border-line bg-surface p-8"
      role="status"
      aria-label="در حال بررسی لینک دعوت"
    >
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-16" />
        <Skeleton className="h-5 w-20 rounded-full" />
        <Skeleton className="h-6 w-64" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <Skeleton className="mt-6 h-28" />
    </div>
  );
}
