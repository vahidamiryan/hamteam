"use client";

import * as React from "react";
import {
  EllipsisIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserPlusIcon,
} from "lucide-react";

import { DueChip } from "@/components/chips";
import { MemberAvatar } from "@/components/member-avatar";
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
import { useWorkspace } from "@/components/workspace-provider";
import { toFaDigits } from "@/lib/dates";
import { isOpen, memberStats, sortTasks } from "@/lib/derived";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

function StatPill({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone?: "danger" | "warning" | "success" | "default";
}) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border/60 bg-muted/30 px-2 py-1.5 text-center",
        tone === "danger" && "border-rose-200/70 bg-rose-50/60",
        tone === "warning" && "border-amber-200/70 bg-amber-50/60",
        tone === "success" && "border-emerald-200/70 bg-emerald-50/60",
      )}
    >
      <div className="text-sm font-semibold tabular-nums">{toFaDigits(value)}</div>
      <div className="text-[10px] text-muted-foreground">{label}</div>
    </div>
  );
}

function MemberDialog({
  open,
  member,
  onOpenChange,
}: {
  open: boolean;
  member: Member | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { createMember, updateMember } = useWorkspace();
  const [name, setName] = React.useState(member?.name ?? "");
  const [role, setRole] = React.useState(member?.role ?? "");
  const [email, setEmail] = React.useState(member?.email ?? "");
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || busy) return;
    setBusy(true);
    const payload = member
      ? await updateMember(member.id, { name, role, email })
      : await createMember({ name, role, email });
    setBusy(false);
    if (payload) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "30rem" }}>
        <DialogHeader>
          <DialogTitle>{member ? "ویرایش عضو تیم" : "افزودن عضو تیم"}</DialogTitle>
          <DialogDescription>
            نام اعضا از هم جدا می‌شود و در برد، تسک‌ها و کامنت‌ها با آواتار اختصاصی نمایش
            داده می‌شود.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <label className="block">
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              نام و نام خانوادگی
            </span>
            <Input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="مثلاً: سارا محمدی"
              maxLength={80}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              نقش در تیم
            </span>
            <Input
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder="مثلاً: توسعه‌دهنده فرانت‌اند"
              maxLength={60}
            />
          </label>
          <label className="block">
            <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
              ایمیل (اختیاری)
            </span>
            <Input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@team.ir"
              dir="ltr"
              maxLength={120}
            />
          </label>
          <DialogFooter className="pt-1">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              انصراف
            </Button>
            <Button type="submit" disabled={!name.trim() || busy}>
              {member ? "ذخیره" : "افزودن عضو"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function MemberCard({
  member,
  onOpenTask,
  onFilterBoard,
  onEdit,
  onDelete,
  onBecomeActive,
  isCurrent,
}: {
  member: Member;
  onOpenTask: (taskId: string) => void;
  onFilterBoard: (memberId: string) => void;
  onEdit: () => void;
  onDelete: () => void;
  onBecomeActive: () => void;
  isCurrent: boolean;
}) {
  const { workspace } = useWorkspace();
  const stats = memberStats(workspace!, member.id);
  const tasks = sortTasks(
    workspace!.tasks.filter((task) => task.assigneeId === member.id && isOpen(task)),
  ).slice(0, 3);

  return (
    <div
      className={cn(
        "flex flex-col rounded-2xl border border-border/70 bg-card p-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition hover:border-foreground/15",
        isCurrent && "ring-2 ring-primary/20",
      )}
    >
      <div className="flex items-start gap-2.5">
        <MemberAvatar name={member.name} memberId={member.id} size="lg" />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h3 className="truncate text-[0.92rem] font-semibold">{member.name}</h3>
            {isCurrent ? (
              <span className="rounded-full bg-primary/10 px-1.5 text-[10px] font-medium text-primary">
                شما
              </span>
            ) : null}
          </div>
          <p className="truncate text-[0.75rem] text-muted-foreground">
            {member.role || "بدون نقش تعریف‌شده"}
          </p>
          {member.email ? (
            <p className="truncate text-[11px] text-muted-foreground/80" dir="ltr">
              {member.email}
            </p>
          ) : null}
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label="عملیات عضو"
            className="inline-flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <EllipsisIcon className="size-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="min-w-52">
            <DropdownMenuItem onClick={onEdit}>
              <PencilIcon />
              ویرایش اطلاعات
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterBoard(member.id)}>
              <LayoutGridIcon />
              دیدن تسک‌ها در برد
            </DropdownMenuItem>
            {!isCurrent ? (
              <DropdownMenuItem onClick={onBecomeActive}>
                <UserPlusIcon />
                این من هستم
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={onDelete}>
              <Trash2Icon />
              حذف عضو
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-1.5">
        <StatPill label="باز" value={stats.open} />
        <StatPill label="در جریان" value={stats.inProgress} />
        <StatPill label="مسدود" value={stats.blocked} tone={stats.blocked > 0 ? "danger" : "default"} />
        <StatPill
          label="عقب‌افتاده"
          value={stats.overdue}
          tone={stats.overdue > 0 ? "warning" : "default"}
        />
      </div>

      <div className="mt-3 flex-1 space-y-1.5">
        {tasks.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border/70 px-2 py-3 text-center text-[11px] text-muted-foreground">
            تسک باز ندارد
          </p>
        ) : (
          tasks.map((task) => (
            <button
              key={task.id}
              type="button"
              onClick={() => onOpenTask(task.id)}
              className="flex w-full items-center gap-2 rounded-lg border border-transparent px-2 py-1.5 text-start transition hover:border-border/70 hover:bg-muted/40"
            >
              <span
                className={cn(
                  "size-1.5 shrink-0 rounded-full",
                  task.priority === "urgent"
                    ? "bg-rose-500"
                    : task.priority === "high"
                      ? "bg-orange-400"
                      : "bg-slate-300",
                )}
              />
              <span className="min-w-0 flex-1 truncate text-[0.78rem]">{task.title}</span>
              <DueChip dueDate={task.dueDate} />
            </button>
          ))
        )}
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-2.5">
        <span className="text-[11px] text-muted-foreground">
          {toFaDigits(stats.done)} تسک تمام‌شده از {toFaDigits(stats.total)}
        </span>
        <Button variant="ghost" size="sm" onClick={() => onFilterBoard(member.id)}>
          <LayoutGridIcon />
          تسک‌های این عضو
        </Button>
      </div>
    </div>
  );
}

export function PeopleView({
  onOpenTask,
  onFilterBoard,
}: {
  onOpenTask: (taskId: string) => void;
  onFilterBoard: (memberId: string) => void;
}) {
  const { workspace, currentUser, setCurrentUserId, deleteMember } = useWorkspace();
  const [dialog, setDialog] = React.useState<{ open: boolean; member: Member | null }>({
    open: false,
    member: null,
  });
  const [pendingDelete, setPendingDelete] = React.useState<Member | null>(null);

  if (!workspace) return null;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[0.95rem] font-semibold">افراد تیم</h2>
          <p className="text-[0.78rem] text-muted-foreground">
            {toFaDigits(workspace.members.length)} نفر · هر تسک می‌تواند به یکی از این
            افراد سپرده شود.
          </p>
        </div>
        <Button onClick={() => setDialog({ open: true, member: null })}>
          <PlusIcon />
          افزودن عضو
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {workspace.members.map((member) => (
          <MemberCard
            key={member.id}
            member={member}
            isCurrent={member.id === currentUser?.id}
            onOpenTask={onOpenTask}
            onFilterBoard={onFilterBoard}
            onEdit={() => setDialog({ open: true, member })}
            onDelete={() => setPendingDelete(member)}
            onBecomeActive={() => setCurrentUserId(member.id)}
          />
        ))}

        <button
          type="button"
          onClick={() => setDialog({ open: true, member: null })}
          className="flex min-h-40 flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-border/80 text-muted-foreground transition hover:border-foreground/25 hover:bg-muted/30 hover:text-foreground"
        >
          <UserPlusIcon className="size-5" />
          <span className="text-[0.8rem] font-medium">افزودن عضو جدید</span>
        </button>
      </div>

      <MemberDialog
        open={dialog.open}
        member={dialog.member}
        onOpenChange={(open) => setDialog({ open, member: open ? dialog.member : null })}
      />

      <AlertDialog
        open={Boolean(pendingDelete)}
        onOpenChange={(open) => (!open ? setPendingDelete(null) : undefined)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف {pendingDelete?.name}؟</AlertDialogTitle>
            <AlertDialogDescription>
              تسک‌های این عضو بدون مسئول می‌شوند و اهداف او بدون مالک. کامنت‌های قبلی باقی
              می‌مانند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              className="bg-rose-600 text-white hover:bg-rose-600/90"
              onClick={() => {
                if (pendingDelete) void deleteMember(pendingDelete.id);
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
