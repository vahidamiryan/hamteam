"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { useWorkspaceActions, useWorkspaceIndex } from "@/components/workspace-provider";
import { TaskQuery, type TaskFilterOptions } from "@/lib/domain/task-query";
import { STATUS_META, STATUS_ORDER } from "@/lib/labels";
import type { ActivityMap } from "@/lib/task-activity";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export function BoardView({
  filters,
  onOpenTask,
  onAddTask,
  activity,
}: {
  filters: TaskFilterOptions;
  onOpenTask: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
  activity?: ActivityMap;
}) {
  const { t, formatNumber } = useLocale();
  const index = useWorkspaceIndex();
  const { updateTask } = useWorkspaceActions();
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<TaskStatus | null>(null);

  // ستون‌ها فقط وقتی فیلتر، داده یا وضعیت فعالیت تغییر کند دوباره محاسبه می‌شوند.
  const columns = React.useMemo(() => {
    if (!index) return [];
    return STATUS_ORDER.map((status) => ({
      status,
      tasks: TaskQuery.from({ ...filters, status }, index, { activity }).select(index),
    }));
  }, [index, filters, activity]);

  const move = React.useCallback(
    (taskId: string, status: TaskStatus) => {
      const task = index?.task(taskId);
      if (!task || task.status === status) return;
      void updateTask(taskId, { status });
    },
    [index, updateTask],
  );

  const handleDragStart = React.useCallback(
    (event: React.DragEvent<HTMLElement>, taskId: string) => {
      event.dataTransfer.setData("text/task-id", taskId);
      event.dataTransfer.effectAllowed = "move";
      setDraggingId(taskId);
    },
    [],
  );

  const handleDragEnd = React.useCallback(() => {
    setDraggingId(null);
    setDropTarget(null);
  }, []);

  if (!index) return null;

  return (
    <div className="grid grid-cols-1 items-start gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {columns.map(({ status, tasks }) => {
        const meta = STATUS_META[status];
        const isTarget = dropTarget === status;
        return (
          <section
            key={status}
            aria-label={t(meta.labelKey)}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              if (dropTarget !== status) setDropTarget(status);
            }}
            onDragLeave={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                setDropTarget(null);
              }
            }}
            onDrop={(event) => {
              event.preventDefault();
              const taskId = event.dataTransfer.getData("text/task-id") || draggingId;
              setDropTarget(null);
              setDraggingId(null);
              if (taskId) move(taskId, status);
            }}
            className={cn(
              "flex min-h-24 flex-col gap-2 rounded-lg bg-muted/60 p-2 transition-colors sm:min-h-32",
              isTarget && "bg-accent",
            )}
          >
            <header className="flex items-center gap-2 px-1 py-0.5">
              <span className={cn("size-1.5 rounded-full", meta.dot)} aria-hidden="true" />
              <h2 className="text-sm font-medium">{t(meta.labelKey)}</h2>
              <span className="text-xs text-muted-foreground tabular-nums">
                {formatNumber(tasks.length)}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                className="ms-auto text-muted-foreground"
                aria-label={t("board.addTo", { status: t(meta.labelKey) })}
                title={t("board.addTo", { status: t(meta.labelKey) })}
                onClick={() => onAddTask(status)}
              >
                <PlusIcon />
              </Button>
            </header>

            {tasks.length === 0 ? (
              <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border px-3 py-5 text-center text-xs text-muted-foreground">
                {t(meta.hintKey)}
              </div>
            ) : (
              <div className="flex flex-1 flex-col gap-2">
                {tasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    assignee={index.member(task.assigneeId)}
                    goal={index.goal(task.goalId)}
                    commentCount={index.commentCount(task.id)}
                    activity={activity?.[task.id]}
                    dragging={draggingId === task.id}
                    onOpen={onOpenTask}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
