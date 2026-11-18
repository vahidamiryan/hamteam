"use client";

import * as React from "react";
import {
  AlignLeftIcon,
  AtSignIcon,
  ImageIcon,
  Loader2Icon,
  MessageSquareIcon,
  PaperclipIcon,
  SendIcon,
  Trash2Icon,
  UserRoundIcon,
  XIcon,
} from "lucide-react";

import { CommentAttachments, FormattedCommentBody } from "@/components/comment-renderer";
import { DateField } from "@/components/date-field";
import { EditableText } from "@/components/editable-text";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import {
  AssigneePicker,
  GoalPicker,
  PriorityPicker,
  StatusPicker,
} from "@/components/pickers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useWorkspace } from "@/components/workspace-provider";
import { commentsForTask } from "@/lib/derived";
import { formatDateTime, formatRelative } from "@/lib/dates";
import { compressImageFile } from "@/lib/image-utils";
import {
  commentBody,
  goalTitle,
  memberName,
  taskBlocker,
  taskDescription,
  taskTitle,
} from "@/lib/locale-text";
import type { Member, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskSheet({
  taskId,
  onOpenChange,
  onSeen,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onSeen?: (taskId: string) => void;
}) {
  const { isRtl } = useLocale();
  const { workspace } = useWorkspace();
  const task = workspace?.tasks.find((item) => item.id === taskId) ?? null;

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full gap-0 p-0 data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg md:data-[side=left]:max-w-xl md:data-[side=right]:max-w-xl"
      >
        {task ? (
          <TaskSheetBody task={task} onClose={() => onOpenChange(false)} onSeen={onSeen} />
        ) : (
          <SheetHeader className="p-6">
            <SheetTitle>—</SheetTitle>
            <SheetDescription />
          </SheetHeader>
        )}
      </SheetContent>
    </Sheet>
  );
}

