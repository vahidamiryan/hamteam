"use client";

import * as React from "react";
import { CheckCheckIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { useWorkspaceIndex, useWorkspaceState } from "@/components/workspace-provider";
import type { TaskFilterOptions } from "@/lib/domain/task-query";
import { memberName } from "@/lib/locale-text";
import { cn } from "@/lib/utils";

/**
 * نوار فیلتر: یک جست‌وجو و یک منو.
 * همهٔ شرط‌ها (مسئول، تغییرات جدید، منشن‌ها، سررسید) داخل همان منو هستند تا
 * نوار بالای برد به چند دکمهٔ موازی تبدیل نشود.
 */
export function FilterBar({
  filters,
  onChange,
  resultCount,
  unreadCount = 0,
  mentionCount = 0,
  onMarkAllSeen,
  className,
}: {
  filters: TaskFilterOptions;
  onChange: (next: TaskFilterOptions) => void;
  resultCount: number;
  unreadCount?: number;
  mentionCount?: number;
  onMarkAllSeen?: () => void;
  className?: string;
}) {
  const { locale, t, formatNumber } = useLocale();
  const index = useWorkspaceIndex();
  const { currentUserId } = useWorkspaceState();

  // ورودی جست‌وجو کنترل‌شده و بدون state موازی است؛ کندی رندر با
  // `useDeferredValue` در پوسته گرفته می‌شود، نه با تایمر.
  const search = filters.search ?? "";
  const setSearch = (value: string) => onChange({ ...filters, search: value });

  const members = index?.membersList ?? [];
  const selectedMember = index?.member(filters.assigneeId) ?? null;
  const activeCount =
    (filters.assigneeId ? 1 : 0) +
    (filters.onlyOverdue ? 1 : 0) +
    (filters.onlyTracking ? 1 : 0) +
    (filters.onlyMentioned ? 1 : 0) +
    ((filters.search ?? "") ? 1 : 0);
  const hasFilters = activeCount > 0;

  const clearAll = () => {
    setSearch("");
    onChange({
      search: "",
      assigneeId: null,
      onlyOverdue: false,
      onlyTracking: false,
      onlyMentioned: false,
    });
  };

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <InputGroup className="h-8 w-full max-w-72 min-w-52 flex-1">
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={t("filter.search")}
          aria-label={t("filter.search")}
        />
        {search ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              aria-label={t("action.clear")}
              onClick={() => setSearch("")}
            >
              <XIcon />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className="gap-1.5 font-normal" />}
        >
          {selectedMember ? (
            <MemberAvatar member={selectedMember} size="sm" />
          ) : (
            <SlidersHorizontalIcon data-icon="inline-start" className="text-muted-foreground" />
          )}
          <span className="max-w-32 truncate">
            {selectedMember ? memberName(locale, selectedMember) : t("filter.title")}
          </span>
          {activeCount > 0 ? (
            <span className="text-xs text-muted-foreground tabular-nums">
              {formatNumber(activeCount)}
            </span>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-60">
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("filter.assignee")}</DropdownMenuLabel>
            <DropdownMenuRadioGroup
              value={filters.assigneeId ?? "all"}
              onValueChange={(value) =>
                onChange({
                  ...filters,
                  assigneeId: value === "all" ? null : String(value),
                })
              }
            >
              <DropdownMenuRadioItem value="all">{t("filter.all")}</DropdownMenuRadioItem>
              {members.map((member) => (
                <DropdownMenuRadioItem key={member.id} value={member.id} className="gap-2">
                  <MemberAvatar member={member} size="sm" />
                  <span className="truncate">
                    {memberName(locale, member)}
                    {member.id === currentUserId ? ` (${t("people.you")})` : ""}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuLabel>{t("filter.activity")}</DropdownMenuLabel>
            <DropdownMenuCheckboxItem
              checked={Boolean(filters.onlyTracking)}
              onCheckedChange={(checked) =>
                onChange({ ...filters, onlyTracking: checked === true })
              }
            >
              {t("filter.trackingOnly")}
              {unreadCount > 0 ? (
                <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                  {formatNumber(unreadCount)}
                </span>
              ) : null}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={Boolean(filters.onlyMentioned)}
              onCheckedChange={(checked) =>
                onChange({ ...filters, onlyMentioned: checked === true })
              }
            >
              {t("filter.onlyMentioned")}
              {mentionCount > 0 ? (
                <span className="ms-auto text-xs text-muted-foreground tabular-nums">
                  {formatNumber(mentionCount)}
                </span>
              ) : null}
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={Boolean(filters.onlyOverdue)}
              onCheckedChange={(checked) =>
                onChange({ ...filters, onlyOverdue: checked === true })
              }
            >
              {t("filter.onlyOverdue")}
            </DropdownMenuCheckboxItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={unreadCount === 0}
            onClick={() => onMarkAllSeen?.()}
            className="gap-2"
          >
            <CheckCheckIcon data-icon="inline-start" />
            {t("task.markAllRead")}
          </DropdownMenuItem>
          {hasFilters ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearAll}>{t("filter.clear")}</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {hasFilters ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("filter.results", { count: formatNumber(resultCount) })}
        </span>
      ) : null}
    </div>
  );
}
