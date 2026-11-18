"use client";

import * as React from "react";
import { BellIcon, CheckCheckIcon, SearchIcon, SlidersHorizontalIcon, XIcon } from "lucide-react";

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
import { useWorkspace } from "@/components/workspace-provider";
import type { TaskFilterOptions } from "@/lib/derived";
import { memberName } from "@/lib/locale-text";
import { cn } from "@/lib/utils";

export function FilterBar({
  filters,
  onChange,
  resultCount,
  unreadCount = 0,
  onMarkAllSeen,
  className,
}: {
  filters: TaskFilterOptions;
  onChange: (next: TaskFilterOptions) => void;
  resultCount: number;
  unreadCount?: number;
  onMarkAllSeen?: () => void;
  className?: string;
}) {
  const { locale, t, formatNumber } = useLocale();
  const { workspace, currentUser } = useWorkspace();
  const [search, setSearch] = React.useState(filters.search ?? "");

  // جست‌وجو با تأخیر کوتاه تا تایپ روان بماند.
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      if (search !== (filters.search ?? "")) {
        onChange({ ...filters, search });
      }
    }, 200);
    return () => window.clearTimeout(timer);
  }, [search, filters, onChange]);

  const members = workspace?.members ?? [];
  const selectedMember =
    members.find((member) => member.id === filters.assigneeId) ?? null;
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
        <DropdownMenuContent align="start" className="min-w-56">
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
                    {member.id === currentUser?.id ? ` (${t("people.you")})` : ""}
                  </span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={Boolean(filters.onlyTracking)}
            onCheckedChange={(checked) =>
              onChange({ ...filters, onlyTracking: checked === true })
            }
          >
            {t("filter.trackingOnly")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={Boolean(filters.onlyMentioned)}
            onCheckedChange={(checked) =>
              onChange({ ...filters, onlyMentioned: checked === true })
            }
          >
            {t("filter.onlyMentioned")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={Boolean(filters.onlyOverdue)}
            onCheckedChange={(checked) =>
              onChange({ ...filters, onlyOverdue: checked === true })
            }
          >
            {t("filter.onlyOverdue")}
          </DropdownMenuCheckboxItem>
          {hasFilters ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={clearAll}>{t("filter.clear")}</DropdownMenuItem>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* دکمه اختصاصی فیلتر تغییرات جدید و پیگیری */}
      <Button
        variant={filters.onlyTracking ? "default" : "outline"}
        size="sm"
        onClick={() => onChange({ ...filters, onlyTracking: !filters.onlyTracking })}
        className={cn(
          "h-8 gap-1.5 text-xs font-normal transition-all",
          filters.onlyTracking
            ? "bg-primary text-primary-foreground"
            : unreadCount > 0
              ? "border-primary/40 text-foreground hover:bg-primary/5"
              : "text-muted-foreground",
        )}
      >
        <BellIcon className={cn("size-3.5", unreadCount > 0 && "text-primary")} />
        <span>{t("filter.trackingOnly")}</span>
        {unreadCount > 0 ? (
          <span
            className={cn(
              "rounded-full px-1.5 py-0.2 text-[10px] tabular-nums font-semibold",
              filters.onlyTracking
                ? "bg-primary-foreground/20 text-primary-foreground"
                : "bg-primary/15 text-primary",
            )}
          >
            {formatNumber(unreadCount)}
          </span>
        ) : null}
      </Button>

      {filters.onlyTracking && onMarkAllSeen && unreadCount > 0 ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkAllSeen}
          className="h-8 gap-1 text-xs text-muted-foreground hover:text-foreground"
          title={t("task.markAllRead")}
        >
          <CheckCheckIcon className="size-3.5" />
          <span className="hidden sm:inline">{t("task.markAllRead")}</span>
        </Button>
      ) : null}

      {hasFilters ? (
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("filter.results", { count: formatNumber(resultCount) })}
        </span>
      ) : null}
    </div>
  );
}
