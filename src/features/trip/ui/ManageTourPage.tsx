import { useState, type FormEvent, type ReactNode } from "react";
import {
  ArrowRight,
  ImageIcon,
  Link2,
  Lock,
  OctagonX,
  Route,
  Settings2,
  Users,
} from "lucide-react";
import { Link, useParams } from "react-router";
import { InviteLinksPanel } from "@/features/invites/ui/InviteLinksPanel";
import { CreatorRequestsPanel } from "@/features/tours/ui/CreatorRequestsPanel";
import type { TourDetail } from "@/features/tours/api/tour-schemas";
import { useTourDetail } from "@/features/tours/hooks";
import { STATUS_META } from "@/features/tours/model/labels";
import { ApiError, errorMessage } from "@/shared/api/errors";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { toFaDigits, toLatinDigits } from "@/shared/lib/digits";
import { Badge } from "@/shared/ui/Badge";
import { Button, ButtonLink } from "@/shared/ui/Button";
import { TextArea, TextField } from "@/shared/ui/Field";
import { ImagePicker } from "@/shared/ui/ImagePicker";
import { Modal } from "@/shared/ui/Modal";
import { PageHeader } from "@/shared/ui/PageHeader";
import { ErrorState, ForbiddenState, PageLoader } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useCancelTour, useUpdateTour, useUploadCover } from "../hooks";
import { ItineraryEditor } from "./ItineraryEditor";

/**
 * Tour-leader workspace. Only the creator of *this* tour gets here; everyone else sees a forbidden
 * state, and the API answers 403 NOT_TOUR_LEADER to any write attempt regardless of the UI.
 */
