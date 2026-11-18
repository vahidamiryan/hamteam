/** سقف تعداد و حجم پیوست‌ها؛ هم در فرم و هم در اعتبارسنجی سرور استفاده می‌شود. */
export const MAX_ATTACHMENTS = 6;
/** حداکثر طول هر Data URL (تقریباً ۹۰۰ کیلوبایت) تا سند فضای کاری سبک بماند. */
export const MAX_ATTACHMENT_CHARS = 1_200_000;

export type ImageErrorCode = "not-image" | "read-failed" | "load-failed" | "too-large";

export class ImageError extends Error {
  readonly code: ImageErrorCode;

  constructor(code: ImageErrorCode) {
    super(code);
    this.name = "ImageError";
    this.code = code;
  }
}

/** پیوست‌ها یا Data URL تصویرند یا لینک http(s). */
export function isAttachmentSource(value: string): boolean {
  return (
    /^data:image\/[a-z0-9.+-]+;base64,/i.test(value) || /^https?:\/\//i.test(value)
  );
}

/**
 * تصویر انتخاب‌شده را به Data URL سبک‌تر (WebP و در صورت نبود، JPEG) تبدیل می‌کند
 * تا بدون فضای ذخیره‌سازی بیرونی در سند فضای کاری و همگام‌سازی بلادرنگ جا شود.
 */
export async function compressImageFile(
  file: File,
  options: { maxSize?: number; quality?: number } = {},
): Promise<string> {
  const { maxSize = 1000, quality = 0.78 } = options;

  if (!file.type.startsWith("image/")) throw new ImageError("not-image");

  const source = await readAsDataUrl(file);

  // گیف‌های سبک دست‌نخورده می‌مانند تا انیمیشنشان از دست نرود.
  if (file.type === "image/gif" && file.size < 400 * 1024) return assertSize(source);

  const image = await loadImage(source);
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth, image.naturalHeight));
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) return assertSize(source);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(image, 0, 0, width, height);

  const webp = canvas.toDataURL("image/webp", quality);
  if (webp.startsWith("data:image/webp")) return assertSize(webp);

  return assertSize(canvas.toDataURL("image/jpeg", quality));
}

function assertSize(dataUrl: string): string {
  if (dataUrl.length > MAX_ATTACHMENT_CHARS) throw new ImageError("too-large");
  return dataUrl;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new ImageError("read-failed"));
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === "string") resolve(result);
      else reject(new ImageError("read-failed"));
    };
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onerror = () => reject(new ImageError("load-failed"));
    image.onload = () => resolve(image);
    image.src = src;
  });
}
