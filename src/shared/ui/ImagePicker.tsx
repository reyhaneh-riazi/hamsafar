import {
  useEffect,
  useId,
  useRef,
  useState,
  type ClipboardEvent,
  type DragEvent,
  type ReactNode,
} from "react";
import { Camera, CircleAlert, ImagePlus, Upload, X } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { toFaDigits } from "@/shared/lib/digits";
import {
  DEFAULT_IMAGE_RULES,
  formatBytes,
  ImageError,
  prepareImage,
  type ImageRules,
} from "@/shared/lib/image";
import { Spinner } from "./Spinner";

export interface PickedImage {
  blob: Blob;
  previewUrl: string;
  name: string;
  /** Size of the original file and of the compressed upload, in bytes. */
  originalSize: number;
  size: number;
  width: number;
  height: number;
}

export interface RejectedImage {
  name: string;
  reason: string;
}

interface ImagePickerProps {
  /** Called with compressed images ready for upload. */
  onPick: (images: PickedImage[]) => void;
  multiple?: boolean;
  maxFiles?: number;
  disabled?: boolean;
  /** Longest edge after compression. */
  maxSize?: number;
  label?: string;
  hint?: string;
  className?: string;
  compact?: boolean;
  children?: ReactNode;
  /** Validation rules (size, minimum dimensions). */
  rules?: Partial<ImageRules>;
}

function useCoarsePointer() {
  const [coarse, setCoarse] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.("(pointer: coarse)");
    if (!mq) return;
    setCoarse(mq.matches);
    const on = (e: MediaQueryListEvent) => setCoarse(e.matches);
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return coarse;
}

/**
 * Image input that works everywhere:
 * - phones: «گالری» opens the photo library/files, «دوربین» opens the camera directly (capture);
 * - computers: click to browse, drag & drop, or paste an image with Ctrl/⌘+V.
 * Large photos are resized and re-encoded in the browser before upload.
 */
