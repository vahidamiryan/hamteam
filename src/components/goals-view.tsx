"use client";

import * as React from "react";
import {
  CheckIcon,
  EllipsisIcon,
  PencilIcon,
  PlusIcon,
  TargetIcon,
  Trash2Icon,
} from "lucide-react";

import { GoalChip } from "@/components/chips";
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
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Field,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useWorkspace } from "@/components/workspace-provider";
import { formatDate, percentLabel } from "@/lib/dates";
import { goalProgress, sortTasks } from "@/lib/derived";
import { goalDescription, goalTitle, memberName } from "@/lib/locale-text";
import type { Goal, GoalStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function GoalsView({ onOpenTask }: { onOpenTask: (taskId: string) => void }) {
  const { locale, t, formatNumber } = useLocale();
  const { workspace, updateGoal, deleteGoal } = useWorkspace();
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<Goal | null>(null);
  const [removing, setRemoving] = React.useState<Goal | null>(null);

  if (!workspace) return null;
  const goals = workspace.goals;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold">{t("goals.heading")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("goals.description", { count: formatNumber(goals.length) })}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <PlusIcon data-icon="inline-start" />
          {t("action.newGoal")}
        </Button>
      </header>

      {goals.length === 0 ? (
        <Empty className="rounded-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <TargetIcon />
            </EmptyMedia>
            <EmptyTitle>{t("goals.empty")}</EmptyTitle>
            <EmptyDescription>{t("goals.emptyHint")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setCreating(true)}>
              {t("action.newGoal")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {goals.map((goal) => {
            const progress = goalProgress(workspace, goal.id);
            const owner =
              workspace.members.find((member) => member.id === goal.ownerId) ?? null;
            const goalTasks = sortTasks(
              workspace.tasks.filter((task) => task.goalId === goal.id),
            );

            return (
              <Card key={goal.id} className="gap-3">
                <CardHeader className="gap-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                        <TargetIcon className="size-4" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <CardTitle className="text-sm leading-6">
                          <span className="line-clamp-2">{goalTitle(locale, goal)}</span>
                        </CardTitle>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <GoalChip status={goal.status} />
                          {goal.targetDate ? (
                            <span className="text-[11px] text-muted-foreground tabular-nums">
                              {formatDate(locale, goal.targetDate)}
                            </span>
                          ) : null}
                          {owner ? (
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <MemberAvatar member={owner} size="sm" />
                              {memberName(locale, owner)}
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                        aria-label={t("action.more")}
                      >
                        <EllipsisIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            disabled={goal.status === "achieved"}
                            onClick={() =>
                              void updateGoal(goal.id, { status: "achieved" })
                            }
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

                  {goal.description || goal.descriptionEn ? (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {goalDescription(locale, goal)}
                    </p>
                  ) : null}
                </CardHeader>

                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>{t("goals.progress")}</span>
                    <span className="font-medium text-foreground tabular-nums">
                      {percentLabel(locale, progress.percent)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={cn(
                        "h-full rounded-full transition-[width]",
                        goal.status === "achieved"
                          ? "bg-status-done"
                          : "bg-status-progress",
                      )}
                      style={{ width: `${progress.percent}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {t("goals.tasksCount", {
                      done: formatNumber(progress.done),
                      total: formatNumber(progress.total),
                      blocked: formatNumber(progress.blocked),
                    })}
                  </p>

                  <div className="flex flex-col">
                    {goalTasks.length === 0 ? (
                      <p className="py-2 text-center text-[11px] text-muted-foreground">
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
                  </div>
                </CardContent>

                <CardFooter className="justify-end gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(goal)}>
                    <PencilIcon data-icon="inline-start" />
                    {t("action.edit")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 p-4 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            {t("goals.addCard")}
          </button>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-lg" style={{ maxWidth: "32rem" }}>
          <DialogHeader>
            <DialogTitle>{t("goals.newTitle")}</DialogTitle>
            <DialogDescription>{t("goals.emptyHint")}</DialogDescription>
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
        <DialogContent className="sm:max-w-lg" style={{ maxWidth: "32rem" }}>
          <DialogHeader>
            <DialogTitle>{t("goals.editTitle")}</DialogTitle>
            <DialogDescription>{t("goals.editTitle")}</DialogDescription>
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
    <form onSubmit={submit} className="flex flex-col gap-3">
      <FieldGroup className="gap-3">
        <div className="grid grid-cols-2 gap-2">
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

        <div className="grid grid-cols-2 gap-2">
          <Field orientation="horizontal" className="items-center gap-1.5">
            <FieldLabel className="w-12 shrink-0 text-xs text-muted-foreground">
              {t("goals.owner")}
            </FieldLabel>
            <AssigneePicker
              value={ownerId}
              members={members}
              onChange={setOwnerId}
            />
          </Field>
          <Field orientation="horizontal" className="items-center gap-1.5">
            <FieldLabel className="w-16 shrink-0 text-xs text-muted-foreground">
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
