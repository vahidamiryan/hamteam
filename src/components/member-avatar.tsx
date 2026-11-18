import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { avatarTone, initialsOf } from "@/lib/labels";
import { cn } from "@/lib/utils";

const SIZES = {
  xs: "size-5 text-[9px]",
  sm: "size-6 text-[10px]",
  md: "size-8 text-xs",
  lg: "size-11 text-sm",
} as const;

export function MemberAvatar({
  name,
  memberId,
  size = "md",
  className,
}: {
  name: string;
  memberId?: string | null;
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <Avatar className={cn(SIZES[size], "shrink-0", className)} aria-hidden>
      <AvatarFallback
        className={cn("font-medium tracking-tight", avatarTone(memberId ?? name))}
      >
        {initialsOf(name)}
      </AvatarFallback>
    </Avatar>
  );
}

export function UnassignedAvatar({
  size = "sm",
  className,
}: {
  size?: keyof typeof SIZES;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground",
        SIZES[size],
        className,
      )}
      title="بدون مسئول"
      aria-label="بدون مسئول"
    >
      ؟
    </span>
  );
}