export function ManageTourPage() {
  const { tourId = "" } = useParams();
  const { data: tour, isPending, isError, refetch } = useTourDetail(tourId);
  useDocumentTitle(tour ? `مدیریت ${tour.title}` : "مدیریت تور");

  if (isPending) return <PageLoader />;
  if (isError || !tour)
    return (
      <div className="mx-auto max-w-page px-4 py-16">
        <ErrorState
          text="دریافت تور ممکن نشد."
          onRetry={() => void refetch()}
        />
      </div>
    );
  if (!tour.viewer.isCreator) {
    return (
      <div className="mx-auto max-w-page px-4 py-16">
        <ForbiddenState text="فقط تورلیدرِ همین تور می‌تواند هزینه، برنامه و اطلاعات آن را تغییر دهد." />
      </div>
    );
  }
  const status = STATUS_META[tour.status];
  const editable = tour.viewer.canManage;
  const planKey = `${tour.changeLog.length}:${tour.itinerary.flatMap((d) => d.items.map((i) => i.id)).join(",")}`;

  return (
    <div className="pb-12">
      <PageHeader
        title={`مدیریت «${tour.title}»`}
        subtitle="فقط شما به‌عنوان تورلیدر این صفحه را می‌بینید. تغییرات برنامه در تاریخچه ثبت و به اعضا اطلاع داده می‌شود."
        crumbs={[
          { label: "خانه", to: "/" },
          { label: tour.title, to: `/tours/${tour.id}` },
          { label: "مدیریت" },
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge tone={status.tone} className="bg-white/90">
              {status.label}
            </Badge>
            <ButtonLink
              to={`/tours/${tour.id}`}
              variant="light"
              size="sm"
              icon={<ArrowRight className="size-4" />}
            >
              صفحه تور
            </ButtonLink>
          </div>
        }
      />
      <div className="relative z-[1] mx-auto -mt-12 max-w-5xl space-y-6 px-4 sm:px-6">
        {!editable && (
          <p className="rounded-2xl border border-line bg-surface p-4 text-sm text-ink-muted shadow-card">
            این تور {status.label} است و دیگر قابل ویرایش نیست.
          </p>
        )}
        <Section icon={<ImageIcon className="size-5" />} title="عکس کاور">
          <CoverSection tour={tour} disabled={!editable} />
        </Section>
        <Section
          icon={<Settings2 className="size-5" />}
          title="اطلاعات و هزینه تور"
        >
          <DetailsForm tour={tour} disabled={!editable} />
        </Section>
        <Section
          icon={<Route className="size-5" />}
          title="برنامه رسمی روزانه"
          id="plan"
        >
          {editable ? (
            <ItineraryEditor key={planKey} tour={tour} />
          ) : (
            <p className="text-sm text-ink-muted">برنامه قابل تغییر نیست.</p>
          )}
        </Section>
        <Section icon={<Users className="size-5" />} title="اعضا و درخواست‌ها">
          <p className="mb-4 text-xs text-ink-muted">
            {toFaDigits(tour.confirmedCount)} از {toFaDigits(tour.capacity)} نفر
            · حد نصاب {toFaDigits(tour.minParticipants)} نفر. هزینه‌ها، رأی‌گیری
            و چک‌لیست را از
            <Link
              to={`/tours/${tour.id}?tab=expenses`}
              className="mx-1 font-bold text-coral-500"
            >
              صفحه تور
            </Link>
            مدیریت کنید.
          </p>
          <CreatorRequestsPanel tourId={tour.id} />
        </Section>
        <Section icon={<Link2 className="size-5" />} title="لینک‌های دعوت">
          <InviteLinksPanel tourId={tour.id} disabled={!editable} />
        </Section>
        {editable && <DangerZone tour={tour} />}
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
  id,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="scroll-mt-24 rounded-panel border border-line bg-surface p-5 shadow-card sm:p-7"
      aria-label={title}
    >
      <h2 className="mb-5 flex items-center gap-2 text-lg font-black">
        <span className="text-forest-600 dark:text-forest-300">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function CoverSection({
  tour,
  disabled,
}: {
  tour: TourDetail;
  disabled: boolean;
}) {
  const upload = useUploadCover(tour.id);
  const toast = useToast();
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <img
        src={tour.coverImageUrl}
        alt="کاور فعلی"
        className="aspect-[16/10] w-full rounded-2xl object-cover"
      />
      <ImagePicker
        disabled={disabled || upload.isPending}
        label="انتخاب عکس جدید برای کاور"
        maxSize={1920}
        onPick={([img]) =>
          img &&
          upload.mutate(img.blob, {
            onSuccess: () => toast.success("عکس کاور به‌روزرسانی شد."),
            onError: (e) => toast.error(errorMessage(e)),
            onSettled: () => URL.revokeObjectURL(img.previewUrl),
          })
        }
      />
    </div>
  );
}

function DetailsForm({
  tour,
  disabled,
}: {
  tour: TourDetail;
  disabled: boolean;
}) {
  const update = useUpdateTour(tour.id);
  const toast = useToast();
  const published = tour.status === "open" || tour.status === "confirmed";
  const [form, setForm] = useState({
    title: tour.title,
    description: tour.description,
    price: String(tour.priceToman),
    capacity: String(tour.capacity),
    minParticipants: String(tour.minParticipants),
    meetingPoint: tour.meetingPoint ?? "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const num = (v: string) =>
    Number(toLatinDigits(v).replace(/[^\d]/g, "")) || 0;
  const set = (k: keyof typeof form) => (e: { target: { value: string } }) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));
  const lockHint = published ? "پس از انتشار قفل است" : undefined;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const local: Record<string, string> = {};
    if (form.title.trim().length < 5) local.title = "عنوان حداقل ۵ حرف.";
    if (form.description.trim().length < 20)
      local.description = "توضیحات حداقل ۲۰ حرف.";
    if (num(form.capacity) < 2) local.capacity = "ظرفیت معتبر نیست.";
    if (published && num(form.capacity) < tour.capacity)
      local.capacity = "پس از انتشار فقط افزایش ظرفیت مجاز است.";
    if (num(form.minParticipants) > num(form.capacity))
      local.minParticipants = "از ظرفیت بیشتر است.";
    setErrors(local);
    if (Object.keys(local).length) return;
    update.mutate(
      published
        ? {
            description: form.description.trim(),
            capacity: num(form.capacity),
            meetingPoint: form.meetingPoint.trim() || null,
          }
        : {
            title: form.title.trim(),
            description: form.description.trim(),
            priceToman: num(form.price),
            capacity: num(form.capacity),
            minParticipants: num(form.minParticipants),
            meetingPoint: form.meetingPoint.trim() || null,
          },
      {
        onSuccess: () => toast.success("تغییرات ذخیره شد."),
        onError: (err) => {
          if (err instanceof ApiError) setErrors(err.fieldErrors);
          toast.error(errorMessage(err));
        },
      },
    );
  };

  return (
    <form onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
      {published && (
        <p className="flex items-start gap-2 rounded-2xl bg-tint-butter p-3 text-xs leading-6 text-ink-muted sm:col-span-2">
          <Lock
            className="mt-0.5 size-4 shrink-0 text-warning"
            aria-hidden="true"
          />
          طبق قوانین همسفر، بعد از تأیید تور فقط توضیحات، محل حرکت، برنامه
          روزانه و افزایش ظرفیت قابل تغییر است. هزینه‌های واقعی سفر را در بخش
          «هزینه‌ها» ثبت کنید.
        </p>
      )}
      <TextField
        wrapperClassName="sm:col-span-2"
        label="عنوان"
        value={form.title}
        onChange={set("title")}
        error={errors.title}
        disabled={disabled || published}
        hint={lockHint}
      />
      <TextField
        label="هزینه هر نفر (تومان)"
        inputMode="numeric"
        value={num(form.price).toLocaleString("fa-IR")}
        onChange={set("price")}
        disabled={disabled || published}
        hint={lockHint ?? "فقط تورلیدر می‌تواند هزینه را تغییر دهد."}
        error={errors.priceToman}
      />
      <TextField
        label="محل حرکت"
        value={form.meetingPoint}
        onChange={set("meetingPoint")}
        disabled={disabled}
      />
      <TextField
        label="ظرفیت"
        inputMode="numeric"
        value={toFaDigits(form.capacity)}
        onChange={set("capacity")}
        error={errors.capacity}
        disabled={disabled}
        hint={published ? `حداقل ${toFaDigits(tour.capacity)} نفر` : undefined}
      />
      <TextField
        label="حد نصاب"
        inputMode="numeric"
        value={toFaDigits(form.minParticipants)}
        onChange={set("minParticipants")}
        error={errors.minParticipants}
        disabled={disabled || published}
        hint={lockHint}
      />
      <div className="sm:col-span-2">
        <TextArea
          label="توضیحات"
          value={form.description}
          onChange={set("description")}
          error={errors.description}
          disabled={disabled}
          maxLength={2000}
        />
      </div>
      <div className="sm:col-span-2">
        <Button type="submit" loading={update.isPending} disabled={disabled}>
          ذخیره تغییرات
        </Button>
      </div>
    </form>
  );
}

function DangerZone({ tour }: { tour: TourDetail }) {
  const cancel = useCancelTour(tour.id);
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <section
      className="rounded-panel border-2 border-danger/30 bg-surface p-5 sm:p-7"
      aria-label="لغو تور"
    >
      <h2 className="flex items-center gap-2 text-lg font-black text-danger">
        <OctagonX className="size-5" aria-hidden="true" />
        لغو تور
      </h2>
      <p className="mt-2 text-sm leading-7 text-ink-muted">
        لغو فقط پیش از شروع سفر ممکن است. به همه اعضا اطلاع داده می‌شود و
        پرداخت‌ها «بازگشت داده‌شده» می‌شوند.
      </p>
      <Button variant="danger" className="mt-4" onClick={() => setOpen(true)}>
        لغو این تور
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="لغو تور؟"
        description="این کار قابل بازگشت نیست."
        size="sm"
        dismissible={!cancel.isPending}
      >
        <TextArea
          label="دلیل لغو (برای اعضا نمایش داده می‌شود)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          maxLength={300}
          data-autofocus
        />
        <div className="mt-6 flex justify-end gap-3">
          <Button
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={cancel.isPending}
          >
            منصرف شدم
          </Button>
          <Button
            variant="danger"
            loading={cancel.isPending}
            onClick={() =>
              cancel.mutate(reason.trim(), {
                onSuccess: () => {
                  setOpen(false);
                  toast.success("تور لغو شد و به اعضا اطلاع داده شد.");
                },
                onError: (e) => toast.error(errorMessage(e)),
              })
            }
          >
            بله، لغو شود
          </Button>
        </div>
      </Modal>
    </section>
  );
}
