"use client";

import { useMemo } from "react";
import { BanIcon, TargetIcon } from "lucide-react";

import { MemberAvatar, UnassignedAvatar } from "@/components/member-avatar";
import { MenuSelect, type MenuOption } from "@/components/menu-select";
import {
  GOAL_STATUS_META,
  PRIORITY_META,
  STATUS_META,
} from "@/lib/labels";
import type { Goal, Member, Priority, TaskStatus } from "@/lib/types";

export const NONE = "none";

export function StatusPicker({
  value,
  onChange,
  className,
}: {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
  className?: string;
}) {
  const options: MenuOption[] = (Object.keys(STATUS_META) as TaskStatus[]).map(
    (status) => ({
      value: status,
      label: STATUS_META[status].label,
      leading: (
        <span
          className={`size-2 shrink-0 rounded-full ${STATUS_META[status].dot}`}
        />
      ),
      hint: STATUS_META[status].hint,
    }),
  );

  return (
    <MenuSelect
      value={value}
      options={options}
      onChange={(next) => onChange(next as TaskStatus)}
      className={className}
      ariaLabel="وضعیت تسک"
    />
  );
}

export function PriorityPicker({
  value,
  onChange,
  className,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
  className?: string;
}) {
  const options: MenuOption[] = (Object.keys(PRIORITY_META) as Priority[]).map(
    (priority) => ({
      value: priority,
      label: PRIORITY_META[priority].label,
      leading: (
        <span
          className={`h-3 w-1 shrink-0 rounded-full ${PRIORITY_META[priority].bar}`}
        />
      ),
    }),
  );

  return (
    <MenuSelect
      value={value}
      options={options}
      onChange={(next) => onChange(next as Priority)}
      className={className}
      ariaLabel="اولویت تسک"
    />
  );
}

export function AssigneePicker({
  value,
  members,
  onChange,
  className,
}: {
  value: string | null;
  members: Member[];
  onChange: (memberId: string | null) => void;
  className?: string;
}) {
  const options: MenuOption[] = [
    { value: NONE, label: "بدون مسئول", leading: <UnassignedAvatar size="xs" /> },
    ...members.map((member) => ({
      value: member.id,
      label: member.name,
      hint: member.role || undefined,
      leading: <MemberAvatar name={member.name} memberId={member.id} size="xs" />,
    })),
  ];

  return (
    <MenuSelect
      value={value ?? NONE}
      options={options}
      onChange={(next) => onChange(next === NONE ? null : next)}
      className={className}
      ariaLabel="مسئول تسک"
    />
  );
}

export function GoalPicker({
  value,
  goals,
  onChange,
  className,
}: {
  value: string | null;
  goals: Goal[];
  onChange: (goalId: string | null) => void;
  className?: string;
}) {
  const options: MenuOption[] = useMemo(
    () => [
      {
        value: NONE,
        label: "بدون هدف",
        leading: <BanIcon className="size-3.5 shrink-0 text-muted-foreground" />,
      },
      ...goals.map((goal) => ({
        value: goal.id,
        label: goal.title,
        hint: GOAL_STATUS_META[goal.status].label,
        leading: (
          <TargetIcon className="size-3.5 shrink-0 text-muted-foreground" />
        ),
      })),
    ],
    [goals],
  );

  return (
    <MenuSelect
      value={value ?? NONE}
      options={options}
      onChange={(next) => onChange(next === NONE ? null : next)}
      className={className}
      ariaLabel="هدف تسک"
    />
  );
}
