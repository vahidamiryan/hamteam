"use client";

import * as React from "react";
import {
  AlertTriangleIcon,
  BanIcon,
  ChevronDownIcon,
  ClockIcon,
  DatabaseIcon,
  LayersIcon,
  PlusIcon,
  RefreshCwIcon,
  RotateCcwIcon,
  SearchIcon,
  UsersIcon,
} from "lucide-react";

import { BoardView } from "@/components/board-view";
import { GoalsView } from "@/components/goals-view";
import { MemberAvatar } from "@/components/member-avatar";
import { MenuSelect } from "@/components/menu-select";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { PeopleView } from "@/components/people-view";
import { TaskSheet } from "@/components/task-sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWorkspace } from "@/components/workspace-provider";
import { toFaDigits } from "@/lib/dates";
import { workspaceStats } from "@/lib/derived";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "board" | "people" | "goals";

const VIEWS: { value: View; label: string }[] = [
  { value: "board", label: "برد کارها" },
  { value: "people", label: "افراد" },
  { value: "goals", label: "اهداف" },
];

function StatCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone?: "danger" | "warning" | "default";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-xl border border-border/70 bg-card px-2.5 py-2",
        tone === "danger" && "border-rose-200/70 bg-rose-50/50",
        tone === "warning" && "border-amber-200/70 bg-amber-50/50",
      )}
    >
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground",
          tone === "danger" && "bg-rose-100 text-rose-600",
          tone === "warning" && "bg-amber-100 text-amber-700",
        )}
      >
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-[0.95rem] font-semibold leading-5 tabular-nums">
          {toFaDigits(value)}
        </span>
        <span className="block truncate text-[10px] text-muted-foreground">{label}</span>
      </span>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-12 animate-pulse rounded-xl bg-muted/60" />
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-72 animate-pulse rounded-2xl bg-muted/50" />
        ))}
      </div>
    </div>
  );
}

