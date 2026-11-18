"use client";

import * as React from "react";
import { MessageSquareIcon } from "lucide-react";

import { DueChip, DoneChip, GoalTag, PriorityChip } from "@/components/chips";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { useWorkspace } from "@/components/workspace-provider";
import { goalTitle, memberName, taskBlocker, taskTitle } from "@/lib/locale-text";
import { cn } from "@/lib/utils";
import type { Task } from "@/lib/types";

export function TaskCard({
  task,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
  className,
}: {
  task: Task;
  onOpen: () => void;
  onDragStart?: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  className?: string;
}) {
  const { locale, t, formatNumber } = useLocale();
  const { workspace } = useWorkspace();

  const assignee =
    workspace?.members.find((member) => member.id === task.assigneeId) ?? null;
  const goal = workspace?.goals.find((item) => item.id === task.goalId) ?? null;
  const commentCount =
    workspace?.comments.filter((comment) => comment.taskId === task.id).length ?? 0;
  const blocker = taskBlocker(locale, task);

  return (
    <article
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen();
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={t("action.openTask")}
      data-dragging={dragging ? "true" : undefined}
      className={cn(
        "group/card cursor-grab rounded-xl border border-border/80 bg-card p-3 text-start shadow-xs transition-[box-shadow,border-color,transform,opacity] outline-none select-none",
        "hover:border-ring/50 hover:shadow-sm focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40",
        "data-dragging:opacity-40 active:cursor-grabbing",
        className,
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 text-base leading-6 font-semibold">
          {taskTitle(locale, task)}
        </h3>
        {task.status === "done" ? <DoneChip className="shrink-0" /> : null}
      </div>

      {task.status === "blocked" && blocker ? (
        <p className="mt-2 line-clamp-2 rounded-md bg-status-blocked/10 px-2 py-1 text-xs leading-5 text-status-blocked">
          {blocker}
        </p>
      ) : null}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <PriorityChip priority={task.priority} />
        {task.status !== "done" ? <DueChip dueDate={task.dueDate} /> : null}
        {goal ? <GoalTag title={goalTitle(locale, goal)} /> : null}
      </div>

      <div className="mt-2.5 flex items-center justify-between gap-2 border-t border-border/70 pt-2">
        <div className="flex min-w-0 items-center gap-1.5">
          <MemberAvatar member={assignee} size="sm" withCard />
          <span className="truncate text-xs text-muted-foreground">
            {assignee ? memberName(locale, assignee) : t("task.unassigned")}
          </span>
        </div>
        {commentCount > 0 ? (
          <span className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground tabular-nums">
            <MessageSquareIcon className="size-3.5" aria-hidden="true" />
            {formatNumber(commentCount)}
          </span>
        ) : null}
      </div>
    </article>
  );
}
