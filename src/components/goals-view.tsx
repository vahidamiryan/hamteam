"use client";

import * as React from "react";
import {
  CheckIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { GoalStatusDot } from "@/components/chips";
import { DateField } from "@/components/date-field";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { AssigneePicker, GoalStatusToggleGroup } from "@/components/pickers";
import { MiniTaskRow } from "@/components/table-view";
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
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/workspace-provider";
import { formatDateShort, percentLabel } from "@/lib/dates";
import { goalProgress, sortTasks } from "@/lib/derived";
import { goalDescription, goalTitle, memberName } from "@/lib/locale-text";
import type { Goal, GoalStatus } from "@/lib/types";

export function GoalsView({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const { locale, t, formatNumber } = useLocale();
  const { workspace, updateGoal, deleteGoal } = useWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [removing, setRemoving] = React.useState<Goal | null>(null);

  if (!workspace) return null;
  const goals = workspace.goals;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{t("goals.heading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("goals.description", { count: formatNumber(goals.length) })}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
          {goals.map((goal) => {
            const progress = goalProgress(workspace, goal.id);
            const owner =
              workspace.members.find((member) => member.id === goal.ownerId) ?? null;
            const goalTasks = sortTasks(
              workspace.tasks.filter((task) => task.goalId === goal.id),
            );
            const achieved = goal.status === "achieved";

            return (
              <Card key={goal.id} className="gap-4">
                <CardHeader className="gap-2">
                  <div className="flex items-start gap-2">
                    <div className="min-w-0 flex-1">
                      <CardTitle className="text-sm leading-6 font-medium">
                        <span className="line-clamp-2">{goalTitle(locale, goal)}</span>
                      </CardTitle>
                      {goal.description || goal.descriptionEn ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                          {goalDescription(locale, goal)}
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                        aria-label={t("action.more")}
                        className="-me-1 text-muted-foreground"
                      >
                        <EllipsisIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            disabled={achieved}
                            onClick={() => void updateGoal(goal.id, { status: "achieved" })}
                          >
                            <CheckIcon data-icon="inline-start" />
                            {t("action.markAchieved")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditing(goal)}>
                            <PencilIcon data-icon="inline-start" />
                            {t("action.edit")}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setRemoving(goal)}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          {t("action.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <GoalStatusDot status={goal.status} />
                    {owner ? (
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MemberAvatar member={owner} size="sm" />
                        {memberName(locale, owner)}
                      </span>
                    ) : null}
                    {goal.targetDate ? (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {formatDateShort(locale, goal.targetDate)}
                      </span>
                    ) : null}
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="text-muted-foreground tabular-nums">
                      {t("goals.tasksCount", {
                        done: formatNumber(progress.done),
                        total: formatNumber(progress.total),
                        blocked: formatNumber(progress.blocked),
                      })}
                    </span>
                    <span className="font-medium tabular-nums">
                      {percentLabel(locale, progress.percent)}
                    </span>
                  </div>
                  <Progress
                    value={progress.percent}
                    aria-label={t("goals.progress")}
                    className="gap-0 [&_[data-slot=progress-indicator]]:transition-none"
                  >
                    <span className="sr-only">
                      {percentLabel(locale, progress.percent)}
                    </span>
                  </Progress>
                  {achieved ? (
                    <div className="flex items-center gap-1.5 text-xs text-status-done">
                      <CheckIcon className="size-3.5" aria-hidden="true" />
                      {t("goalStatus.achieved")}
                    </div>
                  ) : null}
                </CardContent>

                <CardContent className="flex flex-col border-t">
                  {goalTasks.length === 0 ? (
                    <p className="py-3 text-center text-xs text-muted-foreground">
                      {t("goals.noTasks")}
                    </p>
                  ) : (
                    goalTasks
                      .slice(0, 4)
                      .map((task) => (
                        <MiniTaskRow
                          key={task.id}
                          task={task}
                          onOpen={() => onOpenTask(task.id)}
                        />
                      ))
                  )}
                </CardContent>

                <CardFooter className="justify-end gap-2 border-t bg-transparent px-3 py-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(goal)}>
                    <PencilIcon data-icon="inline-start" />
                    {t("action.edit")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          <Button
            variant="outline"
            onClick={() => setCreating(true)}
            className="h-full min-h-40 flex-col gap-2 border-dashed bg-transparent font-normal text-muted-foreground hover:text-foreground"
          >
            <PlusIcon />
            {t("goals.addCard")}
          </Button>
        </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("goals.newTitle")}</DialogTitle>
            <DialogDescription>{t("goals.newDescription")}</DialogDescription>
          </DialogHeader>
          <GoalForm key="new" goal={null} onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="md:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("goals.editTitle")}</DialogTitle>
            <DialogDescription>{t("goals.editDescription")}</DialogDescription>
          </DialogHeader>
          {editing ? (
            <GoalForm key={editing.id} goal={editing} onDone={() => setEditing(null)} />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("goals.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("goals.deleteDescription")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) void deleteGoal(removing.id);
                setRemoving(null);
              }}
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function GoalForm({ goal, onDone }: { goal: Goal | null; onDone: () => void }) {
  const { t } = useLocale();
  const { workspace, createGoal, updateGoal } = useWorkspace();
  const [title, setTitle] = React.useState(goal?.title ?? "");
  const [titleEn, setTitleEn] = React.useState(goal?.titleEn ?? "");
  const [description, setDescription] = React.useState(goal?.description ?? "");
  const [descriptionEn, setDescriptionEn] = React.useState(goal?.descriptionEn ?? "");
  const [ownerId, setOwnerId] = React.useState<string | null>(goal?.ownerId ?? null);
  const [targetDate, setTargetDate] = React.useState<string | null>(
    goal?.targetDate ?? null,
  );
  const [status, setStatus] = React.useState<GoalStatus>(goal?.status ?? "active");
  const [saving, setSaving] = React.useState(false);

  const members = workspace?.members ?? [];

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim() || saving) return;
    setSaving(true);
    const payload = {
      title: title.trim(),
      titleEn: titleEn.trim() || undefined,
      description: description.trim(),
      descriptionEn: descriptionEn.trim() || undefined,
      ownerId,
      targetDate,
      status,
    };
    const result = goal
      ? await updateGoal(goal.id, payload)
      : await createGoal(payload);
    setSaving(false);
    if (result) onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field className="gap-1">
            <FieldLabel htmlFor="goal-title">{t("goals.title")}</FieldLabel>
            <Input
              id="goal-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t("goals.titlePlaceholder")}
              required
              maxLength={140}
              dir="auto"
            />
          </Field>
          <Field className="gap-1">
            <FieldLabel htmlFor="goal-title-en">Title (EN)</FieldLabel>
            <Input
              id="goal-title-en"
              value={titleEn}
              onChange={(event) => setTitleEn(event.target.value)}
              placeholder="Ship version 1.0"
              maxLength={140}
              dir="ltr"
            />
          </Field>
        </div>

        <Field className="gap-1">
          <FieldLabel htmlFor="goal-description">
            {t("goals.descriptionLabel")}
          </FieldLabel>
          <Textarea
            id="goal-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder={t("goals.descriptionPlaceholder")}
            rows={2}
            maxLength={2000}
            dir="auto"
          />
        </Field>

        <Field className="gap-1">
          <FieldLabel htmlFor="goal-description-en">Description (EN)</FieldLabel>
          <Textarea
            id="goal-description-en"
            value={descriptionEn}
            onChange={(event) => setDescriptionEn(event.target.value)}
            placeholder="What does this goal achieve?"
            rows={2}
            maxLength={2000}
            dir="ltr"
          />
        </Field>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field className="gap-1">
            <FieldLabel className="text-xs text-muted-foreground">
              {t("goals.owner")}
            </FieldLabel>
            <AssigneePicker
              value={ownerId}
              members={members}
              onChange={setOwnerId}
            />
          </Field>
          <Field className="gap-1">
            <FieldLabel className="text-xs text-muted-foreground">
              {t("goals.target")}
            </FieldLabel>
            <DateField
              value={targetDate}
              onChange={setTargetDate}
              ariaLabel={t("goals.target")}
              placeholder={t("date.none")}
            />
          </Field>
        </div>

        <Field className="gap-1">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("goals.status")}
          </FieldLabel>
          <GoalStatusToggleGroup value={status} onChange={setStatus} />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("action.cancel")}
        </Button>
        <Button type="submit" disabled={saving || !title.trim()}>
          {t("action.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
