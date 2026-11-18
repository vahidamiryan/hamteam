"use client";

import * as React from "react";
import { DownloadIcon, Maximize2Icon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { Comment, Member } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * متن کامنت را تحلیل کرده و نام‌های منشن‌شده را به‌صورت چیپ رنگی نمایش می‌دهد.
 */
export function FormattedCommentBody({
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
  // تقسیم متن بر اساس الگوهای منشن مثل @نام یا @name
  const parts = React.useMemo(() => {
    if (!text) return [];
    // رگولار اکسپرشن برای تطبیق @کلمه
    const regex = /(@[\w\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]+)/g;
    return text.split(regex);
  }, [text]);

  // بررسی می‌کند آیا بخش مورد نظر با یکی از اعضای تیم تطابق دارد
  const getMentionedMember = (part: string): Member | null => {
    if (!part.startsWith("@")) return null;
    const nameWithoutAt = part.slice(1).trim().toLowerCase();
    return (
      members.find(
        (m) =>
          m.name.trim().toLowerCase() === nameWithoutAt ||
          m.nameEn?.trim().toLowerCase() === nameWithoutAt,
      ) ?? null
    );
  };

  return (
    <p
      className={cn(
        "mt-0.5 text-start text-sm leading-6 break-words whitespace-pre-wrap [unicode-bidi:plaintext]",
        isMine ? "text-foreground" : "text-secondary-foreground",
      )}
    >
      {parts.map((part, index) => {
        const mentioned = getMentionedMember(part);
        if (!mentioned) {
          return <span key={index}>{part}</span>;
        }

        const isMe = currentUser && mentioned.id === currentUser.id;
        return (
          <span
            key={index}
            className={cn(
              "inline-flex items-center gap-1 mx-0.5 px-1.5 py-0.2 rounded-md text-xs font-medium transition-colors",
              isMe
                ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 ring-1 ring-amber-500/30 font-semibold"
                : "bg-primary/10 text-primary font-medium hover:bg-primary/15",
            )}
            title={mentioned.role || mentioned.email || undefined}
          >
            {part}
          </span>
        );
      })}
    </p>
  );
}

/**
 * گالری تصاویر پیوست‌شده به کامنت همراه با لایت‌باکس بزرگ‌نمایی.
 */
export function CommentAttachments({
  attachments,
}: {
  attachments?: string[];
}) {
  const [activeImage, setActiveImage] = React.useState<string | null>(null);

  if (!attachments || attachments.length === 0) return null;

  return (
    <>
      <div className="mt-2.5 grid grid-cols-2 gap-2 sm:grid-cols-3">
        {attachments.map((src, index) => (
          <div
            key={index}
            onClick={() => setActiveImage(src)}
            className="group relative aspect-video cursor-pointer overflow-hidden rounded-lg border bg-muted/30 transition hover:ring-2 hover:ring-primary/40"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={`پیوست ${index + 1}`}
              className="size-full object-cover transition-transform duration-200 group-hover:scale-105"
              loading="lazy"
            />
            <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 transition-opacity group-hover:opacity-100">
              <span className="flex size-7 items-center justify-center rounded-full bg-background/80 text-foreground shadow-sm">
                <Maximize2Icon className="size-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* مدال نمایش اندازه کامل تصویر */}
      <Dialog open={Boolean(activeImage)} onOpenChange={(open) => !open && setActiveImage(null)}>
        <DialogContent className="max-w-3xl overflow-hidden p-2 sm:rounded-2xl">
          <DialogTitle className="sr-only">مشاهده تصویر پیوست</DialogTitle>
          {activeImage ? (
            <div className="relative flex max-h-[80vh] flex-col items-center justify-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImage}
                alt="پیوست در اندازه کامل"
                className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
              />
              <div className="flex w-full items-center justify-end gap-2 pt-1 px-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1.5 text-xs"
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = activeImage;
                    link.download = `attachment-${Date.now()}.png`;
                    link.click();
                  }}
                >
                  <DownloadIcon className="size-3.5" />
                  <span>دانلود تصویر</span>
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="gap-1.5 text-xs"
                  onClick={() => setActiveImage(null)}
                >
                  <XIcon className="size-3.5" />
                  <span>بستن</span>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
