/**
 * Client-side image preparation before upload: validates the file, fixes huge camera photos by
 * downscaling to `maxSize` px and re-encoding to WebP/JPEG. Server-side validation still applies.
 */
import { toFaDigits } from "./digits";

export const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
];
const ACCEPTED_EXTENSIONS = /\.(jpe?g|png|webp|heic|heif)$/i;
export const MAX_INPUT_BYTES = 10 * 1024 * 1024;
/** Images smaller than this on their shortest side look broken in the album and covers. */
export const MIN_IMAGE_EDGE = 300;

export class ImageError extends Error {}

export interface ImageRules {
  maxBytes: number;
  minEdge: number;
}

export const DEFAULT_IMAGE_RULES: ImageRules = {
  maxBytes: MAX_INPUT_BYTES,
  minEdge: MIN_IMAGE_EDGE,
};

export function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024)
    return `${toFaDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  return `${toFaDigits(Math.max(1, Math.round(bytes / 1024)))} کیلوبایت`;
}

/** Type + size checks that need no decoding. Throws ImageError with a user-facing reason. */
export function validateImage(
  file: File,
  rules: ImageRules = DEFAULT_IMAGE_RULES,
): void {
  const typeOk =
    ACCEPTED_IMAGE_TYPES.includes(file.type) ||
    ACCEPTED_EXTENSIONS.test(file.name);
  if (!typeOk)
    throw new ImageError("فرمت مجاز نیست؛ فقط JPG، PNG، WebP یا HEIC.");
  if (file.size === 0) throw new ImageError("فایل خالی است.");
  if (file.size > rules.maxBytes)
    throw new ImageError(
      `حجم ${formatBytes(file.size)} است؛ حداکثر ${formatBytes(rules.maxBytes)} مجاز است.`,
    );
}

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  if ("createImageBitmap" in window) {
    try {
      return await createImageBitmap(file, {
        imageOrientation: "from-image",
      } as ImageBitmapOptions);
    } catch {
      /* fall through to <img> decoding (e.g. HEIC on Safari) */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await img.decode();
    return img;
  } catch {
    throw new ImageError(
      "این فرمت تصویر توسط مرورگر پشتیبانی نمی‌شود؛ JPG یا PNG انتخاب کنید.",
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

export interface PreparedImage {
  blob: Blob;
  /** Original dimensions, before downscaling. */
  width: number;
  height: number;
}

/** Validates, decodes and compresses one image (WebP when supported, JPEG otherwise). */
export async function prepareImage(
  file: File,
  maxSize = 1600,
  rules: ImageRules = DEFAULT_IMAGE_RULES,
  quality = 0.82,
): Promise<PreparedImage> {
  validateImage(file, rules);
  const source = await decode(file);
  const w = "naturalWidth" in source ? source.naturalWidth : source.width;
  const h = "naturalHeight" in source ? source.naturalHeight : source.height;
  if (Math.min(w, h) < rules.minEdge) {
    if ("close" in source) source.close();
    throw new ImageError(
      `ابعاد ${toFaDigits(w)}×${toFaDigits(h)} کوچک است؛ حداقل ${toFaDigits(rules.minEdge)} پیکسل لازم است.`,
    );
  }
  const scale = Math.min(1, maxSize / Math.max(w, h));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(w * scale);
  canvas.height = Math.round(h * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new ImageError("پردازش تصویر ممکن نشد.");
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  if ("close" in source) source.close();
  const toBlob = (type: string) =>
    new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, quality),
    );
  const blob = (await toBlob("image/webp")) ?? (await toBlob("image/jpeg"));
  if (!blob) throw new ImageError("پردازش تصویر ممکن نشد.");
  return { blob, width: w, height: h };
}

/** Returns only the compressed Blob (kept for callers that don't need dimensions). */
export async function compressImage(
  file: File,
  maxSize = 1600,
  quality = 0.82,
): Promise<Blob> {
  return (await prepareImage(file, maxSize, DEFAULT_IMAGE_RULES, quality)).blob;
}
