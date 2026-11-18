"use client";

import * as React from "react";
import {
  EllipsisIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserCheckIcon,
  UserPlusIcon,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { useLocale } from "@/components/locale-provider";
import { MiniTaskRow } from "@/components/table-view";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/workspace-provider";
import { AVATAR_COUNT, randomAvatarIndex, avatarSrc } from "@/lib/avatars";
import { percentLabel } from "@/lib/dates";
import { isOpen, memberStats, sortTasks } from "@/lib/derived";
import { memberName, memberRole } from "@/lib/locale-text";
import type { Member } from "@/lib/types";
import { cn } from "@/lib/utils";

export function PeopleView({
  onOpenTask,
  onShowTasks,
}: {
  onOpenTask: (taskId: string) => void;
  onShowTasks: (memberId: string) => void;
}) {
  const { locale, t, formatNumber } = useLocale();
  const { workspace, currentUser, setCurrentUserId, deleteMember } = useWorkspace();
  const [editing, setEditing] = React.useState<Member | null>(null);
  const [creating, setCreating] = React.useState(false);
  const [removing, setRemoving] = React.useState<Member | null>(null);

  if (!workspace) return null;
  const members = workspace.members;

  return (
    <div className="flex flex-col gap-3">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold">{t("people.heading")}</h2>
          <p className="text-xs text-muted-foreground">
            {t("people.description", { count: formatNumber(members.length) })}
          </p>
        </div>
        <Button size="sm" onClick={() => setCreating(true)}>
          <UserPlusIcon data-icon="inline-start" />
          {t("action.newMember")}
        </Button>
      </header>

      {members.length === 0 ? (
        <Empty className="rounded-xl border border-dashed">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserPlusIcon />
            </EmptyMedia>
            <EmptyTitle>{t("people.empty")}</EmptyTitle>
            <EmptyDescription>{t("people.emptyHint")}</EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button size="sm" onClick={() => setCreating(true)}>
              {t("action.newMember")}
            </Button>
          </EmptyContent>
        </Empty>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {members.map((member) => {
            const stats = memberStats(workspace, member.id);
            const openTasks = sortTasks(
              workspace.tasks.filter(
                (task) => task.assigneeId === member.id && isOpen(task),
              ),
            ).slice(0, 3);
            const isMe = currentUser?.id === member.id;
            const percent =
              stats.total === 0 ? 0 : Math.round((stats.done / stats.total) * 100);

            return (
              <Card key={member.id} className="gap-3">
                <CardHeader className="gap-2">
                  <div className="flex items-start gap-2">
                    <MemberAvatar member={member} size="lg" withCard />
                    <div className="min-w-0 flex-1">
                      <CardTitle className="flex items-center gap-1.5 text-base font-semibold">
                        <span className="truncate">{memberName(locale, member)}</span>
                        {isMe ? (
                          <span className="rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                            {t("people.you")}
                          </span>
                        ) : null}
                      </CardTitle>
                      <p className="truncate text-xs text-muted-foreground">
                        {memberRole(locale, member) || "—"}
                      </p>
                      {member.email ? (
                        <p
                          dir="ltr"
                          className="truncate text-xs text-muted-foreground text-start"
                        >
                          {member.email}
                        </p>
                      ) : null}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={<Button variant="ghost" size="icon-sm" />}
                        aria-label={t("action.more")}
                      >
                        <EllipsisIcon />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuGroup>
                          <DropdownMenuItem
                            onClick={() => setCurrentUserId(member.id)}
                            disabled={isMe}
                          >
                            <UserCheckIcon data-icon="inline-start" />
                            {t("action.thisIsMe")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onShowTasks(member.id)}>
                            <LayoutGridIcon data-icon="inline-start" />
                            {t("action.viewTasks")}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setEditing(member)}>
                            <PencilIcon data-icon="inline-start" />
                            {t("action.edit")}
                          </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant="destructive"
                          onClick={() => setRemoving(member)}
                        >
                          <Trash2Icon data-icon="inline-start" />
                          {t("action.delete")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>

                <CardContent className="flex flex-col gap-2">
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      { label: t("stats.open"), value: stats.open },
                      { label: t("stats.inProgress"), value: stats.inProgress },
                      { label: t("stats.blocked"), value: stats.blocked },
                      { label: t("stats.overdue"), value: stats.overdue },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        className={cn(
                          "rounded-md border border-border/60 bg-muted/30 px-1 py-1 text-center",
                          stat.label === t("stats.overdue") &&
                            stat.value > 0 &&
                            "border-status-blocked/40 bg-status-blocked/10 text-status-blocked",
                        )}
                      >
                        <div className="text-sm font-semibold tabular-nums">
                          {formatNumber(stat.value)}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      {t("people.doneOf", {
                        done: formatNumber(stats.done),
                        total: formatNumber(stats.total),
                      })}
                    </span>
                    <span className="tabular-nums">{percentLabel(locale, percent)}</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-status-done transition-[width]"
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex flex-col">
                    {openTasks.length === 0 ? (
                      <p className="py-2 text-center text-xs text-muted-foreground">
                        {t("people.noOpen")}
                      </p>
                    ) : (
                      openTasks.map((task) => (
                        <MiniTaskRow
                          key={task.id}
                          task={task}
                          onOpen={() => onOpenTask(task.id)}
                        />
                      ))
                    )}
                  </div>
                </CardContent>

                <CardFooter className="justify-between gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onShowTasks(member.id)}
                  >
                    <LayoutGridIcon data-icon="inline-start" />
                    {t("action.viewTasks")}
                  </Button>
                  <Button
                    variant={isMe ? "secondary" : "outline"}
                    size="sm"
                    disabled={isMe}
                    onClick={() => setCurrentUserId(member.id)}
                  >
                    {isMe ? t("people.you") : t("action.thisIsMe")}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}

          <button
            type="button"
            onClick={() => setCreating(true)}
            className="flex min-h-56 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border/80 p-4 text-xs text-muted-foreground transition-colors hover:bg-muted/40 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/40 focus-visible:outline-none"
          >
            <PlusIcon className="size-5" aria-hidden="true" />
            {t("people.addCard")}
          </button>
        </div>
      )}

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("member.newTitle")}</DialogTitle>
            <DialogDescription>{t("people.emptyHint")}</DialogDescription>
          </DialogHeader>
          <MemberForm
            key="new"
            member={null}
            onDone={() => setCreating(false)}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("member.editTitle")}</DialogTitle>
            <DialogDescription>{t("member.editTitle")}</DialogDescription>
          </DialogHeader>
          {editing ? (
            <MemberForm
              key={editing.id}
              member={editing}
              onDone={() => setEditing(null)}
            />
          ) : null}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(removing)}
        onOpenChange={(open) => {
          if (!open) setRemoving(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("member.deleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("member.deleteDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (removing) void deleteMember(removing.id);
                setRemoving(null);
              }}
            >
              {t("action.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function MemberForm({
  member,
  onDone,
}: {
  member: Member | null;
  onDone: () => void;
}) {
  const { t } = useLocale();
  const { createMember, updateMember } = useWorkspace();
  const [name, setName] = React.useState(member?.name ?? "");
  const [nameEn, setNameEn] = React.useState(member?.nameEn ?? "");
  const [role, setRole] = React.useState(member?.role ?? "");
  const [roleEn, setRoleEn] = React.useState(member?.roleEn ?? "");
  const [email, setEmail] = React.useState(member?.email ?? "");
  const [avatarIndex, setAvatarIndex] = React.useState(
    member?.avatarIndex ?? randomAvatarIndex(),
  );
  const [saving, setSaving] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || saving) return;
    setSaving(true);
    const payload = {
      name: name.trim(),
      nameEn: nameEn.trim() || undefined,
      role: role.trim(),
      roleEn: roleEn.trim() || undefined,
      email: email.trim(),
      avatarIndex,
    };
    const result = member
      ? await updateMember(member.id, payload)
      : await createMember(payload);
    setSaving(false);
    if (result) onDone();
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-3">
      <FieldGroup className="gap-3">
        <div className="flex flex-col items-center gap-2">
          <span
            role="img"
            aria-label={`آواتار ${avatarIndex + 1}`}
            className="size-16 rounded-full border bg-muted bg-cover bg-center"
            style={{ backgroundImage: `url(${avatarSrc(avatarIndex)})` }}
          />
          <div className="grid grid-cols-6 gap-1.5">
            {Array.from({ length: AVATAR_COUNT }, (_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setAvatarIndex(index)}
                aria-label={`آواتار ${index + 1}`}
                aria-pressed={index === avatarIndex}
                className={cn(
                  "size-8 rounded-full border-2 border-transparent bg-muted bg-cover bg-center transition",
                  index === avatarIndex
                    ? "border-primary ring-2 ring-primary/30"
                    : "opacity-70 hover:opacity-100",
                )}
                style={{ backgroundImage: `url(${avatarSrc(index)})` }}
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field className="gap-1">
            <FieldLabel htmlFor="member-name">{t("member.name")}</FieldLabel>
            <Input
              id="member-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder={t("member.namePlaceholder")}
              required
              maxLength={80}
              dir="auto"
            />
          </Field>
          <Field className="gap-1">
            <FieldLabel htmlFor="member-name-en">Name (EN)</FieldLabel>
            <Input
              id="member-name-en"
              value={nameEn}
              onChange={(event) => setNameEn(event.target.value)}
              placeholder="Sara Mohammadi"
              maxLength={80}
              dir="ltr"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Field className="gap-1">
            <FieldLabel htmlFor="member-role">{t("member.role")}</FieldLabel>
            <Input
              id="member-role"
              value={role}
              onChange={(event) => setRole(event.target.value)}
              placeholder={t("member.rolePlaceholder")}
              maxLength={60}
              dir="auto"
            />
          </Field>
          <Field className="gap-1">
            <FieldLabel htmlFor="member-role-en">Role (EN)</FieldLabel>
            <Input
              id="member-role-en"
              value={roleEn}
              onChange={(event) => setRoleEn(event.target.value)}
              placeholder="Product manager"
              maxLength={60}
              dir="ltr"
            />
          </Field>
        </div>

        <Field className="gap-1">
          <FieldLabel htmlFor="member-email">{t("member.email")}</FieldLabel>
          <Input
            id="member-email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={t("member.emailPlaceholder")}
            maxLength={120}
            dir="ltr"
          />
        </Field>
      </FieldGroup>

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          {t("action.cancel")}
        </Button>
        <Button type="submit" disabled={saving || !name.trim()}>
          {t("action.save")}
        </Button>
      </DialogFooter>
    </form>
  );
}