export function AppShell() {
  const { workspace, storage, status, error, refresh, currentUser, setCurrentUserId, createTask, resetDemo } =
    useWorkspace();
  const [view, setView] = React.useState<View>("board");
  const [search, setSearch] = React.useState("");
  const [assigneeFilter, setAssigneeFilter] = React.useState<string | null>(null);
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);
  const [newTask, setNewTask] = React.useState<{ open: boolean; status: TaskStatus }>({
    open: false,
    status: "backlog",
  });

  const stats = workspace ? workspaceStats(workspace) : null;

  const createTaskFromColumn = React.useCallback(
    async (taskStatus: TaskStatus, title: string) => {
      const payload = await createTask({
        title,
        status: taskStatus,
        assigneeId: assigneeFilter,
      });
      return Boolean(payload);
    },
    [createTask, assigneeFilter],
  );

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1500px] items-center gap-3 px-3 pt-2.5 pb-1.5 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-sm">
              <LayersIcon className="size-4.5" />
            </span>
            <div className="hidden sm:block">
              <h1 className="text-[0.95rem] font-semibold leading-5">هم‌تیم</h1>
              <p className="text-[10.5px] leading-4 text-muted-foreground">
                مدیریت تسک و همفکری تیمی
              </p>
            </div>
          </div>

          <div className="ms-auto flex items-center gap-2">
            {storage ? (
              <span
                className={cn(
                  "hidden items-center gap-1.5 rounded-full border border-border/70 bg-background px-2 py-1 text-[10.5px] text-muted-foreground md:inline-flex",
                  !storage.persistent && "border-amber-300/80 bg-amber-50 text-amber-800",
                )}
                title={storage.hint}
              >
                <DatabaseIcon className="size-3" />
                {storage.label}
              </span>
            ) : null}

            {workspace ? (
              <div className="hidden items-center lg:flex">
                {workspace.members.slice(0, 5).map((member, index) => (
                  <MemberAvatar
                    key={member.id}
                    name={member.name}
                    memberId={member.id}
                    size="sm"
                    className={cn(
                      "ring-2 ring-background",
                      index > 0 && "-ms-1.5",
                      member.id === currentUser?.id && "ring-primary/40",
                    )}
                  />
                ))}
                {workspace.members.length > 5 ? (
                  <span className="-ms-1.5 flex size-6 items-center justify-center rounded-full bg-muted text-[10px] font-medium text-muted-foreground ring-2 ring-background">
                    +{toFaDigits(workspace.members.length - 5)}
                  </span>
                ) : null}
              </div>
            ) : null}

            {currentUser ? (
              <MenuSelect
                value={currentUser.id}
                align="end"
                ariaLabel="انتخاب عضو فعال"
                onChange={setCurrentUserId}
                className="h-8 w-auto gap-2 bg-background pe-1.5"
                options={workspace!.members.map((member) => ({
                  value: member.id,
                  label: member.name,
                  hint: member.role || undefined,
                  leading: (
                    <MemberAvatar name={member.name} memberId={member.id} size="xs" />
                  ),
                }))}
                leading={
                  <MemberAvatar
                    name={currentUser.name}
                    memberId={currentUser.id}
                    size="xs"
                  />
                }
              />
            ) : null}

            <Button onClick={() => setNewTask({ open: true, status: "backlog" })}>
              <PlusIcon />
              تسک جدید
            </Button>
          </div>
        </div>

        <div className="mx-auto flex max-w-[1500px] items-center gap-2 px-3 pb-2 sm:px-5">
          <div className="inline-flex items-center gap-1 rounded-xl bg-muted/70 p-0.5">
            {VIEWS.map((item) => (
              <button
                key={item.value}
                type="button"
                onClick={() => setView(item.value)}
                aria-pressed={view === item.value}
                className={cn(
                  "h-7 rounded-[0.6rem] px-2.5 text-[0.8rem] font-medium transition-colors",
                  view === item.value
                    ? "bg-background text-foreground shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ms-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" aria-label="به‌روزرسانی" onClick={() => void refresh()}>
              <RefreshCwIcon />
            </Button>
            {storage ? (
              <Button
                variant="ghost"
                size="sm"
                className="hidden text-muted-foreground sm:inline-flex"
                onClick={() => {
                  if (window.confirm("داده‌ی نمونه بازنشانی شود؟ همه‌ی تغییرات فعلی پاک می‌شود.")) {
                    void resetDemo();
                  }
                }}
              >
                <RotateCcwIcon />
                بازنشانی
              </Button>
            ) : null}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1500px] px-3 py-3 sm:px-5">
        {storage && !storage.persistent ? (
          <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-[0.78rem] text-amber-900">
            <AlertTriangleIcon className="mt-0.5 size-4 shrink-0" />
            <p>
              <span className="font-semibold">حالت نمایشی:</span> {storage.hint}
            </p>
          </div>
        ) : null}

        {status === "loading" ? <LoadingState /> : null}

        {status === "error" ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-6 text-center">
            <p className="text-sm font-medium text-rose-900">
              بارگذاری فضای کاری ناموفق بود
            </p>
            <p className="mt-1 text-[0.8rem] text-rose-800/80">{error}</p>
            <Button variant="outline" className="mt-3" onClick={() => void refresh()}>
              تلاش دوباره
            </Button>
          </div>
        ) : null}

        {status === "ready" && workspace ? (
          <div className="space-y-3">
            {view === "board" ? (
              <>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-5">
                  <StatCard
                    icon={<LayersIcon className="size-3.5" />}
                    label="کل تسک‌ها"
                    value={stats?.total ?? 0}
                  />
                  <StatCard
                    icon={<ClockIcon className="size-3.5" />}
                    label="در حال انجام"
                    value={stats?.inProgress ?? 0}
                  />
                  <StatCard
                    icon={<BanIcon className="size-3.5" />}
                    label="مسدود"
                    value={stats?.blocked ?? 0}
                    tone={stats && stats.blocked > 0 ? "danger" : "default"}
                  />
                  <StatCard
                    icon={<AlertTriangleIcon className="size-3.5" />}
                    label="سررسید گذشته"
                    value={stats?.overdue ?? 0}
                    tone={stats && stats.overdue > 0 ? "warning" : "default"}
                  />
                  <StatCard
                    icon={<UsersIcon className="size-3.5" />}
                    label="بدون مسئول"
                    value={stats?.unassigned ?? 0}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <SearchIcon className="pointer-events-none absolute start-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      placeholder="جست‌وجو در عنوان، توضیح یا دلیل مسدودی…"
                      className="h-8 w-60 ps-7 text-[0.8rem] sm:w-72"
                    />
                  </div>

                  <div className="flex items-center gap-1 overflow-x-auto">
                    <button
                      type="button"
                      onClick={() => setAssigneeFilter(null)}
                      className={cn(
                        "h-7 shrink-0 rounded-full border px-2.5 text-[0.75rem] transition",
                        assigneeFilter === null
                          ? "border-foreground/20 bg-foreground/5 font-medium"
                          : "border-transparent text-muted-foreground hover:bg-muted",
                      )}
                    >
                      همه
                    </button>
                    {workspace.members.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() =>
                          setAssigneeFilter((current) =>
                            current === member.id ? null : member.id,
                          )
                        }
                        className={cn(
                          "flex h-7 shrink-0 items-center gap-1.5 rounded-full border px-1.5 pe-2 text-[0.75rem] transition",
                          assigneeFilter === member.id
                            ? "border-foreground/20 bg-foreground/5 font-medium"
                            : "border-transparent text-muted-foreground hover:bg-muted",
                        )}
                        title={member.name}
                      >
                        <MemberAvatar
                          name={member.name}
                          memberId={member.id}
                          size="xs"
                        />
                        <span className="max-w-24 truncate">{member.name.split(" ")[0]}</span>
                      </button>
                    ))}
                  </div>

                  {assigneeFilter ? (
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <ChevronDownIcon className="size-3" />
                      فقط تسک‌های{" "}
                      {workspace.members.find((member) => member.id === assigneeFilter)?.name}
                    </span>
                  ) : null}
                </div>

                <BoardView
                  search={search}
                  assigneeId={assigneeFilter}
                  onOpenTask={setOpenTaskId}
                  onCreateTask={createTaskFromColumn}
                />
              </>
            ) : null}

            {view === "people" ? (
              <PeopleView
                onOpenTask={setOpenTaskId}
                onFilterBoard={(memberId) => {
                  setAssigneeFilter(memberId);
                  setView("board");
                }}
              />
            ) : null}

            {view === "goals" ? <GoalsView onOpenTask={setOpenTaskId} /> : null}
          </div>
        ) : null}

        {status === "ready" && !workspace ? (
          <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
            فضای کاری خالی است.
          </div>
        ) : null}
      </main>

      <TaskSheet
        taskId={openTaskId}
        onClose={() => setOpenTaskId(null)}
        onOpenGoal={() => {
          setOpenTaskId(null);
          setView("goals");
        }}
      />

      <NewTaskDialog
        open={newTask.open}
        onOpenChange={(open) => setNewTask((current) => ({ ...current, open }))}
        defaultStatus={newTask.status}
        defaultAssigneeId={assigneeFilter}
      />
    </div>
  );
}
