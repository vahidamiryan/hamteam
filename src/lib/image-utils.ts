/**
 * تبدیل و فشرده‌سازی تصویر انتخاب‌شده به Data URL استاندارد WebP/JPEG
 * برای نگهداری سبک در سند و هماهنگی بلادرنگ وب‌سوکت.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1200,
  maxHeight = 1200,
  quality = 0.82,
): Promise<string> {
  return new Promise((resolve, reject) => {
    // اگر فایل تصویر نبود رد شود
    if (!file.type.startsWith("image/")) {
      return reject(new Error("فایل انتخاب‌شده تصویر نیست."));
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error("خطا در خواندن فایل تصویر."));
    reader.onload = (event) => {
      const src = event.target?.result;
      if (typeof src !== "string") {
        return reject(new Error("خطا در دریافت محتوای تصویر."));
      }

      // گیف‌های متحرک یا فایل‌های خیلی کوچک دست‌نخورده باقی بمانند
      if (file.type === "image/gif" && file.size < 500 * 1024) {
        return resolve(src);
      }

      const img = new Image();
      img.onerror = () => reject(new Error("خطا در بارگذاری تصویر."));
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return resolve(src);
        }

        // تمیزکاری لبه‌ها
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // تلاش برای خروجی webp، در صورت عدم پشتیبانی jpeg
        try {
          const webp = canvas.toDataURL("image/webp", quality);
          if (webp.startsWith("data:image/webp")) {
            return resolve(webp);
          }
        } catch {}

        const jpeg = canvas.toDataURL("image/jpeg", quality);
        resolve(jpeg);
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  });
}
