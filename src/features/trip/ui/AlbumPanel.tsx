import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  Eye,
  Images,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { createPortal } from "react-dom";
import { errorMessage } from "@/shared/api/errors";
import { toFaDigits } from "@/shared/lib/digits";
import { formatDateTime } from "@/shared/lib/format";
import { Avatar } from "@/shared/ui/Avatar";
import { Button } from "@/shared/ui/Button";
import { formatBytes } from "@/shared/lib/image";
import { cn } from "@/shared/lib/cn";
import { ImagePicker, type PickedImage } from "@/shared/ui/ImagePicker";
import { RequestFeedback } from "@/shared/ui/RequestFeedback";
import { Spinner } from "@/shared/ui/Spinner";
import { EmptyState, ErrorState, Skeleton } from "@/shared/ui/StateViews";
import { useToast } from "@/shared/ui/Toast";
import { useDeletePhoto, usePhotos, useUploadPhoto } from "../hooks";

/** Tour photo album (FS 12): members upload from phone (gallery/camera) or computer, max 20 each. */
export function AlbumPanel({ tourId }: { tourId: string }) {
  const { data, isPending, isError, error, refetch } = usePhotos(tourId);
  const upload = useUploadPhoto(tourId);
  const remove = useDeletePhoto(tourId);
  const toast = useToast();
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [viewer, setViewer] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState<number | null>(null);
  const [lastRun, setLastRun] = useState<{ ok: number; failed: number } | null>(
    null,
  );

  const queueRef = useRef(queue);
  queueRef.current = queue;
  // Free preview object URLs when leaving the album.
  useEffect(
    () => () =>
      queueRef.current.forEach((q) => URL.revokeObjectURL(q.previewUrl)),
    [],
  );

  if (isPending) return <AlbumSkeleton />;
  if (isError || !data)
    return (
      <ErrorState
        error={error}
        text="دریافت آلبوم ممکن نشد."
        onRetry={() => void refetch()}
      />
    );
  const remaining = Math.max(0, data.limitPerMember - data.myCount);
  const uploading = queue.some((q) => q.status === "uploading");
  const pending = queue.filter(
    (q) => q.status === "ready" || q.status === "error",
  );
  const patch = (key: string, p: Partial<QueueItem>) =>
    setQueue((list) => list.map((x) => (x.key === key ? { ...x, ...p } : x)));
  const drop = (key: string) =>
    setQueue((list) => {
      const item = list.find((x) => x.key === key);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return list.filter((x) => x.key !== key);
    });

  /** Uploads one by one so each photo gets its own loading / success / error state. */
  const uploadAll = async () => {
    let ok = 0;
    let failed = 0;
    setLastRun(null);
    for (const item of pending) {
      patch(item.key, { status: "uploading", error: undefined });
      try {
        await upload.mutateAsync({
          file: item.blob,
          caption: item.caption.trim(),
        });
        ok += 1;
        drop(item.key);
      } catch (e) {
        failed += 1;
        patch(item.key, { status: "error", error: errorMessage(e) });
      }
    }
    setLastRun({ ok, failed });
    if (ok) toast.success(`${toFaDigits(ok)} عکس به آلبوم اضافه شد.`);
    if (failed)
      toast.error(
        `${toFaDigits(failed)} عکس بارگذاری نشد؛ می‌توانید دوباره تلاش کنید.`,
      );
  };

  return (
    <div className="space-y-6">
      {data.canUpload && (
        <section
          className="rounded-panel border border-line bg-surface p-5 sm:p-6"
          aria-labelledby="upload-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="upload-title" className="text-base font-black">
              افزودن عکس به آلبوم
            </h2>
            <span className="text-xs text-ink-muted">
              {toFaDigits(data.myCount)} از {toFaDigits(data.limitPerMember)}{" "}
              عکس شما
            </span>
          </div>
          {remaining - queue.length <= 0 && queue.length === 0 ? (
            <p className="mt-4 rounded-xl bg-surface-muted p-4 text-sm text-ink-muted">
              به سقف {toFaDigits(data.limitPerMember)} عکس برای هر عضو
              رسیده‌اید. برای افزودن، یکی از عکس‌های خودتان را حذف کنید.
            </p>
          ) : (
            <ImagePicker
              className="mt-4"
              multiple
              maxFiles={Math.max(1, remaining - queue.length)}
              disabled={remaining - queue.length <= 0 || uploading}
              label="انتخاب عکس‌های سفر"
              onPick={(imgs) => {
                setLastRun(null);
                setQueue((q) =>
                  [
                    ...q,
                    ...imgs.map((i) => ({
                      ...i,
                      key: i.previewUrl,
                      caption: "",
                      status: "ready" as const,
                    })),
                  ].slice(0, remaining),
                );
              }}
            />
          )}
          {queue.length > 0 && (
            <>
              <ul
                className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                aria-label="عکس‌های آماده بارگذاری"
              >
                {queue.map((q, i) => (
                  <QueueCard
                    key={q.key}
                    item={q}
                    index={i}
                    onPreview={() => setPreviewing(i)}
                    onRemove={() => drop(q.key)}
                    onCaption={(caption) => patch(q.key, { caption })}
                  />
                ))}
              </ul>
              <div className="mt-4 flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-xs text-ink-soft">
                  حجم کل پس از فشرده‌سازی:{" "}
                  {formatBytes(queue.reduce((s, q) => s + q.size, 0))}
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      queue.forEach((q) => URL.revokeObjectURL(q.previewUrl));
                      setQueue([]);
                    }}
                    disabled={uploading}
                  >
                    انصراف
                  </Button>
                  <Button
                    onClick={() => void uploadAll()}
                    loading={uploading}
                    disabled={pending.length === 0}
                    icon={<Upload className="size-4" />}
                  >
                    {queue.some((q) => q.status === "error")
                      ? "تلاش دوباره"
                      : `بارگذاری ${toFaDigits(pending.length)} عکس`}
                  </Button>
                </div>
              </div>
            </>
          )}
          {lastRun && lastRun.failed === 0 && lastRun.ok > 0 && (
            <RequestFeedback
              className="mt-4"
              status="success"
              successText={`${toFaDigits(lastRun.ok)} عکس با موفقیت بارگذاری شد.`}
            />
          )}
        </section>
      )}

      {data.items.length === 0 ? (
        <EmptyState
          icon={<Images className="size-7" />}
          title="آلبوم هنوز خالی است"
          text="اولین عکس سفر را شما بگذارید."
        />
      ) : (
        <ul className="columns-2 gap-3 sm:columns-3 lg:columns-4 [&>li]:mb-3">
          {data.items.map((p, i) => (
            <li
              key={p.id}
              className="group relative break-inside-avoid overflow-hidden rounded-2xl border border-line bg-surface"
            >
              <button
                type="button"
                onClick={() => setViewer(i)}
                className="block w-full"
                aria-label={p.caption || `عکس ${toFaDigits(i + 1)}`}
              >
                <img
                  src={p.url}
                  alt={p.caption}
                  loading="lazy"
                  className="w-full transition duration-500 group-hover:scale-[1.03]"
                />
              </button>
              <div className="flex items-center gap-2 p-2.5">
                <Avatar
                  name={p.uploader.displayName}
                  src={p.uploader.avatarUrl}
                  size="sm"
                />
                <div className="min-w-0 flex-1">
                  {p.caption && (
                    <p className="truncate text-xs font-bold">{p.caption}</p>
                  )}
                  <p className="truncate text-[10px] text-ink-soft">
                    {p.uploader.displayName}
                  </p>
                </div>
                {p.canDelete && (
                  <button
                    type="button"
                    aria-label="حذف عکس"
                    onClick={() =>
                      remove.mutate(p.id, {
                        onError: (e) => toast.error(errorMessage(e)),
                        onSuccess: () => toast.success("عکس حذف شد."),
                      })
                    }
                    className="inline-flex size-8 items-center justify-center rounded-lg text-danger opacity-70 hover:bg-danger/10 hover:opacity-100"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {viewer !== null && data.items[viewer] && (
        <Lightbox photos={data.items} index={viewer} onChange={setViewer} />
      )}
      {previewing !== null && queue[previewing] && (
        <Lightbox
          photos={queue.map((q) => ({
            url: q.previewUrl,
            caption: q.caption || q.name,
            meta: `پیش‌نمایش · ${formatBytes(q.size)} · ${toFaDigits(q.width)}×${toFaDigits(q.height)}`,
          }))}
          index={previewing}
          onChange={setPreviewing}
        />
      )}
    </div>
  );
}

type LightboxPhoto = { url: string; caption: string } & (
  { createdAt: string; uploader: { displayName: string } } | { meta: string }
);

function Lightbox({
  photos,
  index,
  onChange,
}: {
  photos: LightboxPhoto[];
  index: number;
  onChange: (i: number | null) => void;
}) {
  const photo = photos[index];
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onChange(null);
      if (e.key === "ArrowLeft")
        onChange(Math.min(photos.length - 1, index + 1));
      if (e.key === "ArrowRight") onChange(Math.max(0, index - 1));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [index, photos.length, onChange]);
  if (!photo) return null;
  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="نمایش عکس"
      className="fixed inset-0 z-modal flex animate-fade-in flex-col items-center justify-center bg-black/90 p-4"
      onClick={() => onChange(null)}
    >
      <img
        src={photo.url}
        alt={photo.caption}
        className="max-h-[80dvh] max-w-full rounded-xl object-contain"
        onClick={(e) => e.stopPropagation()}
      />
      <p className="mt-3 text-center text-sm text-white/85">
        {photo.caption && <span className="font-bold">{photo.caption} · </span>}
        {"meta" in photo
          ? photo.meta
          : `${photo.uploader.displayName} · ${formatDateTime(photo.createdAt)}`}
      </p>
      <button
        type="button"
        aria-label="بستن"
        className="absolute end-4 top-4 rounded-full bg-white/10 p-2 text-white"
        onClick={() => onChange(null)}
      >
        <X className="size-6" />
      </button>
      {index > 0 && (
        <button
          type="button"
          aria-label="عکس قبلی"
          className="absolute end-4 top-1/2 rounded-full bg-white/10 p-2 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index - 1);
          }}
        >
          <ChevronRight className="size-6" />
        </button>
      )}
      {index < photos.length - 1 && (
        <button
          type="button"
          aria-label="عکس بعدی"
          className="absolute start-4 top-1/2 rounded-full bg-white/10 p-2 text-white"
          onClick={(e) => {
            e.stopPropagation();
            onChange(index + 1);
          }}
        >
          <ChevronLeft className="size-6" />
        </button>
      )}
    </div>,
    document.body,
  );
}

type QueueItem = PickedImage & {
  key: string;
  caption: string;
  status: "ready" | "uploading" | "error";
  error?: string;
};

/** One selected photo before upload: preview, size/dimensions, caption and its request state. */
function QueueCard({
  item,
  index,
  onPreview,
  onRemove,
  onCaption,
}: {
  item: QueueItem;
  index: number;
  onPreview: () => void;
  onRemove: () => void;
  onCaption: (v: string) => void;
}) {
  const busy = item.status === "uploading";
  return (
    <li
      className={cn(
        "overflow-hidden rounded-2xl border bg-surface",
        item.status === "error" ? "border-danger" : "border-line",
      )}
    >
      <div className="relative">
        <button
          type="button"
          onClick={onPreview}
          className="group block w-full"
          aria-label={`پیش‌نمایش ${item.name}`}
        >
          <img
            src={item.previewUrl}
            alt=""
            className={cn(
              "aspect-[4/3] w-full object-cover transition",
              busy && "opacity-60",
            )}
          />
          <span className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition group-hover:bg-black/25 group-hover:opacity-100">
            <Eye className="size-6 text-white" aria-hidden="true" />
          </span>
        </button>
        {busy && (
          <span
            className="absolute inset-0 flex items-center justify-center bg-black/30 text-white"
            role="status"
            aria-label="در حال بارگذاری"
          >
            <Spinner className="size-7" />
          </span>
        )}
        {!busy && (
          <button
            type="button"
            aria-label="حذف از صف"
            onClick={onRemove}
            className="absolute end-2 top-2 inline-flex size-8 items-center justify-center rounded-full bg-black/45 text-white backdrop-blur"
          >
            <X className="size-4" />
          </button>
        )}
        <span className="absolute bottom-2 start-2 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur">
          {formatBytes(item.size)} · {toFaDigits(item.width)}×
          {toFaDigits(item.height)}
        </span>
      </div>
      <input
        value={item.caption}
        onChange={(e) => onCaption(e.target.value)}
        disabled={busy}
        maxLength={140}
        placeholder="زیرنویس (اختیاری)"
        aria-label={`زیرنویس عکس ${toFaDigits(index + 1)}`}
        className="h-11 w-full border-t border-line bg-surface px-3 text-sm outline-none"
      />
      {item.status === "error" && (
        <p
          role="alert"
          className="flex items-start gap-1.5 border-t border-danger/30 bg-danger/5 px-3 py-2 text-[11px] text-danger"
        >
          <CircleAlert
            className="mt-0.5 size-3.5 shrink-0"
            aria-hidden="true"
          />
          {item.error ?? "بارگذاری نشد."}
        </p>
      )}
    </li>
  );
}

function AlbumSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="در حال بارگذاری آلبوم">
      <Skeleton className="h-48" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className={i % 3 === 0 ? "h-56" : "h-40"} />
        ))}
      </div>
    </div>
  );
}
