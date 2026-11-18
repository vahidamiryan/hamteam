"use client";

import * as React from "react";
import Image from "next/image";
import { DownloadIcon, Maximize2Icon, XIcon } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { splitMentions } from "@/lib/mentions";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

/** پسوند فایل را از نوع Data URL حدس می‌زند تا هنگام دانلود، نام فایل کامل باشد. */
function downloadName(src: string, index: number): string {
  const extension = /^data:image\/([a-z0-9.+-]+);/i.exec(src)?.[1] ?? "png";
  return `attachment-${index + 1}.${extension}`;
}

/**
 * متن گفتگو با برجسته‌سازی منشن‌ها.
 * منشن خودِ کاربر با رنگ «در انتظار» نشان داده می‌شود؛ بقیه فقط کمی پررنگ‌ترند.
 */
export function CommentText({
  text,
  members,
  currentUser,
  isMine,
}: {
  text: string;
  members: Member[];
  currentUser: Member | null;
  isMine?: boolean;
}) {
  const parts = React.useMemo(() => splitMentions(text, members), [text, members]);
  if (!text.trim()) return null;

  return (
    <p
      className={cn(
        "text-start text-sm leading-6 break-words whitespace-pre-wrap [unicode-bidi:plaintext]",
        isMine ? "text-foreground" : "text-secondary-foreground",
      )}
    >
      {parts.map((part, index) => {
        const { member } = part;
        if (!member) return <React.Fragment key={index}>{part.text}</React.Fragment>;
        const isMe = currentUser?.id === member.id;
        return (
          <span
            key={index}
            title={member.role ?? member.email ?? undefined}
            className={cn(
              "rounded-sm px-0.5 font-medium",
              isMe
                ? "bg-status-pending/12 text-status-pending"
                : "bg-muted text-foreground",
            )}
          >
            {part.text}
          </span>
        );
      })}
    </p>
  );
}

/** تصاویر پیوست یک کامنت با نمایشگر تمام‌صفحه. */
export function CommentImages({ attachments }: { attachments?: string[] }) {
  const { t } = useLocale();
  const [activeIndex, setActiveIndex] = React.useState<number | null>(null);

  if (!attachments || attachments.length === 0) return null;

  const active = activeIndex === null ? null : attachments[activeIndex];

  return (
    <>
      <ul className="flex flex-wrap gap-2 pt-1">
        {attachments.map((src, index) => (
          <li key={src.slice(0, 32) + index}>
            <button
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={t("comment.openImage", { index: index + 1 })}
              className="group relative block size-20 overflow-hidden rounded-md border transition-colors hover:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Image
                src={src}
                alt={t("comment.imageAlt", { index: index + 1 })}
                fill
                unoptimized
                sizes="80px"
                className="object-cover"
              />
              <span className="absolute inset-0 flex items-center justify-center bg-foreground/40 text-background opacity-0 transition-opacity group-hover:opacity-100">
                <Maximize2Icon className="size-4" aria-hidden="true" />
              </span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={active !== null}
        onOpenChange={(open) => {
          if (!open) setActiveIndex(null);
        }}
      >
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="text-sm font-medium">{t("comment.image")}</DialogTitle>
            <DialogDescription className="sr-only">
              {t("comment.imageDescription")}
            </DialogDescription>
          </DialogHeader>

          {active ? (
            <div className="relative h-[60vh] w-full overflow-hidden rounded-md border bg-muted">
              <Image
                src={active}
                alt={t("comment.imageAlt", { index: (activeIndex ?? 0) + 1 })}
                fill
                unoptimized
                sizes="(max-width: 768px) 100vw, 720px"
                className="object-contain"
              />
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="ghost" onClick={() => setActiveIndex(null)} className="gap-1.5">
              <XIcon data-icon="inline-start" />
              {t("action.close")}
            </Button>
            {active ? (
              <Button
                nativeButton={false}
                render={
                  <a
                    href={active}
                    download={downloadName(active, activeIndex ?? 0)}
                    className="gap-1.5"
                  />
                }
              >
                <DownloadIcon data-icon="inline-start" />
                {t("comment.download")}
              </Button>
            ) : null}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
