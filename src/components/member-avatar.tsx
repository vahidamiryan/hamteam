"use client";

import * as React from "react";
import { MailIcon, UserRoundIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Item, ItemContent, ItemMedia } from "@/components/ui/item";
import { Separator } from "@/components/ui/separator";
import { useLocale } from "@/components/locale-provider";
import { avatarIndexFor, avatarSrc } from "@/lib/avatars";
import { initialsOf } from "@/lib/labels";
import { memberName, memberRole } from "@/lib/locale-text";
import type { Member } from "@/lib/types";

type AvatarSize = "sm" | "default" | "lg";

/**
 * آواتار عضو با تصویر تصادفیِ پایدار و fallback حروف اول نام.
 * با نگه‌داشتن نشانگر، کارت معرفی عضو نمایش داده می‌شود.
 */
export function MemberAvatar({
  member,
  size = "default",
  withCard = false,
  className,
}: {
  member: Pick<Member, "id" | "name" | "nameEn" | "role" | "roleEn" | "email" | "avatarIndex"> | null;
  size?: AvatarSize;
  withCard?: boolean;
  className?: string;
}) {
  const { locale, t } = useLocale();

  if (!member) return <UnassignedAvatar size={size} className={className} />;

  const name = memberName(locale, member);
  const role = memberRole(locale, member);
  const avatar = (
    <Avatar size={size} className={className}>
      <AvatarImage src={avatarSrc(avatarIndexFor(member))} alt={name} />
      <AvatarFallback>{initialsOf(name)}</AvatarFallback>
    </Avatar>
  );

  if (!withCard) return avatar;

  return (
    <HoverCard>
      <HoverCardTrigger render={<span className="inline-flex cursor-default" />}>
        {avatar}
      </HoverCardTrigger>
      <HoverCardContent align="start" className="w-64">
        <div className="flex items-center gap-3">
          <MemberAvatar member={member} size="lg" />
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {role || "—"}
            </p>
          </div>
        </div>
        {member.email ? (
          <>
            <Separator className="my-3" />
            <Item variant="default" size="sm" className="p-0">
              <ItemMedia variant="icon">
                <MailIcon />
              </ItemMedia>
              <ItemContent>
                <span dir="ltr" className="truncate text-xs text-muted-foreground">
                  {member.email}
                </span>
              </ItemContent>
            </Item>
          </>
        ) : (
          <p className="mt-3 text-xs text-muted-foreground">{t("task.unassigned")}</p>
        )}
      </HoverCardContent>
    </HoverCard>
  );
}

export function UnassignedAvatar({
  size = "default",
  className,
}: {
  size?: AvatarSize;
  className?: string;
}) {
  return (
    <Avatar size={size} className={className}>
      <AvatarFallback>
        <UserRoundIcon className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}
