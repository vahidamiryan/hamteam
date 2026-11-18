"use client";

import * as React from "react";
import {
  EllipsisIcon,
  LayoutGridIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  UserCheckIcon,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useWorkspace } from "@/components/workspace-provider";
import { AVATAR_OPTIONS, avatarSrc, randomAvatarIndex } from "@/lib/avatars";
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
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-1">
        <h2 className="text-base font-medium">{t("people.heading")}</h2>
        <p className="text-sm text-muted-foreground">
          {t("people.description", { count: formatNumber(members.length) })}
        </p>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
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
            <Card key={member.id} className="gap-4">
              <CardHeader className="gap-0">
                <div className="flex items-start gap-3">
                  <MemberAvatar member={member} size="lg" withCard />
                  <div className="min-w-0 flex-1">
                    <CardTitle className="flex items-baseline gap-1.5 text-sm font-medium">
                      <span className="truncate">{memberName(locale, member)}</span>
                      {isMe ? (
                        <span className="shrink-0 text-xs font-normal text-primary">
                          {t("people.you")}
                        </span>
                      ) : null}
                    </CardTitle>
                    <p className="truncate text-xs text-muted-foreground">
                      {memberRole(locale, member) || member.email || "—"}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                      aria-label={t("action.more")}
                      className="-me-1 text-muted-foreground"
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
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="text-muted-foreground tabular-nums">
                    {t("people.doneOf", {
                      done: formatNumber(stats.done),
                      total: formatNumber(stats.total),
                    })}
                    {stats.overdue > 0 ? (
                      <>
                        {" · "}
                        <span className="text-destructive">
                          {t("stats.overdue")} {formatNumber(stats.overdue)}
                        </span>
                      </>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {percentLabel(locale, percent)}
                  </span>
                </div>
                <Progress
                  value={percent}
                  aria-label={t("people.doneOf", {
                    done: formatNumber(stats.done),
                    total: formatNumber(stats.total),
                  })}
                  className="gap-0"
                />
              </CardContent>

              <CardContent className="flex flex-col border-t">
                {openTasks.length === 0 ? (
                  <p className="py-3 text-center text-xs text-muted-foreground">
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
              </CardContent>

              <CardFooter className="justify-between gap-2 border-t bg-transparent px-3 py-2">
                <Button variant="ghost" size="sm" onClick={() => onShowTasks(member.id)}>
                  <LayoutGridIcon data-icon="inline-start" />
                  {t("action.viewTasks")}
                </Button>
                <Button
                  variant="outline"
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

        <Button
          variant="outline"
          onClick={() => setCreating(true)}
          className="h-full min-h-40 flex-col gap-2 border-dashed bg-transparent font-normal text-muted-foreground hover:text-foreground"
        >
          <PlusIcon />
          {t("people.addCard")}
        </Button>
      </div>

      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("member.newTitle")}</DialogTitle>
            <DialogDescription>{t("member.newDescription")}</DialogDescription>
          </DialogHeader>
          <MemberForm key="new" member={null} onDone={() => setCreating(false)} />
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("member.editTitle")}</DialogTitle>
            <DialogDescription>{t("member.editDescription")}</DialogDescription>
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

function MemberForm({ member, onDone }: { member: Member | null; onDone: () => void }) {
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
    <form onSubmit={submit} className="flex flex-col gap-4">
      <FieldGroup className="gap-4">
        <Field className="gap-2">
          <FieldLabel className="text-xs text-muted-foreground">
            {t("member.avatar")}
          </FieldLabel>
          <div className="flex items-center gap-3">
            <Avatar size="lg" className="shrink-0">
              <AvatarImage src={avatarSrc(avatarIndex)} alt="" />
              <AvatarFallback />
            </Avatar>
            <RadioGroup
              value={String(avatarIndex)}
              onValueChange={(next) => setAvatarIndex(Number(next))}
              aria-label={t("member.avatar")}
              className="grid grid-cols-6 gap-1.5"
            >
              {AVATAR_OPTIONS.map((option) => (
                <RadioGroupItem
                  key={option.index}
                  value={String(option.index)}
                  aria-label={t("member.avatarOption", {
                    count: String(option.index + 1),
                  })}
                  className={cn(
                    "size-8 overflow-hidden rounded-full border-transparent bg-muted bg-cover bg-center opacity-60 transition-opacity",
                    "after:hidden data-checked:border-transparent data-checked:bg-transparent data-checked:opacity-100",
                    "data-checked:ring-2 data-checked:ring-primary data-checked:ring-offset-2 data-checked:ring-offset-card",
                    "[&_[data-slot=radio-group-indicator]]:hidden",
                  )}
                  style={{ backgroundImage: `url(${option.src})` }}
                />
              ))}
            </RadioGroup>
          </div>
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field className="gap-1.5">
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
          <Field className="gap-1.5">
            <FieldLabel htmlFor="member-name-en" className="text-muted-foreground">
              Name (EN)
            </FieldLabel>
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

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field className="gap-1.5">
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
          <Field className="gap-1.5">
            <FieldLabel htmlFor="member-role-en" className="text-muted-foreground">
              Role (EN)
            </FieldLabel>
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

        <Field className="gap-1.5">
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
