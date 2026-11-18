"use client";

import * as React from "react";
import {
  BanIcon,
  MessageSquareIcon,
  SendIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";

import { DueChip, StatusChip } from "@/components/chips";
import { DateField } from "@/components/date-field";
import { EditableText } from "@/components/editable-text";
import { MemberAvatar, UnassignedAvatar } from "@/components/member-avatar";
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
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/workspace-provider";
import { formatDateTime, formatJalali, formatRelative, toFaDigits } from "@/lib/dates";
import { commentsForTask, goalProgress } from "@/lib/derived";
import { cn } from "@/lib/utils";

/** فرم ارسال کامنت؛ برای هر تسک یک نمونه‌ی تازه ساخته می‌شود. */
function CommentComposer({ taskId }: { taskId: string }) {
  const { currentUser, addComment } = useWorkspace();
  const [draft, setDraft] = React.useState("");
  const [sending, setSending] = React.useState(false);

  const submit = async () => {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    const payload = await addComment(taskId, body);
    setSending(false);
    if (payload) setDraft("");
  };

  return (
    <div className="rounded-xl border bg-card p-2">
      <Textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="پرسش، پیشنهاد یا تصمیم تیم را بنویسید…"
        aria-label="متن کامنت"
        rows={2}
        maxLength={2000}
        onKeyDown={(event) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            void submit();
          }
        }}
        className="min-h-16 resize-none border-0 bg-transparent text-[0.82rem] shadow-none focus-visible:ring-0"
      />
      <div className="flex items-center justify-between gap-2 px-1">
        <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
          {currentUser ? (
            <>
              <MemberAvatar name={currentUser.name} memberId={currentUser.id} size="xs" />
              ارسال به‌عنوان {currentUser.name}
            </>
          ) : (
            "برای کامنت نوشتن، عضو فعال را انتخاب کنید."
          )}
        </span>
        <Button size="sm" onClick={() => void submit()} disabled={!draft.trim() || sending || !currentUser}>
          <SendIcon />
          ارسال
        </Button>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="shrink-0 text-[0.78rem] text-muted-foreground">{label}</span>
      <div className="w-[13rem] max-w-full">{children}</div>
    </div>
  );
}

