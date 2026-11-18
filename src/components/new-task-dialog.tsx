"use client";

import * as React from "react";

import { DateField } from "@/components/date-field";
import { useLocale } from "@/components/locale-provider";
import {
  AssigneePicker,
  GoalPicker,
  PriorityToggleGroup,
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkspace } from "@/components/workspace-provider";
import { STATUS_META, STATUS_ORDER } from "@/lib/labels";
import type { Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

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
  const { t } = useLocale();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="md:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("action.newTask")}</DialogTitle>
          <DialogDescription>{t("task.newDescription")}</DialogDescription>
        </DialogHeader>
        <TaskForm
          key={`${defaultStatus}:${defaultAssigneeId ?? ""}:${defaultGoalId ?? ""}`}
          defaultStatus={defaultStatus}
          defaultAssigneeId={defaultAssigneeId}
          defaultGoalId={defaultGoalId}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

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
  const { t } = useLocale();
  const { workspace, createTask } = useWorkspace();

  const [title, setTitle] = React.useState("");
  const [titleEn, setTitleEn] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [status, setStatus] = React.useState<TaskStatus>(defaultStatus);
  const [priority, setPriority] = React.useState<Priority>("medium");
  const [assigneeId, setAssigneeId] = React.useState<string | null>(defaultAssigneeId);
  const [goalId, setGoalId] = React.useState<string | null>(defaultGoalId);
  const [dueDate, setDueDate] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const members = workspace?.members ?? [];
  const goals = workspace?.goals ?? [];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    const result = await createTask({
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      description: description.trim(),
      status,
      priority,
      assigneeId,
      goalId,
      dueDate,
    });
    setSaving(false);
    if (result) {
      setTitle("");
      setTitleEn("");
      setDescription("");
      onDone();
    }
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel htmlFor="task-title">{t("task.title")}</FieldLabel>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("task.titlePlaceholder")}
              required
              autoFocus
              maxLength={160}
              dir="auto"
            />
          </Field>

          <Field className="gap-1.5">
            <FieldLabel htmlFor="task-title-en">Title (EN)</FieldLabel>
            <Input
              id="task-title-en"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="e.g. Prepare the weekly report"
              maxLength={160}
              dir="ltr"
            />
          </Field>
        </div>

        <Field className="gap-1.5">
          <FieldLabel htmlFor="task-description">{t("task.description")}</FieldLabel>
          <Textarea
            id="task-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("task.descriptionPlaceholder")}
            rows={2}
            maxLength={4000}
            dir="auto"
          />
        </Field>

        <Field className="gap-1.5">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("task.status")}
          </FieldLabel>
          <ToggleGroup
            value={[status]}
            onValueChange={(next) => {
              const [first] = next;
              if (first) setStatus(first as TaskStatus);
            }}
            spacing={0}
            variant="outline"
            size="sm"
            className="w-full"
            aria-label={t("task.status")}
          >
            {STATUS_ORDER.map((option) => (
              <ToggleGroupItem
                key={option}
                value={option}
                className="flex-1 gap-1.5 px-1"
              >
                <span
                  className={cn("size-1.5 rounded-full", STATUS_META[option].dot)}
                />
                <span className="truncate">{t(STATUS_META[option].labelKey)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Field>

        <Field className="gap-1.5">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("task.priority")}
          </FieldLabel>
          <PriorityToggleGroup value={priority} onChange={setPriority} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field className="gap-1.5">
            <FieldLabel className="text-xs text-muted-foreground">
              {t("task.assignee")}
            </FieldLabel>
            <AssigneePicker
              value={assigneeId}
              members={members}
              onChange={setAssigneeId}
            />
          </Field>
          <Field className="gap-1.5">
            <FieldLabel className="text-xs text-muted-foreground">
              {t("task.due")}
            </FieldLabel>
            <DateField
              value={dueDate}
              onChange={setDueDate}
              ariaLabel={t("task.due")}
              placeholder={t("date.noneDue")}
            />
          </Field>
        </div>

        {goals.length > 0 ? (
          <Field className="gap-1.5">
            <FieldLabel className="text-xs text-muted-foreground">
              {t("task.goal")}
            </FieldLabel>
            <GoalPicker value={goalId} goals={goals} onChange={setGoalId} />
          </Field>
        ) : null}
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("action.cancel")}
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {t("action.createTask")}
        </Button>
      </DialogFooter>
    </form>
  );
}
