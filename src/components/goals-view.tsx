"use client";

import * as React from "react";
import {
  CircleCheckIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";

import { DueChip } from "@/components/chips";
import { DateField } from "@/components/date-field";
import { MemberAvatar, UnassignedAvatar } from "@/components/member-avatar";
import { AssigneePicker } from "@/components/pickers";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { MenuSelect } from "@/components/menu-select";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/workspace-provider";
import { formatJalali, toFaDigits } from "@/lib/dates";
import { goalProgress, memberById } from "@/lib/derived";
import { GOAL_STATUS_META, STATUS_META } from "@/lib/labels";
import type { Goal, GoalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function GoalDialog({
  open,
  goal,
  onOpenChange,
}: {
  open: boolean;
  goal: Goal | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { workspace, createGoal, updateGoal, currentUser } = useWorkspace();
  const [title, setTitle] = React.useState(goal?.title ?? "");
  const [description, setDescription] = React.useState(goal?.description ?? "");
  const [ownerId, setOwnerId] = React.useState<string | null>(
    goal?.ownerId ?? currentUser?.id ?? null,
  );
  const [targetDate, setTargetDate] = React.useState<string | null>(
    goal?.targetDate ?? null,
  );
  const [status, setStatus] = React.useState<GoalStatus>(goal?.status ?? "active");
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || busy) return;
    setBusy(true);
    const payload = goal
      ? await updateGoal(goal.id, { title, description, ownerId, targetDate, status })
      : await createGoal({ title, description, ownerId, targetDate, status });
    setBusy(false);
    if (payload) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "32rem" }}>
        <DialogHeader>
          <DialogTitle>{goal ? "ویرایش هدف" : "هدف جدید"}</DialogTitle>
          <DialogDescription>
            هدف یک نتیجه‌ی بزرگ‌تر است که چند تسک به آن وصل می‌شوند؛ پیشرفت به‌صورت خودکار
            از تسک‌های انجام‌شده محاسبه می‌شود.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              عنوان هدف
            </span>
            <Input
              autoFocus
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="مثلاً: انتشار نسخه ۱.۰ تا پایان فصل"
              maxLength={140}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              توضیحات
            </span>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="نتیجه‌ی مورد انتظار و معیار موفقیت…"
              rows={2}
              maxLength={2000}
              className="min-h-16 resize-none text-[0.85rem]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
                مالک هدف
              </span>
              <AssigneePicker
                value={ownerId}
                members={workspace?.members ?? []}
                onChange={setOwnerId}
                className="h-9"
              />
            </div>
            <div>
              <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
                وضعیت
              </span>
              <MenuSelect
                value={status}
                onChange={(next) => setStatus(next as GoalStatus)}
                className="h-9"
                options={(Object.keys(GOAL_STATUS_META) as GoalStatus[]).map((key) => ({
                  value: key,
                  label: GOAL_STATUS_META[key].label,
                  leading: (
                    <span className={cn("size-2 rounded-full", GOAL_STATUS_META[key].dot)} />
                  ),
                }))}
              />
            </div>
          </div>

          <div>
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              تاریخ هدف
            </span>
            <DateField
              value={targetDate}
              onChange={setTargetDate}
              ariaLabel="تاریخ هدف"
              placeholder="بدون تاریخ هدف"
              triggerClassName="h-9"
            />
          </div>

          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={!title.trim() || busy}>
              {goal ? "ذخیره تغییرات" : "ساخت هدف"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function GoalCard({
  goal,
  onOpenTask,
  onEdit,
  onDelete,
  onMarkAchieved,
}: {
  goal: Goal;
  onOpenTask: (taskId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onMarkAchieved: () => void;
}) {
  const { workspace } = useWorkspace();
  const progress = goalProgress(workspace!, goal.id);
  const owner = memberById(workspace!, goal.ownerId);
  const tasks = workspace!.tasks.filter((task) => task.goalId === goal.id).slice(0, 3);
  const meta = GOAL_STATUS_META[goal.status];

  return (
    <div className="flex flex-col rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-foreground/15">
      <div className="flex items-start gap-2.5">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <TargetIcon className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <h3 className="text-[0.9rem] font-semibold leading-6">{goal.title}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                meta.chip,
              )}
            >
              {meta.label}
            </span>
            <DueChip dueDate={goal.targetDate} />
            {goal.targetDate ? (
              <span className="text-[10px] text-muted-foreground">
                {formatJalali(goal.targetDate)}
              </span>
            ) : null}
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="عملیات هدف"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <EllipsisIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              ویرایش هدف
            </DropdownMenuItem>
            {goal.status !== "achieved" ? (
              <DropdownMenuItem onClick={onMarkAchieved}>
                <CircleCheckIcon />
                علامت‌گذاری به‌عنوان محقق‌شده
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              حذف هدف
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {goal.description ? (
        <p className="mt-2 line-clamp-2 text-[0.78rem] leading-6 text-muted-foreground">
          {goal.description}
        </p>
      ) : null}

      <div className="mt-3">
        <div className="mb-1 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground">پیشرفت</span>
          <span className="font-medium tabular-nums">{toFaDigits(progress.percent)}٪</span>
        </div>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-[width] duration-300",
              goal.status === "achieved" ? "bg-emerald-500" : "bg-primary",
            )}
            style={{ width: `${progress.percent}%` }}
          />
        </div>
        <div className="mt-1.5 flex items-center gap-2 text-[11px] text-muted-foreground">
          <span>{toFaDigits(progress.done)} انجام‌شده</span>
          <span>·</span>
          <span>{toFaDigits(progress.total)} تسک</span>
          {progress.blocked > 0 ? (
            <>
              <span>·</span>
              <span className="text-rose-600">{toFaDigits(progress.blocked)} مسدود</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="mt-3 flex-1 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-2 py-3 text-center text-[11px] text-muted-foreground">
            هنوز تسکی به این هدف وصل نشده
          </p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-start transition hover:bg-muted/40"
            >
              <span className={cn("size-1.5 shrink-0 rounded-full", STATUS_META[task.status].dot)} />
              <span
                className={cn(
                  "min-w-0 flex-1 truncate text-[0.78rem]",
                  task.status === "done" && "text-muted-foreground line-through",
                )}
              >
                {task.title}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {STATUS_META[task.status].label}
              </span>
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center gap-2 border-t border-border/60 pt-2.5">
        {owner ? (
          <>
            <MemberAvatar name={owner.name} memberId={owner.id} size="xs" />
            <span className="text-[11px] text-muted-foreground">{owner.name}</span>
          </>
        ) : (
          <>
            <UnassignedAvatar size="xs" />
            <span className="text-[11px] text-muted-foreground">بدون مالک</span>
          </>
        )}
      </div>
    </div>
  );
}

export function GoalsView({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const { workspace, updateGoal, deleteGoal } = useWorkspace();
  const [dialog, setDialog] = React.useState<{ open: boolean; goal: Goal | null }>({
    open: false,
    goal: null,
  });
  const [pendingDelete, setPendingDelete] = React.useState<Goal | null>(null);

  if (!workspace) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[0.95rem] font-semibold">اهداف تیمی</h2>
          <p className="text-[0.78rem] text-muted-foreground">
            {toFaDigits(workspace.goals.length)} هدف · تسک‌ها را به هدف‌ها وصل کنید تا پیشرفت
            خودکار محاسبه شود.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, goal: null })}>
          <PlusIcon />
          هدف جدید
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {workspace.goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onOpenTask={onOpenTask}
            onEdit={() => setDialog({ open: true, goal })}
            onDelete={() => setPendingDelete(goal)}
            onMarkAchieved={() => void updateGoal(goal.id, { status: "achieved" })}
          />
        ))}

        <button
          type="button"
          onClick={() => setDialog({ open: true, goal: null })}
          className="flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/80 text-muted-foreground transition hover:border-foreground/25 hover:bg-muted/30 hover:text-foreground"
        >
          <TargetIcon className="size-5" />
          <span className="text-[0.8rem] font-medium">هدف تازه تعریف کنید</span>
        </button>
      </div>

      <GoalDialog
        open={dialog.open}
        goal={dialog.goal}
        onOpenChange={(open) => setDialog({ open, goal: open ? dialog.goal : null })}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف هدف «{pendingDelete?.title}»؟</AlertDialogTitle>
            <AlertDialogDescription>
              تسک‌های وصل‌شده حذف نمی‌شوند، فقط از این هدف جدا می‌شوند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-600/90"
              onClick={() => {
                if (pendingDelete) void deleteGoal(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              حذف کن
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