function TaskSheetBody({
  task,
  onClose,
  onSeen,
}: {
  task: Task;
  onClose: () => void;
  onSeen?: (taskId: string) => void;
}) {
  const { locale, t, formatNumber } = useLocale();
  const {
    workspace,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    currentUser,
  } = useWorkspace();

  React.useEffect(() => {
    if (task?.id) {
      onSeen?.(task.id);
    }
  }, [task?.id, onSeen]);

  if (!workspace) return null;

  const members = workspace.members;
  const goals = workspace.goals;
  const assignee = members.find((member) => member.id === task.assigneeId) ?? null;
  const goal = goals.find((item) => item.id === task.goalId) ?? null;
  const comments = commentsForTask(workspace, task.id);
  const blocker = taskBlocker(locale, task);

  const patchTitle = (next: string) =>
    void updateTask(task.id, locale === "fa" ? { title: next } : { titleEn: next });
  const patchDescription = (next: string) =>
    void updateTask(
      task.id,
      locale === "fa" ? { description: next } : { descriptionEn: next },
    );
  const patchBlocker = (next: string) =>
    void updateTask(
      task.id,
      locale === "fa" ? { blockedReason: next } : { blockedReasonEn: next },
    );

  return (
    <>
      <SheetHeader className="gap-2 border-b p-5 pe-12">
        <SheetTitle className="sr-only">{taskTitle(locale, task)}</SheetTitle>
        <SheetDescription className="sr-only">{t("task.panelTitle")}</SheetDescription>

        <div className="flex items-start gap-2">
          <div className="-m-1 flex-1 rounded-md p-1 transition-colors focus-within:bg-muted/50">
            <EditableText
              value={taskTitle(locale, task)}
              onCommit={patchTitle}
              ariaLabel={t("task.title")}
              placeholder={t("task.titlePlaceholder")}
              maxLength={160}
              className="px-1.5 text-lg leading-7 font-medium text-foreground hover:bg-transparent focus:bg-transparent focus:ring-0"
            />
          </div>
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              className="-me-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
              aria-label={t("task.delete")}
              title={t("task.delete")}
            >
              <Trash2Icon />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t("task.deleteTitle")}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t("task.deleteDescription")}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    onClose();
                    void deleteTask(task.id);
                  }}
                >
                  {t("action.delete")}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MemberAvatar member={assignee} size="sm" />
            {assignee ? memberName(locale, assignee) : t("task.unassigned")}
          </span>
          {goal ? (
            <>
              <span aria-hidden="true" className="text-border">
                ·
              </span>
              <span className="truncate">
                {t("task.goal")}: {goalTitle(locale, goal)}
              </span>
            </>
          ) : null}
          <span aria-hidden="true" className="text-border">
            ·
          </span>
          <span>{t("task.created", { when: formatRelative(locale, task.createdAt) })}</span>
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
        {task.status === "blocked" ? (
          <Alert variant="destructive">
            <AlertTitle>{t("task.blockedBanner")}</AlertTitle>
            <AlertDescription>
              <EditableText
                value={blocker}
                onCommit={patchBlocker}
                multiline
                allowEmpty
                ariaLabel={t("task.blocker")}
                placeholder={t("task.blockerPlaceholder")}
                className="mt-1 -mx-1 text-sm"
              />
            </AlertDescription>
          </Alert>
        ) : null}

        <Card className="gap-0">
          <CardContent>
            <FieldGroup className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field className="gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.status")}
                </FieldLabel>
                <StatusPicker
                  value={task.status}
                  onChange={(status) => void updateTask(task.id, { status })}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.priority")}
                </FieldLabel>
                <PriorityPicker
                  value={task.priority}
                  onChange={(priority) => void updateTask(task.id, { priority })}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.assignee")}
                </FieldLabel>
                <AssigneePicker
                  value={task.assigneeId}
                  members={members}
                  onChange={(assigneeId) => void updateTask(task.id, { assigneeId })}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.due")}
                </FieldLabel>
                <DateField
                  value={task.dueDate}
                  onChange={(dueDate) => void updateTask(task.id, { dueDate })}
                  ariaLabel={t("task.due")}
                  placeholder={t("date.noneDue")}
                />
              </Field>
              <Field className="gap-1.5">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.goal")}
                </FieldLabel>
                <GoalPicker
                  value={task.goalId}
                  goals={goals}
                  onChange={(goalId) => void updateTask(task.id, { goalId })}
                />
              </Field>
              {task.status !== "blocked" && blocker ? (
                <Field className="gap-1.5">
                  <FieldLabel className="text-xs text-muted-foreground">
                    {t("task.blocker")}
                  </FieldLabel>
                  <div className="rounded-md border border-border px-2.5 py-2 text-sm">
                    <EditableText
                      value={blocker}
                      onCommit={patchBlocker}
                      multiline
                      allowEmpty
                      ariaLabel={t("task.blocker")}
                      placeholder={t("task.blockerPlaceholder")}
                    />
                  </div>
                </Field>
              ) : null}
            </FieldGroup>
          </CardContent>
        </Card>

        <section className="flex flex-col gap-1.5">
          <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <AlignLeftIcon className="size-4" aria-hidden="true" />
            {t("task.description")}
          </h3>
          <div className="-mx-2 rounded-md border border-transparent px-2 py-1.5 transition-colors hover:border-border focus-within:border-ring">
            <EditableText
              value={taskDescription(locale, task)}
              onCommit={patchDescription}
              multiline
              allowEmpty
              ariaLabel={t("task.description")}
              placeholder={t("task.descriptionPlaceholder")}
              maxLength={4000}
              className="min-h-16 text-sm leading-6"
            />
          </div>
        </section>

        <section className="flex flex-col gap-3 border-t pt-5">
          <div className="flex items-baseline gap-2">
            <h3 className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <MessageSquareIcon className="size-4" aria-hidden="true" />
              {t("task.comments")}
            </h3>
            {comments.length > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(comments.length)}
              </span>
            ) : null}
          </div>

          {comments.length === 0 ? (
            <p className="rounded-lg border border-dashed px-4 py-8 text-center text-xs text-muted-foreground">
              {t("task.noComments")}
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {comments.map((comment) => {
                const author = members.find((item) => item.id === comment.authorId) ?? null;
                const isMine = author?.id === currentUser?.id;
                return (
                  <div key={comment.id} className="group flex gap-2.5">
                    <MemberAvatar
                      member={author}
                      size="sm"
                      withCard
                      className="mt-0.5 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline gap-2">
                        <span className="truncate text-xs font-medium">
                          {author ? memberName(locale, author) : t("task.deletedMember")}
                        </span>
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {formatRelative(locale, comment.createdAt)}
                        </span>
                        {isMine ? (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="ms-auto text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100 hover:text-destructive"
                            aria-label={t("action.delete")}
                            title={t("action.delete")}
                            onClick={() => void deleteComment(comment.id)}
                          >
                            <Trash2Icon />
                          </Button>
                        ) : null}
                      </div>
                      <FormattedCommentBody
                        text={commentBody(locale, comment)}
                        members={members}
                        currentUser={currentUser}
                        isMine={isMine}
                      />
                      <CommentAttachments attachments={comment.attachments} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {currentUser ? (
            <CommentComposer
              key={task.id}
              currentUser={currentUser}
              members={members}
              onSend={async (body, attachments) => {
                const payload = await addComment(
                  task.id,
                  body,
                  locale === "en" ? body : undefined,
                  attachments,
                );
                return Boolean(payload);
              }}
              sendAs={t("task.sendAs", { name: memberName(locale, currentUser) })}
              placeholder={t("task.commentPlaceholder")}
              sendLabel={t("action.send")}
            />
          ) : (
            <Item variant="outline" size="sm" className="text-xs text-muted-foreground">
              <ItemMedia variant="icon">
                <UserRoundIcon />
              </ItemMedia>
              <ItemContent>
                <ItemTitle className="text-xs font-normal text-muted-foreground">
                  {t("task.pickMember")}
                </ItemTitle>
              </ItemContent>
            </Item>
          )}
        </section>
      </div>

      <SheetFooter className="border-t px-5 py-3 text-xs text-muted-foreground">
        <span className="tabular-nums">
          {t("task.updated", { when: formatDateTime(locale, task.updatedAt) })}
        </span>
      </SheetFooter>
    </>
  );
}

function CommentComposer({
  onSend,
  sendAs,
  placeholder,
  sendLabel,
  currentUser,
  members,
}: {
  onSend: (body: string, attachments?: string[]) => Promise<boolean>;
  sendAs: string;
  placeholder: string;
  sendLabel: string;
  currentUser?: Member | null;
  members: Member[];
}) {
  const { locale, t } = useLocale();
  const [draft, setDraft] = React.useState("");
  const [attachments, setAttachments] = React.useState<string[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [sending, setSending] = React.useState(false);
  const [isDragging, setIsDragging] = React.useState(false);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Mention autocomplete state
  const [mentionQuery, setMentionQuery] = React.useState<string | null>(null);
  const [mentionIndex, setMentionIndex] = React.useState(0);
  const [mentionAnchor, setMentionAnchor] = React.useState<{ start: number; end: number } | null>(null);

  const checkMention = (text: string, cursorPos: number) => {
    const textBefore = text.slice(0, cursorPos);
    const match = textBefore.match(/@([\w\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]*)$/);
    if (match) {
      setMentionQuery(match[1].toLowerCase());
      setMentionAnchor({ start: cursorPos - match[0].length, end: cursorPos });
      setMentionIndex(0);
    } else {
      setMentionQuery(null);
      setMentionAnchor(null);
    }
  };

  const filteredMembers = React.useMemo(() => {
    if (mentionQuery === null) return [];
    const q = mentionQuery.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        (m.nameEn && m.nameEn.toLowerCase().includes(q)) ||
        (m.role && m.role.toLowerCase().includes(q)),
    );
  }, [members, mentionQuery]);

  const insertMention = (member: Member) => {
    if (!mentionAnchor || !textareaRef.current) return;
    const name = locale === "en" && member.nameEn ? member.nameEn : member.name;
    const insertion = `@${name} `;
    const before = draft.slice(0, mentionAnchor.start);
    const after = draft.slice(mentionAnchor.end);
    const nextDraft = before + insertion + after;
    setDraft(nextDraft);
    setMentionQuery(null);
    setMentionAnchor(null);

    const newPos = mentionAnchor.start + insertion.length;
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 10);
  };

  const handleFiles = async (files: FileList | File[]) => {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (imageFiles.length === 0) return;
    setUploading(true);
    try {
      const compressedList = await Promise.all(imageFiles.map((f) => compressImageFile(f)));
      setAttachments((prev) => [...prev, ...compressedList].slice(0, 6));
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    const body = draft.trim();
    if ((!body && attachments.length === 0) || sending || uploading) return;
    setSending(true);
    const ok = await onSend(body, attachments);
    setSending(false);
    if (ok) {
      setDraft("");
      setAttachments([]);
      setMentionQuery(null);
      setMentionAnchor(null);
    }
  };

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        setIsDragging(false);
      }}
      onDrop={async (e) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer?.files?.length) {
          await handleFiles(e.dataTransfer.files);
        }
      }}
      className={cn(
        "relative overflow-hidden rounded-xl border bg-card transition-all focus-within:border-ring",
        isDragging && "border-primary ring-2 ring-primary/20 bg-primary/[0.03]",
      )}
    >
      {/* منوی انتخاب هم‌تیمی برای منشن */}
      {mentionQuery !== null && filteredMembers.length > 0 ? (
        <div className="absolute inset-x-2 bottom-full z-50 mb-1 max-h-48 overflow-y-auto rounded-lg border bg-popover p-1 shadow-lg animate-in fade-in-0 zoom-in-95">
          <div className="px-2 py-1 text-[11px] font-medium text-muted-foreground">
            {t("task.mentionHint")}
          </div>
          {filteredMembers.map((member, idx) => (
            <button
              key={member.id}
              type="button"
              onClick={() => insertMention(member)}
              onMouseEnter={() => setMentionIndex(idx)}
              className={cn(
                "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-xs text-start transition-colors",
                idx === mentionIndex
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-muted text-foreground",
              )}
            >
              <MemberAvatar member={member} size="sm" />
              <div className="min-w-0 flex-1 truncate">
                <span className="font-medium">{memberName(locale, member)}</span>
                {member.role ? (
                  <span className="ms-1.5 text-[11px] text-muted-foreground">
                    ({member.role})
                  </span>
                ) : null}
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {/* ورودی مخفی فایل تصویر */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={async (e) => {
          if (e.target.files?.length) {
            await handleFiles(e.target.files);
            e.target.value = "";
          }
        }}
      />

      <Textarea
        ref={textareaRef}
        value={draft}
        dir="auto"
        onChange={(event) => {
          setDraft(event.target.value);
          checkMention(event.target.value, event.target.selectionStart || 0);
        }}
        onClick={(event) => {
          checkMention(draft, (event.target as HTMLTextAreaElement).selectionStart || 0);
        }}
        onKeyUp={(event) => {
          if (event.key === "ArrowUp" || event.key === "ArrowDown" || event.key === "Escape") {
            return;
          }
          checkMention(draft, (event.target as HTMLTextAreaElement).selectionStart || 0);
        }}
        onKeyDown={(event) => {
          if (mentionQuery !== null && filteredMembers.length > 0) {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setMentionIndex((prev) => (prev + 1) % filteredMembers.length);
              return;
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              setMentionIndex((prev) => (prev - 1 + filteredMembers.length) % filteredMembers.length);
              return;
            }
            if (event.key === "Enter" || event.key === "Tab") {
              event.preventDefault();
              if (filteredMembers[mentionIndex]) {
                insertMention(filteredMembers[mentionIndex]);
              }
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setMentionQuery(null);
              return;
            }
          }

          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        onPaste={async (event) => {
          const items = event.clipboardData?.items;
          if (!items) return;
          const imageFiles: File[] = [];
          for (let i = 0; i < items.length; i++) {
            if (items[i].type.startsWith("image/")) {
              const file = items[i].getAsFile();
              if (file) imageFiles.push(file);
            }
          }
          if (imageFiles.length > 0) {
            event.preventDefault();
            await handleFiles(imageFiles);
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={2}
        maxLength={4000}
        className="min-h-16 resize-none rounded-none border-0 bg-transparent p-3 text-sm shadow-none focus-visible:ring-0"
      />

      {/* نوار تصاویر پیوست‌شده قبل از ارسال */}
      {attachments.length > 0 || uploading ? (
        <div className="flex flex-wrap items-center gap-2 px-3 pb-2.5">
          {attachments.map((src, index) => (
            <div key={index} className="group relative size-14 overflow-hidden rounded-md border bg-muted">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="پیوست" className="size-full object-cover" />
              <button
                type="button"
                onClick={() => removeAttachment(index)}
                aria-label={t("task.removeAttachment")}
                className="absolute top-0.5 end-0.5 flex size-4 items-center justify-center rounded-full bg-black/70 text-white transition hover:bg-destructive"
              >
                <XIcon className="size-2.5" />
              </button>
            </div>
          ))}

          {uploading ? (
            <div className="flex size-14 items-center justify-center rounded-md border border-dashed text-muted-foreground animate-pulse">
              <Loader2Icon className="size-4 animate-spin" />
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center gap-1.5 border-t bg-muted/40 px-3 py-2">
        {currentUser ? <MemberAvatar member={currentUser} size="sm" /> : null}
        <span className="truncate text-xs text-muted-foreground">{sendAs}</span>

        <div className="ms-auto flex items-center gap-1">
          {/* دکمه منشن */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => {
              const next = draft + (draft.endsWith(" ") || !draft ? "@" : " @");
              setDraft(next);
              setMentionQuery("");
              textareaRef.current?.focus();
            }}
            title={t("task.mention")}
            aria-label={t("task.mention")}
            className="text-muted-foreground hover:text-foreground"
          >
            <AtSignIcon className="size-4" />
          </Button>

          {/* دکمه پیوست تصویر */}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={() => fileInputRef.current?.click()}
            title={t("task.uploadImage")}
            aria-label={t("task.uploadImage")}
            className="text-muted-foreground hover:text-foreground"
          >
            <ImageIcon className="size-4" />
          </Button>

          <span
            dir="ltr"
            className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex ms-1 me-2"
          >
            <Kbd>Ctrl</Kbd>
            <span aria-hidden="true">+</span>
            <Kbd>Enter</Kbd>
          </span>

          <Button
            size="sm"
            className="gap-1.5"
            onClick={() => void submit()}
            disabled={sending || uploading || (draft.trim().length === 0 && attachments.length === 0)}
          >
            <span>{sendLabel}</span>
            <SendIcon className="rtl:rotate-180" data-icon="inline-end" />
          </Button>
        </div>
      </div>
    </div>
  );
}
