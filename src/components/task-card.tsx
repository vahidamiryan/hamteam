"use client";

import * as React from "react";
import { CircleCheckIcon, MessageSquareIcon } from "lucide-react";

import { DueChip, GoalChip } from "@/components/chips";
import { MemberAvatar, UnassignedAvatar } from "@/components/member-avatar";
import { toFaDigits } from "@/lib/dates";
import { PRIORITY_META } from "@/lib/labels";
import type { Goal, Member, Task } from "@/lib/types";
import { cn } from "@/lib/utils";

export function TaskCard({
  task,
  assignee,
  goal,
  commentCount,
  isDragging,
  onOpen,
  onDragStart,
  onDragEnd,
}: {
  task: Task;
  assignee: Member | null;
  goal: Goal | null;
  commentCount: number;
  isDragging: boolean;
  onOpen: () => void;
  onDragStart: (event: React.DragEvent<HTMLElement>) => void;
  onDragEnd: () => void;
}) {
  const isBlocked = task.status === "blocked";
  const isDone = task.status === "done";

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
      aria-label={`تسک ${task.title}`}
      className={cn(
        "group relative cursor-pointer select-none rounded-xl border bg-card p-2.5 text-start shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition duration-150",
        "hover:-translate-y-px hover:border-foreground/15 hover:shadow-[0_8px_18px_-12px_rgba(16,24,40,0.35)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
        isBlocked && "border-rose-200/90 bg-rose-50/40",
        isDone && "opacity-75",
        isDragging && "scale-[0.98] opacity-40",
      )}
    >
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 h-8 w-[3px] shrink-0 rounded-full",
            PRIORITY_META[task.priority].bar,
          )}
          aria-hidden
        />
        <div className="min-w-0 flex-1">
          {goal ? <GoalChip goal={goal} className="mb-1.5" /> : null}

          <h3
            className={cn(
              "line-clamp-2 text-[0.86rem] font-medium leading-6",
              isDone && "text-muted-foreground line-through decoration-muted-foreground/40",
            )}
          >
            {task.title}
          </h3>

          {isBlocked && task.blockedReason ? (
            <p className="mt-1.5 line-clamp-2 rounded-md bg-rose-100/70 px-1.5 py-1 text-[11px] leading-5 text-rose-800">
              {task.blockedReason}
            </p>
          ) : null}

          <div className="mt-2 flex items-center gap-1.5">
            {isDone ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">
                <CircleCheckIcon className="size-3" />
                انجام شد
              </span>
            ) : (
              <DueChip dueDate={task.dueDate} />
            )}
            {task.priority === "urgent" && !isDone ? (
              <span className="rounded-md bg-rose-100 px-1.5 py-0.5 text-[10px] font-semibold text-rose-700">
                فوری
              </span>
            ) : null}
            <span className="ms-auto flex items-center gap-1.5">
              {commentCount > 0 ? (
                <span className="inline-flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <MessageSquareIcon className="size-3.5" />
                  {toFaDigits(commentCount)}
                </span>
              ) : null}
              {assignee ? (
                <MemberAvatar
                  name={assignee.name}
                  memberId={assignee.id}
                  size="sm"
                  className="ring-2 ring-card"
                />
              ) : (
                <UnassignedAvatar size="sm" className="bg-card" />
              )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}
