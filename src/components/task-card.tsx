"use client";

import * as React from "react";
import { AtSignIcon } from "lucide-react";

import { ActivityDot, DueStamp, DoneChip, GoalTag, PriorityDot } from "@/components/chips";
import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { goalTitle, memberName, taskBlocker, taskTitle } from "@/lib/locale-text";
import type { TaskActivityState } from "@/lib/task-activity";
import { cn } from "@/lib/utils";
import type { Goal, Member, Task } from "@/lib/types";

type TaskCardProps = {
  task: Task;
  /** عضو، هدف و شمار گفت‌وگو از ایندکس فضای کاری می‌آیند تا کارت جست‌وجو نکند. */
  assignee?: Member | null;
  goal?: Goal | null;
  commentCount?: number;
  onOpen: (taskId: string) => void;
  onDragStart?: (event: React.DragEvent<HTMLElement>, taskId: string) => void;
  onDragEnd?: () => void;
  dragging?: boolean;
  activity?: TaskActivityState;
  className?: string;
};

function TaskCardView({
  task,
  assignee = null,
  goal = null,
  commentCount = 0,
  onOpen,
  onDragStart,
  onDragEnd,
  dragging,
  activity,
  className,
}: TaskCardProps) {
  const { locale, t, formatNumber } = useLocale();
  const blocker = taskBlocker(locale, task);
  const isDone = task.status === "done";

  return (
    <Card
      size="sm"
      draggable
      onDragStart={onDragStart ? (event) => onDragStart(event, task.id) : undefined}
      onDragEnd={onDragEnd}
      onClick={() => onOpen(task.id)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onOpen(task.id);
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
        {activity?.hasUnreadMention ? (
          <span className="inline-flex items-center gap-1 text-xs text-status-pending">
            <AtSignIcon className="size-3.5" aria-hidden="true" />
            {t("task.mentionedYou")}
          </span>
        ) : null}

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
        <ActivityDot state={activity} />
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

/**
 * مقایسهٔ دستی: بوستهٔ داده هر تغییر یک شیء تازه برای همهٔ تسک‌ها می‌سازد، ولی
 * کارت فقط وقتی باید دوباره رندر شود که تسکش یا نشانگرهایش عوض شده باشد.
 */
function sameCard(a: TaskCardProps, b: TaskCardProps): boolean {
  return (
    a.task === b.task &&
    a.assignee === b.assignee &&
    a.goal === b.goal &&
    a.commentCount === b.commentCount &&
    a.dragging === b.dragging &&
    a.onOpen === b.onOpen &&
    a.onDragStart === b.onDragStart &&
    a.onDragEnd === b.onDragEnd &&
    a.className === b.className &&
    a.activity?.hasChanges === b.activity?.hasChanges &&
    a.activity?.hasUnreadMention === b.activity?.hasUnreadMention
  );
}

export const TaskCard = React.memo(TaskCardView, sameCard);
