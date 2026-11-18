"use client";

import * as React from "react";
import { CheckIcon, ChevronDownIcon } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type MenuOption = {
  value: string;
  label: string;
  leading?: React.ReactNode;
  hint?: string;
};

/**
 * منوی انتخاب کوچک و سبک (روی Base UI) که جای <select> را می‌گیرد
 * و می‌تواند آواتار یا نشان رنگی هم نمایش دهد.
 */
export function MenuSelect({
  value,
  options,
  onChange,
  placeholder = "انتخاب کنید",
  className,
  contentClassName,
  align = "end",
  leading,
  ariaLabel,
  disabled,
}: {
  value: string;
  options: MenuOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  leading?: React.ReactNode;
  ariaLabel?: string;
  disabled?: boolean;
}) {
  const selected = options.find((option) => option.value === value);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label={ariaLabel}
        disabled={disabled}
        className={cn(
          "flex h-8 w-full min-w-0 items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 text-[0.8rem] transition-colors outline-none hover:bg-muted/50 focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-50 aria-expanded:bg-muted/60",
          className,
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5 truncate">
          {selected?.leading ?? leading}
          {selected ? (
            <span className="truncate">{selected.label}</span>
          ) : (
            <span className="truncate text-muted-foreground">{placeholder}</span>
          )}
        </span>
        <ChevronDownIcon className="size-3.5 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align={align}
        className={cn("min-w-56 p-1", contentClassName)}
      >
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => onChange(option.value)}
            className="gap-2 py-1.5"
          >
            {option.leading}
            <span className="flex min-w-0 flex-col">
              <span className="truncate">{option.label}</span>
              {option.hint ? (
                <span className="truncate text-[11px] text-muted-foreground">
                  {option.hint}
                </span>
              ) : null}
            </span>
            {option.value === value ? (
              <CheckIcon className="ms-auto size-4 shrink-0 text-foreground" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export { DropdownMenuSeparator as MenuSeparator };
