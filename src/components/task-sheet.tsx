"use client";

import * as React from "react";
import {
  AlignLeftIcon,
  MessageSquareIcon,
  SendIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

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
        className="w-full gap-0 p-0 data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg md:data-[side=left]:max-w-xl md:data-[side=right]:max-w-xl"
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
  const { locale, t, formatNumber } = useLocale();
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
                      <p
                        className={cn(
                          "mt-0.5 text-start text-sm leading-6 break-words whitespace-pre-wrap [unicode-bidi:plaintext]",
                          isMine ? "text-foreground" : "text-secondary-foreground",
                        )}
                      >
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
}: {
  onSend: (body: string) => Promise<boolean>;
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
    <div className="overflow-hidden rounded-lg border bg-card transition-colors focus-within:border-ring">
      <Textarea
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
        className="min-h-16 resize-none rounded-none border-0 bg-transparent p-3 text-sm shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center gap-2 border-t bg-muted/40 px-3 py-2">
        {currentUser ? <MemberAvatar member={currentUser} size="sm" /> : null}
        <span className="truncate text-xs text-muted-foreground">{sendAs}</span>
        <span
          dir="ltr"
          className="ms-auto hidden items-center gap-1 text-xs text-muted-foreground sm:flex"
        >
          <Kbd>Ctrl</Kbd>
          <span aria-hidden="true">+</span>
          <Kbd>Enter</Kbd>
        </span>
        <Button
          size="sm"
          className="gap-1.5"
          onClick={() => void submit()}
          disabled={sending || draft.trim().length === 0}
        >
          <span>{sendLabel}</span>
          <SendIcon className="rtl:rotate-180" data-icon="inline-end" />
        </Button>
      </div>
    </div>
  );
}
