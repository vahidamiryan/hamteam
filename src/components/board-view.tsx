"use client";

import * as React from "react";
import { PlusIcon } from "lucide-react";

import { TaskCard } from "@/components/task-card";
import { useWorkspace } from "@/components/workspace-provider";
import { toFaDigits } from "@/lib/dates";
import { filterTasks } from "@/lib/derived";
import { BOARD_COLUMNS, STATUS_META } from "@/lib/labels";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

function QuickAdd({
  status,
  onCreate,
}: {
  status: TaskStatus;
  onCreate: (status: TaskStatus, title: string) => Promise<boolean>;
}) {
  const [value, setValue] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  return (
    <form
      className="mt-0.5"
      onSubmit={async (event) => {
        event.preventDefault();
        const title = value.trim();
        if (!title || busy) return;
        setBusy(true);
        const created = await onCreate(status, title);
        setBusy(false);
        if (created) setValue("");
      }}
    >
      <div className="flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1.5 transition-colors hover:border-border/70 hover:bg-background/70 focus-within:border-border focus-within:bg-background">
        <PlusIcon className="size-3.5 shrink-0 text-muted-foreground" />
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          disabled={busy}
          placeholder={`افزودن به ${STATUS_META[status].label}…`}
          aria-label={`افزودن تسک به ${STATUS_META[status].label}`}
          className="h-6 w-full min-w-0 bg-transparent text-[0.8rem] outline-none placeholder:text-muted-foreground/70 disabled:opacity-60"
        />
      </div>
    </form>
  );
}

export function BoardView({
  search,
  assigneeId,
  onOpenTask,
  onCreateTask,
}: {
  search: string;
  assigneeId: string | null;
  onOpenTask: (taskId: string) => void;
  onCreateTask: (status: TaskStatus, title: string) => Promise<boolean>;
}) {
  const { workspace, updateTask } = useWorkspace();
  const [draggingId, setDraggingId] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState<TaskStatus | null>(null);

  if (!workspace) return null;

  const handleDrop = async (status: TaskStatus, event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(null);
    const taskId = event.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    if (!taskId) return;

    const task = workspace.tasks.find((item) => item.id === taskId);
    if (!task || task.status === status) return;

    await updateTask(taskId, { status }, { success: `به «${STATUS_META[status].label}» منتقل شد` });
    // برای ثبت دلیل مسدودی، تسک باز می‌شود.
    if (status === "blocked" && !task.blockedReason) onOpenTask(taskId);
  };

  return (
    <div className="flex gap-3 overflow-x-auto pb-3 xl:gap-4">
      {BOARD_COLUMNS.map((status) => {
        const meta = STATUS_META[status];
        const tasks = filterTasks(workspace, { status, search, assigneeId });
        const isTarget = dragOver === status;

        return (
          <section
            key={status}
            aria-label={meta.label}
            onDragOver={(event) => {
              event.preventDefault();
              event.dataTransfer.dropEffect = "move";
              setDragOver(status);
            }}
            onDragLeave={(event) => {
              if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
              setDragOver(null);
            }}
            onDrop={(event) => void handleDrop(status, event)}
            className={cn(
              "flex w-[19rem] shrink-0 flex-col rounded-2xl border border-border/70 bg-muted/30 transition-colors xl:w-auto xl:flex-1",
              isTarget && "border-primary/40 bg-primary/[0.04] ring-2 ring-primary/10",
            )}
          >
            <header className="flex items-center gap-2 px-3 pt-2.5 pb-1.5">
              <span className={cn("size-2 rounded-full", meta.dot)} aria-hidden />
              <h2 className="text-[0.78rem] font-semibold">{meta.label}</h2>
              <span className="rounded-full bg-background px-1.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/70">
                {toFaDigits(tasks.length)}
              </span>
            </header>

            <div className="flex max-h-[calc(100dvh-17rem)] min-h-24 flex-col gap-2 overflow-y-auto p-2">
              {tasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  assignee={
                    workspace.members.find((member) => member.id === task.assigneeId) ?? null
                  }
                  goal={workspace.goals.find((goal) => goal.id === task.goalId) ?? null}
                  commentCount={
                    workspace.comments.filter((comment) => comment.taskId === task.id).length
                  }
                  isDragging={draggingId === task.id}
                  onOpen={() => onOpenTask(task.id)}
                  onDragStart={(event) => {
                    event.dataTransfer.effectAllowed = "move";
                    event.dataTransfer.setData("text/plain", task.id);
                    setDraggingId(task.id);
                  }}
                  onDragEnd={() => {
                    setDraggingId(null);
                    setDragOver(null);
                  }}
                />
              ))}

              {tasks.length === 0 ? (
                <div
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-xl border border-dashed border-border/70 px-3 py-6 text-center text-[11px] text-muted-foreground",
                    isTarget && "border-primary/40 text-primary",
                  )}
                >
                  {isTarget ? "برای انتقال، اینجا رها کنید" : "تسکی در این وضعیت نیست"}
                </div>
              ) : null}

              {status !== "done" ? (
                <QuickAdd status={status} onCreate={onCreateTask} />
              ) : null}
            </div>
          </section>
        );
      })}
    </div>
  );
}
