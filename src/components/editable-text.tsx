"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * متن قابل ویرایش درجا: با از دست دادن فوکوس (یا Enter) ذخیره می‌شود.
 * برای عنوان و توضیحات تسک استفاده می‌شود تا نیازی به دکمه‌ی ذخیره نباشد.
 */
export function EditableText({
  value,
  onCommit,
  placeholder,
  multiline = false,
  allowEmpty = false,
  className,
  ariaLabel,
  maxLength,
}: {
  value: string;
  onCommit: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  allowEmpty?: boolean;
  className?: string;
  ariaLabel?: string;
  maxLength?: number;
}) {
  const [draft, setDraft] = React.useState(value);
  const ref = React.useRef<HTMLTextAreaElement | null>(null);

  React.useEffect(() => {
    if (document.activeElement !== ref.current) setDraft(value);
  }, [value]);

  React.useEffect(() => {
    const element = ref.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${element.scrollHeight}px`;
  }, [draft]);

  const commit = () => {
    const next = draft.trim();
    if (next === value.trim()) return;
    if (!next && !allowEmpty) {
      setDraft(value);
      return;
    }
    onCommit(next);
  };

  return (
    <textarea
      ref={ref}
      aria-label={ariaLabel}
      rows={1}
      maxLength={maxLength}
      value={draft}
      placeholder={placeholder}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      onBlur={commit}
      onKeyDown={(event) => {
        if (!multiline && event.key === "Enter") {
          event.preventDefault();
          event.currentTarget.blur();
        }
        if (event.key === "Escape") {
          setDraft(value);
          event.currentTarget.blur();
        }
      }}
      className={cn(
        "w-full resize-none rounded-md bg-transparent px-1 py-0.5 outline-none transition placeholder:text-muted-foreground/70 hover:bg-muted/40 focus:bg-muted/50 focus:ring-1 focus:ring-ring/40",
        className,
      )}
    />
  );
}
