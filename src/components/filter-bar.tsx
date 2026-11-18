"use client";

import * as React from "react";
import { ListFilterIcon, SearchIcon, XIcon } from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Toggle } from "@/components/ui/toggle";
import { useWorkspace } from "@/components/workspace-provider";
import type { TaskFilterOptions } from "@/lib/derived";
import { memberName } from "@/lib/locale-text";
import { cn } from "@/lib/utils";

export function FilterBar({
  filters,
  onChange,
  resultCount,
  className,
}: {
  filters: TaskFilterOptions;
  onChange: (next: TaskFilterOptions) => void;
  resultCount: number;
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
  const hasFilters = Boolean(
    (filters.search ?? "") || filters.assigneeId || filters.onlyOverdue,
  );

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
          render={<Button variant="outline" size="sm" />}
          className="gap-1.5 font-normal"
        >
          {selectedMember ? (
            <MemberAvatar member={selectedMember} size="sm" />
          ) : (
            <ListFilterIcon data-icon="inline-start" className="text-muted-foreground" />
          )}
          <span className="max-w-32 truncate">
            {selectedMember ? memberName(locale, selectedMember) : t("filter.assignee")}
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-52">
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
                  <span className="truncate">{memberName(locale, member)}</span>
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      <Toggle
        variant="outline"
        size="sm"
        pressed={Boolean(filters.assigneeId && filters.assigneeId === currentUser?.id)}
        onPressedChange={(pressed) =>
          onChange({
            ...filters,
            assigneeId: pressed ? (currentUser?.id ?? null) : null,
          })
        }
        disabled={!currentUser}
        className="gap-1.5"
      >
        {t("filter.onlyMine")}
      </Toggle>

      <Toggle
        variant="outline"
        size="sm"
        pressed={Boolean(filters.onlyOverdue)}
        onPressedChange={(pressed) => onChange({ ...filters, onlyOverdue: pressed })}
        className="gap-1.5"
      >
        {t("filter.onlyOverdue")}
      </Toggle>

      <span className="text-xs text-muted-foreground tabular-nums">
        {t("filter.results", { count: formatNumber(resultCount) })}
      </span>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => {
            setSearch("");
            onChange({ search: "", assigneeId: null, onlyOverdue: false });
          }}
        >
          <XIcon data-icon="inline-start" />
          {t("filter.clear")}
        </Button>
      ) : null}
    </div>
  );
}