export function ImagePicker({
  onPick,
  multiple,
  maxFiles = 10,
  disabled,
  maxSize = 1600,
  label = "افزودن تصویر",
  hint,
  className,
  compact,
  children,
  rules,
}: ImagePickerProps) {
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [rejected, setRejected] = useState<RejectedImage[]>([]);
  const coarse = useCoarsePointer();
  const hintId = useId();
  const effectiveRules: ImageRules = { ...DEFAULT_IMAGE_RULES, ...rules };
  const limit = multiple ? maxFiles : 1;
  const rulesText = `JPG، PNG، WebP یا HEIC · حداکثر ${formatBytes(effectiveRules.maxBytes)} · حداقل ${toFaDigits(effectiveRules.minEdge)} پیکسل${multiple ? ` · تا ${toFaDigits(limit)} عکس` : ""}`;

  /** Validates every file separately: valid ones are passed on, invalid ones are listed with a reason. */
  const handle = async (list: FileList | File[] | null) => {
    const files = Array.from(list ?? []);
    if (!files.length) return;
    setBusy(true);
    const bad: RejectedImage[] = [];
    const picked: PickedImage[] = [];
    try {
      for (const [index, file] of files.entries()) {
        if (index >= limit) {
          bad.push({
            name: file.name,
            reason: `بیش از سقف ${toFaDigits(limit)} عکس است.`,
          });
          continue;
        }
        try {
          const img = await prepareImage(file, maxSize, effectiveRules);
          picked.push({
            blob: img.blob,
            previewUrl: URL.createObjectURL(img.blob),
            name: file.name,
            originalSize: file.size,
            size: img.blob.size,
            width: img.width,
            height: img.height,
          });
        } catch (e) {
          bad.push({
            name: file.name,
            reason:
              e instanceof ImageError ? e.message : "خواندن تصویر ممکن نشد.",
          });
        }
      }
      setRejected(bad);
      if (picked.length) onPick(picked);
    } finally {
      setBusy(false);
      if (galleryRef.current) galleryRef.current.value = "";
      if (cameraRef.current) cameraRef.current.value = "";
    }
  };

  const rejectedList = rejected.length > 0 && (
    <div
      role="alert"
      className="mt-2 rounded-xl border border-danger/30 bg-danger/5 p-3 text-xs"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 font-bold text-danger">
          <CircleAlert className="size-4" aria-hidden="true" />
          {toFaDigits(rejected.length)} فایل پذیرفته نشد
        </p>
        <button
          type="button"
          onClick={() => setRejected([])}
          aria-label="بستن پیام خطا"
          className="rounded p-0.5 text-ink-soft hover:text-ink"
        >
          <X className="size-3.5" />
        </button>
      </div>
      <ul className="mt-1.5 space-y-1 text-ink-muted">
        {rejected.map((r, i) => (
          <li key={`${r.name}-${i}`}>
            <span className="ltr-island font-bold text-ink">{r.name}</span>:{" "}
            {r.reason}
          </li>
        ))}
      </ul>
    </div>
  );

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (!disabled) void handle(e.dataTransfer.files);
  };
  const onPaste = (e: ClipboardEvent) => {
    if (disabled) return;
    const files = Array.from(e.clipboardData.files);
    if (files.length) {
      e.preventDefault();
      void handle(files);
    }
  };

  const inputs = (
    <>
      <input
        ref={galleryRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        multiple={multiple}
        hidden
        onChange={(e) => void handle(e.target.files)}
      />
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => void handle(e.target.files)}
      />
    </>
  );

  if (compact) {
    return (
      <div className={cn("inline-flex flex-col items-start gap-1", className)}>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-bold text-ink transition hover:bg-surface-muted disabled:opacity-50"
          >
            {busy ? (
              <Spinner className="size-4" />
            ) : (
              <ImagePlus className="size-4" aria-hidden="true" />
            )}
            {coarse ? "گالری" : label}
          </button>
          {coarse && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => cameraRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-xs font-bold text-ink transition hover:bg-surface-muted disabled:opacity-50"
            >
              <Camera className="size-4" aria-hidden="true" />
              دوربین
            </button>
          )}
          {children}
        </div>
        {rejectedList}
        {inputs}
      </div>
    );
  }

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-describedby={hintId}
        onClick={() => !disabled && !busy && galleryRef.current?.click()}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === " ") && !disabled) {
            e.preventDefault();
            galleryRef.current?.click();
          }
        }}
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onPaste={onPaste}
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-5 py-8 text-center transition",
          dragging
            ? "border-coral-400 bg-coral-50 dark:bg-coral-700/10"
            : "border-line bg-surface-muted/60 hover:border-forest-400",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <span className="flex size-12 items-center justify-center rounded-2xl bg-surface text-forest-700 shadow-sm dark:text-forest-200">
          {busy ? (
            <Spinner className="size-6" />
          ) : (
            <Upload className="size-6" aria-hidden="true" />
          )}
        </span>
        <span className="text-sm font-black text-ink">{label}</span>
        <span id={hintId} className="max-w-xs text-xs leading-6 text-ink-muted">
          {hint ??
            (coarse
              ? "از گالری گوشی انتخاب کنید یا با دوربین عکس بگیرید."
              : "کلیک کنید، فایل را اینجا رها کنید یا با Ctrl+V بچسبانید.")}
          <span className="mt-1 block text-[11px] text-ink-soft">
            {rulesText}
          </span>
        </span>
        <div
          className="flex flex-wrap justify-center gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={disabled || busy}
            onClick={() => galleryRef.current?.click()}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-forest-800 px-3.5 text-xs font-bold text-white transition hover:bg-forest-700 disabled:opacity-50 dark:bg-forest-600"
          >
            <ImagePlus className="size-4" aria-hidden="true" />
            {coarse ? "انتخاب از گالری" : "انتخاب از سیستم"}
          </button>
          {coarse && (
            <button
              type="button"
              disabled={disabled || busy}
              onClick={() => cameraRef.current?.click()}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-line bg-surface px-3.5 text-xs font-bold text-ink transition hover:bg-surface-muted disabled:opacity-50"
            >
              <Camera className="size-4" aria-hidden="true" />
              گرفتن عکس
            </button>
          )}
        </div>
      </div>
      {rejectedList}
      {inputs}
    </div>
  );
}
