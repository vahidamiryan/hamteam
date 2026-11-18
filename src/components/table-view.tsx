"use client";

import * as React from "react";
import { CheckIcon, LayoutListIcon, Trash2Icon } from "lucide-react";

import { ActivityDot, DueStamp, PriorityDot, StatusChip } from "@/components/chips";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "@/components/ui/toast";
import { useWorkspaceActions, useWorkspaceIndex } from "@/components/workspace-provider";
import { TaskQuery, type TaskFilterOptions } from "@/lib/domain/task-query";
import { cn } from "@/lib/utils";
import { formatDateShort } from "@/lib/dates";
import { goalTitle, memberName, taskTitle } from "@/lib/locale-text";
import { STATUS_META } from "@/lib/labels";
import type { ActivityMap } from "@/lib/task-activity";
import type { Task } from "@/lib/types";

export function TableView({
  filters,
  onOpenTask,
  activity,
}: {
  filters: TaskFilterOptions;
  onOpenTask: (taskId: string) => void;
  activity?: ActivityMap;
}) {
  const { locale, t, formatNumber } = useLocale();
  const index = useWorkspaceIndex();
  const { updateTask, deleteTask } = useWorkspaceActions();
  const [selected, setSelected] = React.useState<string[]>([]);

  const tasks = React.useMemo(
    () =>
      index ? TaskQuery.from(filters, index, { activity }).select(index) : [],
    [index, filters, activity],
  );

  const visibleIds = React.useMemo(
    () => new Set(tasks.map((task) => task.id)),
    [tasks],
  );
  const selectedVisible = selected.filter((id) => visibleIds.has(id));
  const selectedSet = React.useMemo(() => new Set(selectedVisible), [selectedVisible]);
  const allSelected = tasks.length > 0 && selectedVisible.length === tasks.length;
  const someSelected = selectedVisible.length > 0 && !allSelected;

  const toggleAll = (checked: boolean) => {
    setSelected(checked ? tasks.map((task) => task.id) : []);
  };

  const toggleOne = (taskId: string, checked: boolean) => {
    setSelected((current) =>
      checked ? [...new Set([...current, taskId])] : current.filter((id) => id !== taskId),
    );
  };

  const markSelectedDone = async () => {
    const ids = selectedVisible;
    setSelected([]);
    for (const id of ids) {
      await updateTask(id, { status: "done" });
    }
    toast.add({
      title: t("toast.bulkDone", { count: formatNumber(ids.length) }),
      type: "success",
    });
  };

  const deleteSelected = async () => {
    const ids = selectedVisible;
    setSelected([]);
    for (const id of ids) {
      await deleteTask(id);
    }
  };

  if (!index) return null;

  return (
    <Card className="py-0">
      <CardContent className="px-0">
        {selectedVisible.length > 0 ? (
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <span className="text-xs font-medium tabular-nums">
              {t("table.selected", { count: formatNumber(selectedVisible.length) })}
            </span>
            <ButtonGroup className="ms-auto">
              <Button variant="outline" size="sm" onClick={() => void markSelectedDone()}>
                <CheckIcon data-icon="inline-start" />
                {t("table.markDone")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-destructive"
                onClick={() => void deleteSelected()}
              >
                <Trash2Icon data-icon="inline-start" />
                {t("action.delete")}
              </Button>
            </ButtonGroup>
          </div>
        ) : null}

        {tasks.length === 0 ? (
          <Empty className="border-0">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <LayoutListIcon />
              </EmptyMedia>
              <EmptyTitle>{t("table.empty")}</EmptyTitle>
              <EmptyDescription>{t("filter.noneHint")}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    indeterminate={someSelected}
                    onCheckedChange={(checked) => toggleAll(checked === true)}
                    aria-label={t("filter.all")}
                  />
                </TableHead>
                <TableHead className="min-w-56">{t("table.task")}</TableHead>
                <TableHead>{t("task.status")}</TableHead>
                <TableHead className="hidden md:table-cell">{t("task.priority")}</TableHead>
                <TableHead className="hidden sm:table-cell">{t("task.assignee")}</TableHead>
                <TableHead className="hidden lg:table-cell">{t("task.due")}</TableHead>
                <TableHead className="hidden xl:table-cell">{t("task.goal")}</TableHead>
                <TableHead className="w-16 text-center">{t("table.commentsShort")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.map((task) => {
                const assignee = index.member(task.assigneeId);
                const goal = index.goal(task.goalId);
                const comments = index.commentCount(task.id);
                const isSelected = selectedSet.has(task.id);
                return (
                  <TableRow
                    key={task.id}
                    data-state={isSelected ? "selected" : undefined}
                    className="cursor-pointer"
                    onClick={() => onOpenTask(task.id)}
                  >
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) =>
                          toggleOne(task.id, checked === true)
                        }
                        aria-label={taskTitle(locale, task)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <ActivityDot state={activity?.[task.id]} />
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onOpenTask(task.id);
                          }}
                          className="line-clamp-2 text-start text-sm font-medium underline-offset-4 outline-none hover:underline focus-visible:underline"
                        >
                          {taskTitle(locale, task)}
                        </button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusChip status={task.status} />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <PriorityDot priority={task.priority} />
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <span className="flex items-center gap-1.5">
                        <MemberAvatar member={assignee} size="sm" />
                        <span className="max-w-28 truncate text-xs text-muted-foreground">
                          {assignee ? memberName(locale, assignee) : t("task.unassigned")}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <DueStamp dueDate={task.dueDate} status={task.status} />
                    </TableCell>
                    <TableCell className="hidden max-w-40 truncate text-xs text-muted-foreground xl:table-cell">
                      {goal ? goalTitle(locale, goal) : "—"}
                    </TableCell>
                    <TableCell className="text-center text-xs text-muted-foreground tabular-nums">
                      {comments > 0 ? formatNumber(comments) : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

/** فهرست فشردهٔ تسک‌های یک عضو یا هدف (برای نماهای افراد و اهداف). */
export function MiniTaskRow({
  task,
  onOpen,
  meta,
}: {
  task: Task;
  onOpen: () => void;
  meta?: React.ReactNode;
}) {
  const { locale, t } = useLocale();
  const meta_ = STATUS_META[task.status];
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-md px-1 py-2 text-start text-xs outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/40"
    >
      <span
        className={cn("size-1.5 shrink-0 rounded-full", meta_.dot)}
        aria-label={t(meta_.labelKey)}
        role="img"
      />
      <span className="min-w-0 flex-1 truncate">{taskTitle(locale, task)}</span>
      <span className="shrink-0 text-muted-foreground tabular-nums">
        {task.dueDate ? formatDateShort(locale, task.dueDate) : t("date.noneDue")}
      </span>
      {meta}
    </button>
  );
}
