"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { useLocale } from "@/components/locale-provider";
import { TaskCard } from "@/components/task-card";
import { Button } from "@/components/ui/button";
import { useWorkspace } from "@/components/workspace-provider";
import { filterTasks, type TaskFilterOptions } from "@/lib/derived";
import { STATUS_META, STATUS_ORDER } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { TaskStatus } from "@/lib/types";

export function BoardView({
  filters,
  onOpenTask,
  onAddTask,
}: {
  filters: TaskFilterOptions;
  onOpenTask: (taskId: string) => void;
  onAddTask: (status: TaskStatus) => void;
}) {
  const { t, formatNumber } = useLocale();
  const { workspace, updateTask } = useWorkspace();
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dropTarget, setDropTarget] = React.useState<TaskStatus | null>(null);

  if (!workspace) return null;

  const columns = STATUS_ORDER.map((status) => ({
    status,
    tasks: filterTasks(workspace, { ...filters, status }),
  }));

  const move = (taskId: string, status: TaskStatus) => {
    const task = workspace.tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;
    void updateTask(taskId, { status });
  };

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
                    dragging={draggingId === task.id}
                    onOpen={() => onOpenTask(task.id)}
                    onDragStart={(event) => {
                      event.dataTransfer.setData("text/task-id", task.id);
                      event.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDropTarget(null);
                    }}
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
