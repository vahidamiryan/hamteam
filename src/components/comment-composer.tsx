"use client";

import * as React from "react";
import Image from "next/image";
import { AtSignIcon, ImagePlusIcon, Loader2Icon, SendIcon, XIcon } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/components/ui/toast";
import {
  ImageError,
  MAX_ATTACHMENTS,
  compressImageFile,
  isAttachmentSource,
} from "@/lib/image-utils";
import { memberName } from "@/lib/locale-text";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

const MENTION_QUERY = /@([\w\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]*)$/;

/**
 * نوشتن کامنت: منشن با @، پیوست تصویر با کلیک/کشیدن/چسباندن.
 * فرم با `key` روی شناسهٔ تسک سوار می‌شود، پس نیازی به همگام‌سازی state با effect نیست.
 */
export function CommentComposer({
  currentUser,
  members,
  sendAs,
  onSend,
}: {
  currentUser: Member;
  members: readonly Member[];
  sendAs: string;
  onSend: (body: string, attachments: string[]) => Promise<boolean>;
}) {
  const { locale, t } = useLocale();
  const [draft, setDraft] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [dragging, setDragging] = React.useState(false);
  const [query, setQuery] = React.useState<string | null>(null);
  const [highlighted, setHighlighted] = React.useState(0);

  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const pendingCaret = React.useRef<number | null>(null);

  // بعد از درج منشن، مکان‌نما را سر جایش برمی‌گردانیم.
  React.useEffect(() => {
    const caret = pendingCaret.current;
    if (caret === null || !textareaRef.current) return;
    pendingCaret.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(caret, caret);
  }, [draft]);

  const candidates = React.useMemo(() => {
    if (query === null) return [];
    const needle = query.trim().toLowerCase();
    if (!needle) return members;
    return members.filter((member) =>
      [member.name, member.nameEn, member.role]
        .filter(Boolean)
        .some((value) => (value as string).toLowerCase().includes(needle)),
    );
  }, [members, query]);

  const syncMentionQuery = (value: string, caret: number) => {
    const match = value.slice(0, caret).match(MENTION_QUERY);
    setQuery(match ? match[1].toLowerCase() : null);
    setHighlighted(0);
  };

  const insertMention = (member: Member) => {
    const caret = textareaRef.current?.selectionStart ?? draft.length;
    const match = draft.slice(0, caret).match(MENTION_QUERY);
    if (!match) return;
    const name = locale === "en" && member.nameEn ? member.nameEn : member.name;
    const start = caret - match[0].length;
    const insertion = `@${name} `;
    setDraft(draft.slice(0, start) + insertion + draft.slice(caret));
    setQuery(null);
    pendingCaret.current = start + insertion.length;
  };

  const addFiles = async (files: File[]) => {
    const images = files.filter((file) => file.type.startsWith("image/"));
    if (images.length === 0) return;

    const room = MAX_ATTACHMENTS - attachments.length;
    if (room <= 0) {
      toast.add({ title: t("comment.attachmentsFull"), type: "warning" });
      return;
    }

    setBusy(true);
    try {
      const next = await Promise.all(images.slice(0, room).map((file) => compressImageFile(file)));
      setAttachments((current) => [...current, ...next].filter(isAttachmentSource));
    } catch (cause) {
      const tooLarge = cause instanceof ImageError && cause.code === "too-large";
      toast.add({
        title: t(tooLarge ? "comment.imageTooLarge" : "comment.imageError"),
        type: "error",
      });
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    const body = draft.trim();
    if (sending || busy) return;
    if (!body && attachments.length === 0) return;
    setSending(true);
    const ok = await onSend(body, attachments);
    setSending(false);
    if (ok) {
      setDraft("");
      setAttachments([]);
      setQuery(null);
    }
  };

  const hasContent = draft.trim().length > 0 || attachments.length > 0;

  return (
    <div
      onDragOver={(event) => {
        if (!event.dataTransfer.types.includes("Files")) return;
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        if (event.currentTarget.contains(event.relatedTarget as Node)) return;
        setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const files = Array.from(event.dataTransfer.files);
        if (files.length > 0) void addFiles(files);
      }}
      className={cn(
        "relative overflow-hidden rounded-lg border bg-card transition-colors focus-within:border-ring",
        dragging && "border-ring ring-2 ring-ring/20",
      )}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        onChange={(event) => {
          const files = Array.from(event.target.files ?? []);
          event.target.value = "";
          if (files.length > 0) void addFiles(files);
        }}
      />

      {query !== null && candidates.length > 0 ? (
        <div className="absolute inset-x-2 bottom-full z-50 mb-1 overflow-hidden rounded-md border bg-popover shadow-md">
          <p className="px-2.5 py-1.5 text-xs text-muted-foreground">{t("comment.mentionHint")}</p>
          <ul role="listbox" aria-label={t("comment.mention")}>
            {candidates.map((member, index) => (
              <li key={member.id}>
                <button
                  type="button"
                  role="option"
                  aria-selected={index === highlighted}
                  onMouseEnter={() => setHighlighted(index)}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => insertMention(member)}
                  className={cn(
                    "flex w-full items-center gap-2 px-2.5 py-1.5 text-start text-xs transition-colors",
                    index === highlighted ? "bg-muted" : "hover:bg-muted/60",
                  )}
                >
                  <MemberAvatar member={member} size="sm" />
                  <span className="truncate font-medium">{memberName(locale, member)}</span>
                  {member.role ? (
                    <span className="truncate text-muted-foreground">{member.role}</span>
                  ) : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-40 flex items-center justify-center bg-background/85 text-xs text-muted-foreground">
          {t("comment.dropImage")}
        </div>
      ) : null}

      <Textarea
        ref={textareaRef}
        value={draft}
        dir="auto"
        rows={2}
        maxLength={4000}
        placeholder={t("comment.placeholder")}
        aria-label={t("comment.placeholder")}
        onChange={(event) => {
          setDraft(event.target.value);
          syncMentionQuery(event.target.value, event.target.selectionStart ?? 0);
        }}
        onClick={(event) =>
          syncMentionQuery(draft, (event.target as HTMLTextAreaElement).selectionStart ?? 0)
        }
        onBlur={() => setQuery(null)}
        onPaste={(event) => {
          const files = Array.from(event.clipboardData.items)
            .filter((item) => item.kind === "file" && item.type.startsWith("image/"))
            .map((item) => item.getAsFile())
            .filter((file): file is File => file !== null);
          if (files.length === 0) return;
          event.preventDefault();
          void addFiles(files);
        }}
        onKeyDown={(event) => {
          if (query !== null && candidates.length > 0) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setHighlighted((index) => (index + 1) % candidates.length);
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setHighlighted((index) => (index - 1 + candidates.length) % candidates.length);
              return;
            }
            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              insertMention(candidates[highlighted]);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setQuery(null);
              return;
            }
          }

          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        className="min-h-16 resize-none rounded-none border-0 bg-transparent p-3 text-sm shadow-none focus-visible:ring-0"
      />

      {attachments.length > 0 || busy ? (
        <ul className="flex flex-wrap items-center gap-2 px-3 pb-2">
          {attachments.map((src) => (
            <li key={src.slice(-24)} className="group relative size-14">
              <Image
                src={src}
                alt={t("comment.attachment")}
                fill
                unoptimized
                sizes="56px"
                className="rounded-md border object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setAttachments((current) => current.filter((item) => item !== src))
                }
                aria-label={t("comment.removeImage")}
                title={t("comment.removeImage")}
                className="absolute -top-1.5 -end-1.5 flex size-5 items-center justify-center rounded-full bg-foreground text-background shadow-sm transition-colors hover:bg-destructive"
              >
                <XIcon className="size-3" aria-hidden="true" />
              </button>
            </li>
          ))}
          {busy ? (
            <li
              className="flex size-14 items-center justify-center rounded-md border border-dashed text-muted-foreground"
              aria-label={t("comment.processing")}
            >
              <Loader2Icon className="size-4 animate-spin" aria-hidden="true" />
            </li>
          ) : null}
        </ul>
      ) : null}

      <div className="flex items-center gap-1.5 border-t bg-muted/40 px-3 py-2">
        <MemberAvatar member={currentUser} size="sm" />
        <span className="truncate text-xs text-muted-foreground">{sendAs}</span>

        <div className="ms-auto flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => fileInputRef.current?.click()}
            aria-label={t("comment.attach")}
            title={t("comment.attach")}
            className="text-muted-foreground"
          >
            <ImagePlusIcon />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              setDraft((current) => (current.length === 0 ? "@" : `${current}@`));
              setQuery("");
              textareaRef.current?.focus();
            }}
            aria-label={t("comment.mention")}
            title={t("comment.mention")}
            className="text-muted-foreground"
          >
            <AtSignIcon />
          </Button>

          <span
            dir="ltr"
            className="ms-1 me-2 hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
          >
            <Kbd>Ctrl</Kbd>
            <span aria-hidden="true">+</span>
            <Kbd>Enter</Kbd>
          </span>

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => void submit()}
            disabled={sending || busy || !hasContent}
          >
            {t("action.send")}
            <SendIcon className="rtl:rotate-180" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
