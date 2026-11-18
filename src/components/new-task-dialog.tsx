"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { DateField } from "@/components/date-field";
import {
  AssigneePicker,
  GoalPicker,
  PriorityPicker,
  StatusPicker,
} from "@/components/pickers";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/workspace-provider";
import type { Priority, TaskStatus } from "@/lib/types";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1 block text-[0.75rem] font-medium text-muted-foreground">
      {children}
    </span>
  );
}

/** فرم داخل دیالوگ است؛ با هر بار باز شدن از نو ساخته می‌شود. */
function TaskForm({
  defaultStatus,
  defaultAssigneeId,
  defaultGoalId,
  onDone,
}: {
  defaultStatus: TaskStatus;
  defaultAssigneeId: string | null;
  defaultGoalId: string | null;
  onDone: () => void;
}) {
  const { workspace, createTask, currentUser } = useWorkspace();
  const [title, setTitle] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = React.useState<string | null>(
    defaultAssigneeId ?? currentUser?.id ?? null,
  );
  const [goalId, setGoalId] = React.useState<string | null>(defaultGoalId);
  const [dueDate, setDueDate] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    const payload = await createTask({
      title: trimmed,
      description: description.trim() || undefined,
      status,
      priority,
      assigneeId,
      goalId,
      dueDate,
    });
    setBusy(false);
    if (payload) onDone();
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div>
        <FieldLabel>عنوان تسک</FieldLabel>
        <Input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="مثلاً: آماده‌سازی گزارش هفتگی تیم"
          maxLength={160}
        />
      </div>

      <div>
        <FieldLabel>توضیحات</FieldLabel>
        <Textarea
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="معیار پذیرش یا نکات مهم…"
          rows={2}
          maxLength={4000}
          className="min-h-16 resize-none text-[0.85rem]"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <FieldLabel>مسئول</FieldLabel>
          <AssigneePicker
            value={assigneeId}
            members={workspace?.members ?? []}
            onChange={setAssigneeId}
            className="h-9"
          />
        </div>
        <div>
          <FieldLabel>وضعیت</FieldLabel>
          <StatusPicker value={status} onChange={setStatus} className="h-9" />
        </div>
        <div>
          <FieldLabel>اولویت</FieldLabel>
          <PriorityPicker value={priority} onChange={setPriority} className="h-9" />
        </div>
        <div>
          <FieldLabel>هدف</FieldLabel>
          <GoalPicker
            value={goalId}
            goals={workspace?.goals ?? []}
            onChange={setGoalId}
            className="h-9"
          />
        </div>
      </div>

      <div>
        <FieldLabel>سررسید</FieldLabel>
        <DateField
          value={dueDate}
          onChange={setDueDate}
          ariaLabel="تاریخ سررسید تسک جدید"
          placeholder="بدون سررسید"
          triggerClassName="h-9"
        />
      </div>

      <DialogFooter className="pt-1">
        <Button type="button" variant="outline" onClick={onDone}>
          انصراف
        </Button>
        <Button type="submit" disabled={!title.trim() || busy}>
          <PlusIcon />
          {busy ? "در حال ساخت…" : "ساخت تسک"}
        </Button>
      </DialogFooter>
    </form>
  );
}

export function NewTaskDialog({
  open,
  onOpenChange,
  defaultStatus = "backlog",
  defaultAssigneeId = null,
  defaultGoalId = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultStatus?: TaskStatus;
  defaultAssigneeId?: string | null;
  defaultGoalId?: string | null;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent style={{ maxWidth: "32rem" }}>
        <DialogHeader>
          <DialogTitle>تسک جدید</DialogTitle>
          <DialogDescription>
            عنوان را بنویسید و مسئول، سررسید و هدف را مشخص کنید.
          </DialogDescription>
        </DialogHeader>
        <TaskForm
          key={`${defaultStatus}-${defaultAssigneeId ?? "none"}-${defaultGoalId ?? "none"}`}
          defaultStatus={defaultStatus}
          defaultAssigneeId={defaultAssigneeId}
          defaultGoalId={defaultGoalId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
