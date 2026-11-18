"use client";

import * as React from "react";
import {
  AlignLeftIcon,
  MessageSquareIcon,
  SendIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

import {
  DueChip,
  PriorityChip,
  StatusChip,
} from "@/components/chips";
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
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { useWorkspace } from "@/components/workspace-provider";
import { commentsForTask } from "@/lib/derived";
import { formatDateTime, formatRelative } from "@/lib/dates";
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
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { isRtl } = useLocale();
  const { workspace } = useWorkspace();
  const task = workspace?.tasks.find((item) => item.id === taskId) ?? null;

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full gap-0 p-0 sm:max-w-xl md:max-w-2xl"
      >
        {task ? (
          <TaskSheetBody task={task} onClose={() => onOpenChange(false)} />
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

function TaskSheetBody({ task, onClose }: { task: Task; onClose: () => void }) {
  const { locale, t } = useLocale();
  const {
    workspace,
    updateTask,
    deleteTask,
    addComment,
    deleteComment,
    currentUser,
  } = useWorkspace();

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
      <SheetHeader className="gap-3.5 border-b p-5 pe-12">
        <div className="flex flex-wrap items-center gap-2">
          <StatusChip status={task.status} />
          <PriorityChip priority={task.priority} />
          {task.status !== "done" ? <DueChip dueDate={task.dueDate} /> : null}

          <div className="ms-auto flex items-center gap-1">
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="ghost" size="icon-sm" />}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                aria-label={t("task.delete")}
                title={t("task.delete")}
              >
                <Trash2Icon className="size-4" />
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
        </div>

        <SheetTitle className="sr-only">{taskTitle(locale, task)}</SheetTitle>
        <SheetDescription className="sr-only">{t("task.panelTitle")}</SheetDescription>
        <div className="rounded-lg p-1 -m-1 transition-colors hover:bg-muted/30 focus-within:bg-muted/40">
          <EditableText
            value={taskTitle(locale, task)}
            onCommit={patchTitle}
            ariaLabel={t("task.title")}
            placeholder={t("task.titlePlaceholder")}
            maxLength={locale === "fa" ? 160 : 160}
            className="text-xl leading-8 font-bold text-foreground"
          />
        </div>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/85">
            <MemberAvatar member={assignee} size="sm" />
            {assignee ? memberName(locale, assignee) : t("task.unassigned")}
          </span>
          {goal ? (
            <>
              <span aria-hidden="true" className="text-muted-foreground/40">•</span>
              <span className="inline-flex items-center gap-1 truncate text-primary/90 font-medium">
                🎯 {goalTitle(locale, goal)}
              </span>
            </>
          ) : null}
          <span aria-hidden="true" className="text-muted-foreground/40">•</span>
          <span className="text-muted-foreground/80">
            {t("task.created", { when: formatRelative(locale, task.createdAt) })}
          </span>
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto p-5 space-y-5">
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
                className="-mx-1 text-sm mt-1"
              />
            </AlertDescription>
          </Alert>
        ) : null}

        {/* Properties Card */}
        <div className="rounded-xl border border-border/60 bg-muted/20 p-3.5 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("task.status")}
              </FieldLabel>
              <StatusPicker
                value={task.status}
                onChange={(status) => void updateTask(task.id, { status })}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("task.priority")}
              </FieldLabel>
              <PriorityPicker
                value={task.priority}
                onChange={(priority) => void updateTask(task.id, { priority })}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("task.assignee")}
              </FieldLabel>
              <AssigneePicker
                value={task.assigneeId}
                members={members}
                onChange={(assigneeId) => void updateTask(task.id, { assigneeId })}
              />
            </Field>
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
                {t("task.due")}
              </FieldLabel>
              <DateField
                value={task.dueDate}
                onChange={(dueDate) => void updateTask(task.id, { dueDate })}
                ariaLabel={t("task.due")}
                placeholder={t("date.noneDue")}
              />
            </Field>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field className="gap-1.5">
              <FieldLabel className="text-xs font-medium text-muted-foreground">
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
                <FieldLabel className="text-xs font-medium text-muted-foreground">
                  {t("task.blocker")}
                </FieldLabel>
                <div className="rounded-md border border-border/70 bg-background/50 px-2.5 py-1.5 text-sm">
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
          </div>
        </div>

        {/* Description Section */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/80">
            <AlignLeftIcon className="size-3.5 text-muted-foreground" />
            <span>{t("task.description")}</span>
          </div>
          <div className="rounded-xl border border-border/60 bg-muted/20 p-3 transition-colors hover:border-border/90 focus-within:border-primary/50 focus-within:bg-card/70 focus-within:ring-1 focus-within:ring-primary/20">
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
        </div>

        <Separator />

        {/* Discussion Section */}
        <section className="flex flex-col gap-3 pt-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquareIcon className="size-4 text-primary" />
              <span className="text-sm font-semibold">{t("task.comments")}</span>
              {comments.length > 0 && (
                <span className="inline-flex items-center justify-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular-nums">
                  {comments.length}
                </span>
              )}
            </div>
          </div>

          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 py-8 px-4 text-center">
              <div className="flex size-9 items-center justify-center rounded-full bg-muted/60 text-muted-foreground/60 mb-2">
                <MessageSquareIcon className="size-4.5" />
              </div>
              <p className="text-xs text-muted-foreground font-medium">
                {t("task.noComments")}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {comments.map((comment) => {
                const author = members.find((m) => m.id === comment.authorId) ?? null;
                const isMine = author?.id === currentUser?.id;
                return (
                  <div
                    key={comment.id}
                    className={cn(
                      "group relative flex gap-3 rounded-xl p-3 border transition-colors",
                      isMine
                        ? "bg-primary/5 border-primary/20"
                        : "bg-muted/30 border-border/50"
                    )}
                  >
                    <MemberAvatar
                      member={author}
                      size="sm"
                      withCard
                      className="shrink-0 mt-0.5"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-semibold text-foreground">
                            {author ? memberName(locale, author) : t("task.deletedMember")}
                          </span>
                          <span className="text-[11px] text-muted-foreground/80">
                            {formatRelative(locale, comment.createdAt)}
                          </span>
                        </div>
                        {isMine && (
                          <Button
                            variant="ghost"
                            size="icon-xs"
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive size-6 cursor-pointer"
                            aria-label={t("action.delete")}
                            title={t("action.delete")}
                            onClick={() => void deleteComment(comment.id)}
                          >
                            <Trash2Icon className="size-3.5" />
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-foreground/90 whitespace-pre-wrap leading-relaxed break-words">
                        {commentBody(locale, comment)}
                      </p>
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
              onSend={async (body) => {
                const payload = await addComment(
                  task.id,
                  body,
                  locale === "en" ? body : undefined,
                );
                return Boolean(payload);
              }}
              hint={t("task.commentHint")}
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
  hint,
  sendAs,
  placeholder,
  sendLabel,
  currentUser,
}: {
  onSend: (body: string) => Promise<boolean>;
  hint: string;
  sendAs: string;
  placeholder: string;
  sendLabel: string;
  currentUser?: Member | null;
}) {
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const ok = await onSend(body);
    setSending(false);
    if (ok) setDraft("");
  };

  return (
    <div className="relative rounded-xl border border-border/70 bg-card/60 shadow-xs transition-all focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/10">
      <textarea
        value={draft}
        dir="auto"
        onChange={(event) => setDraft(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
        placeholder={placeholder}
        aria-label={placeholder}
        rows={2}
        maxLength={2000}
        className="w-full resize-none bg-transparent p-3 text-sm outline-none placeholder:text-muted-foreground/60 min-h-16"
      />
      <div className="flex items-center justify-between border-t border-border/40 px-3 py-2 bg-muted/20 rounded-b-xl gap-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {currentUser && <MemberAvatar member={currentUser} size="sm" />}
          <span className="truncate">{sendAs}</span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground/75 ms-1">
            <Kbd className="text-[10px] py-0 px-1">Ctrl</Kbd>+<Kbd className="text-[10px] py-0 px-1">Enter</Kbd>
          </span>
        </div>
        <Button
          variant="default"
          size="sm"
          className="gap-1.5 h-8 px-3 font-medium cursor-pointer"
          onClick={() => void submit()}
          disabled={sending || draft.trim().length === 0}
        >
          <span>{sendLabel}</span>
          <SendIcon className="size-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