export function TaskSheet({
  taskId,
  onClose,
  onOpenGoal,
}: {
  taskId: string | null;
  onClose: () => void;
  onOpenGoal?: (goalId: string) => void;
}) {
  const {
    workspace,
    currentUser,
    updateTask,
    deleteTask,
    deleteComment,
  } = useWorkspace();
  const listRef = React.useRef<HTMLDivElement | null>(null);

  const task = workspace?.tasks.find((item) => item.id === taskId) ?? null;

  const comments = React.useMemo(
    () => (workspace && task ? commentsForTask(workspace, task.id) : []),
    [workspace, task],
  );

  // تازه‌ترین پیام گفت‌وگو همیشه در دید باشد.
  React.useEffect(() => {
    const element = listRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [comments.length, taskId]);

  const goal = workspace?.goals.find((item) => item.id === task?.goalId) ?? null;
  const goalStats = workspace && goal ? goalProgress(workspace, goal.id) : null;
  const assignee =
    workspace?.members.find((member) => member.id === task?.assigneeId) ?? null;

  return (
    <Sheet open={Boolean(task)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <SheetContent
        side="left"
        style={{ maxWidth: "34rem" }}
        className="flex w-full flex-col gap-0 p-0"
      >
        {task ? (
          <>
            <div className="flex flex-wrap items-center gap-1.5 border-b bg-muted/20 px-4 py-2 pr-12">
              <StatusChip status={task.status} />
              {assignee ? (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border/70">
                  <MemberAvatar name={assignee.name} memberId={assignee.id} size="xs" />
                  {assignee.name}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-background px-1.5 py-0.5 text-[11px] text-muted-foreground ring-1 ring-border/70">
                  <UnassignedAvatar size="xs" />
                  بدون مسئول
                </span>
              )}
              <span className="ms-auto text-[11px] text-muted-foreground">
                #{toFaDigits(task.id.slice(-4))}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              <SheetHeader className="sr-only">
                <SheetTitle>{task.title}</SheetTitle>
                <SheetDescription>جزئیات تسک، مسئول، هدف و گفت‌وگوی تیم</SheetDescription>
              </SheetHeader>

              <div className="space-y-5 p-4">
                <div className="space-y-1">
                  <EditableText
                    value={task.title}
                    ariaLabel="عنوان تسک"
                    maxLength={160}
                    onCommit={(title) => updateTask(task.id, { title })}
                    className="-mx-1 text-[1.05rem] font-semibold leading-7"
                  />
                  <EditableText
                    value={task.description}
                    ariaLabel="توضیحات تسک"
                    multiline
                    allowEmpty
                    placeholder="توضیحات، معیار پذیرش یا یادداشت‌های کار را اینجا بنویسید…"
                    onCommit={(description) => updateTask(task.id, { description })}
                    className="-mx-1 min-h-[3.5rem] text-[0.85rem] leading-6 text-muted-foreground"
                  />
                </div>

                <div className="space-y-2 rounded-xl border bg-muted/20 p-3">
                  <FieldRow label="مسئول">
                    <AssigneePicker
                      value={task.assigneeId}
                      members={workspace?.members ?? []}
                      onChange={(assigneeId) =>
                        updateTask(task.id, { assigneeId }, { success: "مسئول تسک تغییر کرد" })
                      }
                    />
                  </FieldRow>
                  <FieldRow label="وضعیت">
                    <StatusPicker
                      value={task.status}
                      onChange={(status) => updateTask(task.id, { status })}
                    />
                  </FieldRow>
                  <FieldRow label="اولویت">
                    <PriorityPicker
                      value={task.priority}
                      onChange={(priority) => updateTask(task.id, { priority })}
                    />
                  </FieldRow>
                  <FieldRow label="سررسید">
                    <DateField
                      value={task.dueDate}
                      ariaLabel="تاریخ سررسید تسک"
                      onChange={(dueDate) => updateTask(task.id, { dueDate })}
                    />
                  </FieldRow>
                  <FieldRow label="هدف">
                    <GoalPicker
                      value={task.goalId}
                      goals={workspace?.goals ?? []}
                      onChange={(goalId) => updateTask(task.id, { goalId })}
                    />
                  </FieldRow>
                </div>

                {task.dueDate ? (
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                    <DueChip dueDate={task.dueDate} />
                    <span>سررسید به تاریخ شمسی: {formatJalali(task.dueDate)}</span>
                  </div>
                ) : null}

                {task.status === "blocked" ? (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/70 p-3">
                    <div className="mb-1.5 flex items-center gap-1.5 text-[0.78rem] font-medium text-rose-800">
                      <BanIcon className="size-3.5" />
                      دلیل مسدود بودن
                    </div>
                    <EditableText
                      value={task.blockedReason ?? ""}
                      ariaLabel="دلیل مسدودی"
                      multiline
                      allowEmpty
                      maxLength={300}
                      placeholder="مثلاً: منتظر پاسخ تیم زیرساخت هستیم…"
                      onCommit={(blockedReason) => updateTask(task.id, { blockedReason })}
                      className="-mx-1 text-[0.82rem] leading-6 text-rose-900"
                    />
                  </div>
                ) : null}

                {goal ? (
                  <button
                    type="button"
                    onClick={() => onOpenGoal?.(goal.id)}
                    className="flex w-full items-center gap-2 rounded-xl border bg-card p-3 text-start transition hover:border-foreground/15 hover:bg-muted/30"
                  >
                    <TargetIcon className="size-4 shrink-0 text-muted-foreground" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[0.82rem] font-medium">
                        {goal.title}
                      </span>
                      <span className="block text-[11px] text-muted-foreground">
                        {toFaDigits(goalStats?.done ?? 0)} از {toFaDigits(goalStats?.total ?? 0)} تسک این هدف انجام شده
                      </span>
                    </span>
                  </button>
                ) : null}

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="text-[0.85rem] font-semibold">همفکری و کامنت‌ها</h3>
                    <span className="rounded-full bg-muted px-1.5 text-[11px] text-muted-foreground">
                      {toFaDigits(comments.length)}
                    </span>
                  </div>

                  <div ref={listRef} className="max-h-80 space-y-3 overflow-y-auto pe-1">
                    {comments.length === 0 ? (
                      <p className="rounded-xl border border-dashed p-4 text-center text-[0.78rem] text-muted-foreground">
                        هنوز گفت‌وگویی ثبت نشده. اولین پرسش یا تصمیم را بنویسید.
                      </p>
                    ) : (
                      comments.map((comment) => {
                        const author =
                          workspace?.members.find(
                            (member) => member.id === comment.authorId,
                          ) ?? null;
                        const isMine = currentUser?.id === comment.authorId;
                        return (
                          <div key={comment.id} className="group flex gap-2">
                            <MemberAvatar
                              name={author?.name ?? "عضو حذف‌شده"}
                              memberId={author?.id ?? comment.authorId}
                              size="sm"
                            />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                                <span className="font-medium text-foreground">
                                  {author?.name ?? "عضو حذف‌شده"}
                                </span>
                                <span title={formatDateTime(comment.createdAt)}>
                                  {formatRelative(comment.createdAt)}
                                </span>
                                {isMine ? (
                                  <Button
                                    variant="ghost"
                                    size="icon-xs"
                                    aria-label="حذف کامنت"
                                    className="ms-auto opacity-0 transition group-hover:opacity-100"
                                    onClick={() => deleteComment(comment.id)}
                                  >
                                    <Trash2Icon />
                                  </Button>
                                ) : null}
                              </div>
                              <p className="mt-1 whitespace-pre-wrap rounded-xl rounded-ss-sm bg-muted/60 px-3 py-2 text-[0.82rem] leading-6">
                                {comment.body}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <CommentComposer key={task.id} taskId={task.id} />
                </div>
              </div>
            </div>

            <SheetFooter className="flex-row items-center justify-between gap-2 border-t bg-muted/20">
              <span className="text-[11px] text-muted-foreground">
                ساخته‌شده {formatRelative(task.createdAt)} · آخرین تغییر{" "}
                {formatRelative(task.updatedAt)}
              </span>
              <AlertDialog>
                <AlertDialogTrigger
                  className={cn(
                    "inline-flex h-7 items-center gap-1.5 rounded-lg px-2 text-[0.8rem] text-rose-700 transition hover:bg-rose-100/70",
                  )}
                >
                  <Trash2Icon className="size-3.5" />
                  حذف تسک
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>حذف این تسک؟</AlertDialogTitle>
                    <AlertDialogDescription>
                      «{task.title}» و همه‌ی کامنت‌های آن حذف می‌شوند. این کار قابل بازگشت
                      نیست.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>انصراف</AlertDialogCancel>
                    <AlertDialogAction
                      className="bg-rose-600 text-white hover:bg-rose-600/90"
                      onClick={() => {
                        void deleteTask(task.id);
                        onClose();
                      }}
                    >
                      حذف کن
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </SheetFooter>
          </>
        ) : (
          <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
            <MessageSquareIcon className="me-2 size-4" />
            تسکی انتخاب نشده است.
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
