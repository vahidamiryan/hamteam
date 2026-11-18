"use client";

import * as React from "react";
import { CheckIcon, ChevronsUpDownIcon, UserRoundIcon } from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useLocale } from "@/components/locale-provider";
import {
  GOAL_STATUS_META,
  PRIORITY_META,
  PRIORITY_ORDER,
  STATUS_META,
  STATUS_ORDER,
} from "@/lib/labels";
import { memberName, memberRole, goalTitle } from "@/lib/locale-text";
import type { Goal, GoalStatus, Member, Priority, TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Option<T extends string> = {
  value: T;
  label: string;
  leading?: React.ReactNode;
};

function OptionDropdown<T extends string>({
  value,
  options,
  onChange,
  placeholder,
  ariaLabel,
  className,
  label,
}: {
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  label?: string;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        render={<Button variant="outline" size="sm" />}
        className={cn("w-full justify-between font-normal", className)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected?.leading}
          <span className="truncate">
            {selected ? selected.label : placeholder}
          </span>
        </span>
        <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-52">
        <DropdownMenuGroup>
          {label ? <DropdownMenuLabel>{label}</DropdownMenuLabel> : null}
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              onClick={() => onChange(option.value)}
              className="gap-2"
            >
              {option.leading}
              <span className="truncate">{option.label}</span>
              {option.value === value ? (
                <CheckIcon data-icon="inline-end" className="ms-auto text-foreground" />
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function StatusPicker({
  value,
  onChange,
  className,
}: {
  value: TaskStatus;
  onChange: (value: TaskStatus) => void;
  className?: string;
}) {
  const { t } = useLocale();
  const options = STATUS_ORDER.map<Option<TaskStatus>>((status) => ({
    value: status,
    label: t(STATUS_META[status].labelKey),
    leading: (
      <span className={cn("size-2 rounded-full", STATUS_META[status].dot)} />
    ),
  }));

  return (
    <OptionDropdown
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={t("task.status")}
      className={className}
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
  const { t } = useLocale();
  const options = PRIORITY_ORDER.map<Option<Priority>>((priority) => ({
    value: priority,
    label: t(PRIORITY_META[priority].labelKey),
    leading: (
      <span className={cn("size-2 rounded-full", PRIORITY_META[priority].dot)} />
    ),
  }));

  return (
    <OptionDropdown
      value={value}
      options={options}
      onChange={onChange}
      ariaLabel={t("task.priority")}
      className={className}
    />
  );
}

/** انتخاب اولویت به شکل مجموعهٔ دکمه‌ها (۲ تا ۷ گزینه). */
export function PriorityToggleGroup({
  value,
  onChange,
  className,
}: {
  value: Priority;
  onChange: (value: Priority) => void;
  className?: string;
}) {
  const { t } = useLocale();
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const [first] = next;
        if (first) onChange(first as Priority);
      }}
      spacing={0}
      variant="outline"
      size="sm"
      className={cn("w-full", className)}
      aria-label={t("task.priority")}
    >
      {PRIORITY_ORDER.map((priority) => (
        <ToggleGroupItem key={priority} value={priority} className="flex-1 gap-1.5">
          <span className={cn("size-1.5 rounded-full", PRIORITY_META[priority].dot)} />
          {t(PRIORITY_META[priority].labelKey)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function GoalStatusToggleGroup({
  value,
  onChange,
  className,
}: {
  value: GoalStatus;
  onChange: (value: GoalStatus) => void;
  className?: string;
}) {
  const { t } = useLocale();
  const statuses: GoalStatus[] = ["active", "achieved", "paused"];
  return (
    <ToggleGroup
      value={[value]}
      onValueChange={(next) => {
        const [first] = next;
        if (first) onChange(first as GoalStatus);
      }}
      spacing={0}
      variant="outline"
      size="sm"
      className={cn("w-full", className)}
      aria-label={t("goals.status")}
    >
      {statuses.map((status) => (
        <ToggleGroupItem key={status} value={status} className="flex-1 gap-1.5">
          <span className={cn("size-1.5 rounded-full", GOAL_STATUS_META[status].dot)} />
          {t(GOAL_STATUS_META[status].labelKey)}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

export function GoalPicker({
  value,
  goals,
  onChange,
  className,
}: {
  value: string | null;
  goals: readonly Goal[];
  onChange: (value: string | null) => void;
  className?: string;
}) {
  const { locale, t } = useLocale();
  const options: Option<string>[] = [
    { value: "__none", label: t("task.noGoal") },
    ...goals.map((goal) => ({ value: goal.id, label: goalTitle(locale, goal) })),
  ];

  return (
    <OptionDropdown
      value={value ?? "__none"}
      options={options}
      onChange={(next) => onChange(next === "__none" ? null : next)}
      ariaLabel={t("task.goal")}
      className={className}
      label={t("task.goal")}
    />
  );
}

/** انتخاب مسئول با جست‌وجو (Command داخل Popover). */
export function AssigneePicker({
  value,
  members,
  onChange,
  className,
  allowEmpty = true,
}: {
  value: string | null;
  members: readonly Member[];
  onChange: (value: string | null) => void;
  className?: string;
  allowEmpty?: boolean;
}) {
  const { locale, t } = useLocale();
  const [open, setOpen] = React.useState(false);
  const selected = members.find((member) => member.id === value) ?? null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={t("task.assignee")}
        render={<Button variant="outline" size="sm" />}
        className={cn("w-full justify-between font-normal", className)}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {selected ? (
            <>
              <MemberAvatar member={selected} size="sm" />
              <span className="truncate">{memberName(locale, selected)}</span>
            </>
          ) : (
            <>
              <UserRoundIcon data-icon="inline-start" className="text-muted-foreground" />
              <span className="truncate text-muted-foreground">
                {t("task.unassigned")}
              </span>
            </>
          )}
        </span>
        <ChevronsUpDownIcon data-icon="inline-end" className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <Command>
          <CommandInput placeholder={t("filter.assignee")} />
          <CommandList>
            <CommandEmpty>{t("filter.none")}</CommandEmpty>
            <CommandGroup>
              {members.map((member) => (
                <CommandItem
                  key={member.id}
                  value={`${memberName(locale, member)} ${memberRole(locale, member)}`}
                  onSelect={() => {
                    onChange(member.id);
                    setOpen(false);
                  }}
                  className="gap-2"
                >
                  <MemberAvatar member={member} size="sm" />
                  <span className="flex min-w-0 flex-col">
                    <span className="truncate">{memberName(locale, member)}</span>
                    <span className="truncate text-xs text-muted-foreground">
                      {memberRole(locale, member)}
                    </span>
                  </span>
                  {member.id === value ? (
                    <CheckIcon data-icon="inline-end" className="ms-auto" />
                  ) : null}
                </CommandItem>
              ))}
            </CommandGroup>
            {allowEmpty ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    value="__unassigned"
                    onSelect={() => {
                      onChange(null);
                      setOpen(false);
                    }}
                    className="gap-2"
                  >
                    <UserRoundIcon className="text-muted-foreground" />
                    {t("task.unassigned")}
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
