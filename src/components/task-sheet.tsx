"use client";

import * as React from "react";
import {
  AlignLeftIcon,
  ArrowRightIcon,
  LinkIcon,
  MessageSquareIcon,
  Trash2Icon,
  UserRoundIcon,
} from "lucide-react";

import { CommentComposer } from "@/components/comment-composer";
import { CommentImages, CommentText } from "@/components/comment-content";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/toast";
import {
  useWorkspaceActions,
  useWorkspaceIndex,
  useWorkspaceState,
} from "@/components/workspace-provider";
import { formatDateTime, formatRelative } from "@/lib/dates";
import {
  commentBody,
  goalTitle,
  memberName,
  taskBlocker,
  taskDescription,
  taskTitle,
} from "@/lib/locale-text";
import type { Task } from "@/lib/types";
import { taskUrl } from "@/lib/task-url";

export function TaskSheet({
  taskId,
  onOpenChange,
  onSeen,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
  onSeen?: (taskId: string) => void;
}) {
  const { isRtl, t } = useLocale();
  const index = useWorkspaceIndex();
  const { status } = useWorkspaceState();
  const task = index?.task(taskId) ?? null;

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent
        side={isRtl ? "left" : "right"}
        className="w-full gap-0 p-0 data-[side=left]:sm:max-w-lg data-[side=right]:sm:max-w-lg md:data-[side=left]:max-w-xl md:data-[side=right]:max-w-xl"
      >
        {task ? (
          <TaskSheetBody task={task} onClose={() => onOpenChange(false)} onSeen={onSeen} />
        ) : (
          <SheetHeader className="gap-3 p-6">
            <SheetTitle>
              {status === "loading" ? t("app.loading") : t("task.notFoundTitle")}
            </SheetTitle>
            <SheetDescription>
              {status === "loading" ? t("app.loading") : t("task.notFoundBody")}
            </SheetDescription>
            {status === "loading" ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="self-start"
                onClick={() => onOpenChange(false)}
              >
                <ArrowRightIcon data-icon="inline-start" />
                {t("task.backToBoard")}
              </Button>
            )}
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
  const index = useWorkspaceIndex();
  const { currentUser } = useWorkspaceState();
  const { updateTask, deleteTask, addComment, deleteComment } = useWorkspaceActions();

  React.useEffect(() => {
    if (task?.id) {
      onSeen?.(task.id);
    }
  }, [task?.id, onSeen]);

  const members = index?.membersList ?? [];
  const goals = index?.goalsList ?? [];
  const assignee = index?.member(task.assigneeId) ?? null;
  const goal = index?.goal(task.goalId) ?? null;
  const comments = index?.comments(task.id) ?? [];
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

  // تیتر تب، همان چیزی است که گیرندهٔ لینک در مرورگر می‌بیند.
  React.useEffect(() => {
    const previous = document.title;
    document.title = `${taskTitle(locale, task)} · ${t("app.name")}`;
    return () => {
      document.title = previous;
    };
  }, [locale, t, task]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(taskUrl(task.id));
      toast.add({ title: t("task.linkCopied"), type: "success" });
    } catch {
      toast.add({ title: t("task.linkCopyFailed"), type: "error" });
    }
  };

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
          <div className="flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-muted-foreground"
              onClick={() => void copyLink()}
              aria-label={t("task.link")}
              title={t("task.link")}
            >
              <LinkIcon />
            </Button>
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
                      <CommentText
                        text={commentBody(locale, comment)}
                        members={members}
                        currentUser={currentUser}
                        isMine={isMine}
                      />
                      <CommentImages attachments={comment.attachments} />
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
