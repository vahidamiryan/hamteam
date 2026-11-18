"use client";

import * as React from "react";

import { DueStamp, DoneChip, GoalTag, PriorityDot } from "@/components/chips";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  const isDone = task.status === "done";

  return (
    <Card
      size="sm"
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
        "cursor-grab gap-2.5 text-start transition-colors outline-none select-none",
        "ring-foreground/8 hover:ring-foreground/15 focus-visible:ring-2 focus-visible:ring-ring",
        "data-dragging:opacity-40 active:cursor-grabbing",
        className,
      )}
    >
      <CardHeader className="gap-1.5">
        <CardTitle className="line-clamp-2 text-sm leading-6 font-medium break-words">
          {taskTitle(locale, task)}
        </CardTitle>
        {task.status === "blocked" && blocker ? (
          <p className="line-clamp-2 border-s-2 border-status-blocked/40 ps-2 text-xs leading-5 text-status-blocked">
            {blocker}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-wrap items-center gap-x-3 gap-y-1">
        {isDone ? (
          <DoneChip />
        ) : (
          <>
            <PriorityDot priority={task.priority} />
            {goal ? <GoalTag title={goalTitle(locale, goal)} className="max-w-40" /> : null}
            {commentCount > 0 ? (
              <span className="text-xs text-muted-foreground tabular-nums">
                {t("task.commentsCount", { count: formatNumber(commentCount) })}
              </span>
            ) : null}
          </>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t bg-transparent px-3 py-2">
        <span className="flex min-w-0 items-center gap-1.5">
          <MemberAvatar member={assignee} size="sm" withCard />
          <span className="truncate text-xs text-muted-foreground">
            {assignee ? memberName(locale, assignee) : t("task.unassigned")}
          </span>
        </span>
        <DueStamp
          dueDate={task.dueDate}
          status={task.status}
          className="shrink-0"
        />
      </CardFooter>
    </Card>
  );
}
