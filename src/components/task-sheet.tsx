"use client";

import * as React from "react";
import {
  MessageSquareIcon,
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
import { Bubble, BubbleContent } from "@/components/ui/bubble";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Item, ItemContent, ItemMedia, ItemTitle } from "@/components/ui/item";
import { Kbd } from "@/components/ui/kbd";
import { Marker, MarkerContent, MarkerIcon } from "@/components/ui/marker";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
  MessageGroup,
} from "@/components/ui/message";
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from "@/components/ui/message-scroller";
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
import type { Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskSheet({
  taskId,
  onOpenChange,
}: {
  taskId: string | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { workspace } = useWorkspace();
  const task = workspace?.tasks.find((item) => item.id === taskId) ?? null;

  return (
    <Sheet open={Boolean(taskId)} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full gap-0 sm:max-w-2xl"
        style={{ maxWidth: "34rem" }}
      >
        {task ? (
          <TaskSheetBody task={task} onClose={() => onOpenChange(false)} />
        ) : (
          <SheetHeader>
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
      <SheetHeader className="gap-3 border-b pe-10">
        <div className="flex flex-wrap items-center gap-1.5">
          <StatusChip status={task.status} />
          <PriorityChip priority={task.priority} />
          {task.status !== "done" ? <DueChip dueDate={task.dueDate} /> : null}
          <AlertDialog>
            <AlertDialogTrigger
              render={<Button variant="ghost" size="icon-sm" />}
              className="ms-auto text-muted-foreground hover:text-destructive"
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

        <SheetTitle className="sr-only">{taskTitle(locale, task)}</SheetTitle>
        <SheetDescription className="sr-only">{t("task.panelTitle")}</SheetDescription>
        <EditableText
          value={taskTitle(locale, task)}
          onCommit={patchTitle}
          ariaLabel={t("task.title")}
          placeholder={t("task.titlePlaceholder")}
          maxLength={locale === "fa" ? 160 : 160}
          className="-mx-1 text-lg leading-7 font-semibold"
        />

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MemberAvatar member={assignee} size="sm" />
            {assignee ? memberName(locale, assignee) : t("task.unassigned")}
          </span>
          {goal ? <span className="truncate">🎯 {goalTitle(locale, goal)}</span> : null}
          <span>{t("task.created", { when: formatRelative(locale, task.createdAt) })}</span>
        </div>
      </SheetHeader>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-2">
        <div className="flex flex-col gap-4 py-3">
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
                  className="-mx-1 text-sm"
                />
              </AlertDescription>
            </Alert>
          ) : null}

          <FieldGroup className="gap-2">
            <div className="grid grid-cols-2 gap-2">
              <Field className="gap-1">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.status")}
                </FieldLabel>
                <StatusPicker
                  value={task.status}
                  onChange={(status) => void updateTask(task.id, { status })}
                />
              </Field>
              <Field className="gap-1">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.priority")}
                </FieldLabel>
                <PriorityPicker
                  value={task.priority}
                  onChange={(priority) => void updateTask(task.id, { priority })}
                />
              </Field>
            </div>

            <Field className="gap-1">
              <FieldLabel className="text-xs text-muted-foreground">
                {t("task.assignee")}
              </FieldLabel>
              <AssigneePicker
                value={task.assigneeId}
                members={members}
                onChange={(assigneeId) => void updateTask(task.id, { assigneeId })}
              />
            </Field>

            <div className="grid grid-cols-2 gap-2">
              <Field className="gap-1">
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
              <Field className="gap-1">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.goal")}
                </FieldLabel>
                <GoalPicker
                  value={task.goalId}
                  goals={goals}
                  onChange={(goalId) => void updateTask(task.id, { goalId })}
                />
              </Field>
            </div>

            {task.status !== "blocked" ? (
              <Field className="gap-1">
                <FieldLabel className="text-xs text-muted-foreground">
                  {t("task.blocker")}
                </FieldLabel>
                <EditableText
                  value={blocker}
                  onCommit={patchBlocker}
                  multiline
                  allowEmpty
                  ariaLabel={t("task.blocker")}
                  placeholder={t("task.blockerPlaceholder")}
                  className="-mx-1 rounded-md border border-dashed px-2 py-1.5 text-sm"
                />
              </Field>
            ) : null}

            <Field className="gap-1">
              <FieldLabel className="text-xs text-muted-foreground">
                {t("task.description")}
              </FieldLabel>
              <EditableText
                value={taskDescription(locale, task)}
                onCommit={patchDescription}
                multiline
                allowEmpty
                ariaLabel={t("task.description")}
                placeholder={t("task.descriptionPlaceholder")}
                maxLength={4000}
                className="-mx-1 min-h-16 text-sm leading-6"
              />
            </Field>
          </FieldGroup>
        </div>

        <Separator />

        <section className="flex flex-col gap-2 py-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold">
            <MessageSquareIcon data-icon="inline-start" className="text-muted-foreground" />
            {t("task.comments")}
            {comments.length > 0 ? (
              <span className="text-xs font-normal text-muted-foreground tabular-nums">
                {comments.length}
              </span>
            ) : null}
          </h2>

          <MessageScrollerProvider autoScroll defaultScrollPosition="end">
            <MessageScroller
              className={cn(
                "rounded-xl border bg-muted/20",
                comments.length === 0
                  ? "h-40 border-dashed bg-transparent"
                  : "h-64",
              )}
            >
              <MessageScrollerViewport aria-label={t("task.comments")}>
                <MessageScrollerContent className="gap-3 p-3">
                  {comments.length === 0 ? (
                    <Marker className="justify-center py-8">
                      <MarkerIcon>
                        <MessageSquareIcon />
                      </MarkerIcon>
                      <MarkerContent className="text-center">
                        {t("task.noComments")}
                      </MarkerContent>
                    </Marker>
                  ) : (
                    <MessageGroup className="gap-4">
                      {comments.map((comment) => {
                        const author =
                          members.find((member) => member.id === comment.authorId) ??
                          null;
                        const isMine = author?.id === currentUser?.id;
                        return (
                          <MessageScrollerItem
                            key={comment.id}
                            messageId={comment.id}
                          >
                            <Message align={isMine ? "end" : "start"} className="gap-2">
                              <MessageAvatar>
                                <MemberAvatar member={author} size="sm" withCard />
                              </MessageAvatar>
                              <MessageContent>
                                <Bubble
                                  align={isMine ? "end" : "start"}
                                  variant={isMine ? "default" : "muted"}
                                >
                                  <BubbleContent>
                                    {commentBody(locale, comment)}
                                  </BubbleContent>
                                </Bubble>
                                <MessageFooter className="gap-1.5 px-1">
                                  <span className="truncate">
                                    {author
                                      ? memberName(locale, author)
                                      : t("task.deletedMember")}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span className="shrink-0">
                                    {formatRelative(locale, comment.createdAt)}
                                  </span>
                                  {isMine ? (
                                    <Button
                                      variant="ghost"
                                      size="icon-xs"
                                      className="ms-1 text-muted-foreground hover:text-destructive"
                                      aria-label={t("action.delete")}
                                      title={t("action.delete")}
                                      onClick={() => void deleteComment(comment.id)}
                                    >
                                      <Trash2Icon />
                                    </Button>
                                  ) : null}
                                </MessageFooter>
                              </MessageContent>
                            </Message>
                          </MessageScrollerItem>
                        );
                      })}
                    </MessageGroup>
                  )}
                </MessageScrollerContent>
              </MessageScrollerViewport>
              <MessageScrollerButton />
            </MessageScroller>
          </MessageScrollerProvider>

          {currentUser ? (
            <CommentComposer
              key={task.id}
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

      <SheetFooter className="border-t text-[11px] text-muted-foreground">
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
}: {
  onSend: (body: string) => Promise<boolean>;
  hint: string;
  sendAs: string;
  placeholder: string;
  sendLabel: string;
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
    <InputGroup className="h-auto">
      <InputGroupTextarea
        value={draft}
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
        className="min-h-14"
      />
      <InputGroupAddon align="block-end" className="justify-between gap-2">
        <span className="hidden items-center gap-1 text-[11px] text-muted-foreground sm:flex">
          <Kbd>Ctrl</Kbd>+<Kbd>Enter</Kbd> {hint}
        </span>
        <span className="truncate text-[11px] text-muted-foreground">{sendAs}</span>
        <InputGroupButton
          variant="default"
          size="sm"
          className="ms-auto"
          onClick={() => void submit()}
          disabled={sending || draft.trim().length === 0}
        >
          {sendLabel}
        </InputGroupButton>
      </InputGroupAddon>
    </InputGroup>
  );
}
