"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  Columns3Icon,
  DatabaseIcon,
  EllipsisIcon,
  PlusIcon,
  RefreshCcwIcon,
  TableIcon,
  TargetIcon,
  TriangleAlertIcon,
  UsersIcon,
} from "lucide-react";

import { MemberAvatar } from "@/components/member-avatar";
import { BoardView } from "@/components/board-view";
import { FilterBar } from "@/components/filter-bar";
import { GoalsView } from "@/components/goals-view";
import { useLocale } from "@/components/locale-provider";
import { NewTaskDialog } from "@/components/new-task-dialog";
import { PeopleView } from "@/components/people-view";
import { TableView } from "@/components/table-view";
import { TaskSheet } from "@/components/task-sheet";
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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkspace } from "@/components/workspace-provider";
import { filterTasks, workspaceStats, type TaskFilterOptions } from "@/lib/derived";
import { memberName } from "@/lib/locale-text";
import type { Locale } from "@/lib/i18n";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "board" | "table" | "people" | "goals";

const NAV: { value: View; labelKey: "nav.board" | "nav.table" | "nav.people" | "nav.goals"; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: "board", labelKey: "nav.board", icon: Columns3Icon },
  { value: "table", labelKey: "nav.table", icon: TableIcon },
  { value: "people", labelKey: "nav.people", icon: UsersIcon },
  { value: "goals", labelKey: "nav.goals", icon: TargetIcon },
];

export function AppShell() {
  const { locale, setLocale, t, formatNumber } = useLocale();
  const {
    workspace,
    storage,
    status,
    error,
    currentUser,
    setCurrentUserId,
    refresh,
    resetDemo,
  } = useWorkspace();

  const [view, setView] = React.useState<View>("board");
  const [filters, setFilters] = React.useState<TaskFilterOptions>({
    search: "",
    assigneeId: null,
    onlyOverdue: false,
  });
  const [openTaskId, setOpenTaskId] = React.useState<string | null>(null);
  const [newTask, setNewTask] = React.useState<{
    open: boolean;
    status: TaskStatus;
    assigneeId: string | null;
  }>({ open: false, status: "backlog", assigneeId: null });
  const [resetOpen, setResetOpen] = React.useState(false);

  const stats = workspace ? workspaceStats(workspace) : null;
  const filtered = workspace ? filterTasks(workspace, filters) : [];

  const openNewTask = (taskStatus: TaskStatus = "backlog") =>
    setNewTask({
      open: true,
      status: taskStatus,
      assigneeId: filters.assigneeId ?? null,
    });

  const showMemberTasks = (memberId: string) => {
    setFilters({ search: "", assigneeId: memberId, onlyOverdue: false });
    setView("board");
  };

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:px-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <UsersIcon className="size-4" aria-hidden="true" />
            </span>
            <div className="leading-tight">
              <h1 className="text-sm font-semibold">{t("app.name")}</h1>
              <p className="hidden text-[11px] text-muted-foreground sm:block">
                {t("app.tagline")}
              </p>
            </div>
          </div>

          <ToggleGroup
            value={[view]}
            onValueChange={(next) => {
              const [first] = next;
              if (first) setView(first as View);
            }}
            spacing={0}
            variant="outline"
            size="sm"
            className="order-3 w-full sm:order-none sm:ms-2 sm:w-auto"
            aria-label={t("app.name")}
          >
            {NAV.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                className="flex-1 gap-1.5 px-2 sm:flex-none"
                aria-label={t(item.labelKey)}
              >
                <item.icon className="size-3.5" />
                <span className="hidden sm:inline">{t(item.labelKey)}</span>
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="ms-auto flex items-center gap-1.5">
            <ToggleGroup
              value={[locale]}
              onValueChange={(next) => {
                const [first] = next;
                if (first) setLocale(first as Locale);
              }}
              spacing={0}
              variant="outline"
              size="sm"
              aria-label={t("app.language")}
            >
              <ToggleGroupItem value="fa" aria-label={t("app.fa")} className="px-2 text-[11px]">
                فا
              </ToggleGroupItem>
              <ToggleGroupItem value="en" aria-label={t("app.en")} className="px-2 text-[11px]">
                EN
              </ToggleGroupItem>
            </ToggleGroup>

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                  className="gap-1.5 px-1.5 font-normal"
                  aria-label={t("action.thisIsMe")}
                >
                  <MemberAvatar member={currentUser} size="sm" />
                  <span className="hidden max-w-24 truncate sm:inline">
                    {memberName(locale, currentUser)}
                  </span>
                  <ChevronDownIcon data-icon="inline-end" className="text-muted-foreground" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-52">
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{t("action.thisIsMe")}</DropdownMenuLabel>
                    <DropdownMenuRadioGroup
                      value={currentUser.id}
                      onValueChange={(value) => setCurrentUserId(String(value))}
                    >
                      {(workspace?.members ?? []).map((member) => (
                        <DropdownMenuRadioItem
                          key={member.id}
                          value={member.id}
                          className="gap-2"
                        >
                          <MemberAvatar member={member} size="sm" />
                          <span className="truncate">{memberName(locale, member)}</span>
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}

            <Button size="sm" onClick={() => openNewTask()}>
              <PlusIcon data-icon="inline-start" />
              <span className="hidden sm:inline">{t("action.newTask")}</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button variant="ghost" size="icon-sm" />}
                aria-label={t("action.more")}
              >
                <EllipsisIcon />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal">
                    <DatabaseIcon className="size-3.5" />
                    {t("storage.label")}
                  </DropdownMenuLabel>
                  <DropdownMenuItem disabled>
                    {storage ? t(`storage.mode.${storage.mode}`) : "—"}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => void refresh()}>
                    <RefreshCcwIcon data-icon="inline-start" />
                    {t("action.retry")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setResetOpen(true)}>
                    {t("action.reset")}
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {stats ? (
          <div className="mx-auto w-full max-w-7xl overflow-x-auto px-3 pb-2 sm:px-4">
            <div className="flex items-center gap-1.5">
              {[
                { label: t("stats.total"), value: stats.total, tone: "bg-status-backlog" },
                {
                  label: t("stats.inProgress"),
                  value: stats.inProgress,
                  tone: "bg-status-progress",
                },
                { label: t("stats.blocked"), value: stats.blocked, tone: "bg-status-blocked" },
                { label: t("stats.overdue"), value: stats.overdue, tone: "bg-status-pending" },
                {
                  label: t("stats.unassigned"),
                  value: stats.unassigned,
                  tone: "bg-muted-foreground/40",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex shrink-0 items-center gap-1.5 rounded-md border border-border/70 px-2 py-1"
                >
                  <span className={cn("size-1.5 rounded-full", item.tone)} aria-hidden="true" />
                  <span className="text-[11px] text-muted-foreground">{item.label}</span>
                  <span className="text-[11px] font-semibold tabular-nums">
                    {formatNumber(item.value)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-3 sm:px-4">
        {storage?.mode === "ephemeral" ? (
          <Alert>
            <TriangleAlertIcon />
            <AlertTitle>{t("storage.ephemeralTitle")}</AlertTitle>
            <AlertDescription>{t("storage.ephemeralBody")}</AlertDescription>
          </Alert>
        ) : null}

        {status === "loading" ? (
          <div className="flex flex-col gap-3" aria-busy="true" aria-label={t("app.loading")}>
            <Skeleton className="h-8 w-64" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
              {Array.from({ length: 5 }, (_, index) => (
                <Skeleton key={index} className="h-40 rounded-xl" />
              ))}
            </div>
          </div>
        ) : status === "error" ? (
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{t("app.loadError")}</AlertTitle>
            <AlertDescription className="flex flex-col gap-2">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={() => void refresh()}>
                {t("action.retry")}
              </Button>
            </AlertDescription>
          </Alert>
        ) : workspace ? (
          <>
            {view === "board" || view === "table" ? (
              <FilterBar
                filters={filters}
                onChange={setFilters}
                resultCount={filtered.length}
              />
            ) : null}

            {view === "board" ? (
              <BoardView
                filters={filters}
                onOpenTask={setOpenTaskId}
                onAddTask={openNewTask}
              />
            ) : null}

            {view === "table" ? (
              <TableView filters={filters} onOpenTask={setOpenTaskId} />
            ) : null}

            {view === "people" ? (
              <PeopleView
                onOpenTask={setOpenTaskId}
                onShowTasks={showMemberTasks}
              />
            ) : null}

            {view === "goals" ? <GoalsView onOpenTask={setOpenTaskId} /> : null}
          </>
        ) : null}
      </main>

      <footer className="border-t px-3 py-2 text-center text-[11px] text-muted-foreground sm:px-4">
        <Badge variant="outline" className="gap-1.5 text-[10px] font-normal">
          <DatabaseIcon className="size-3" aria-hidden="true" />
          {t("storage.label")}: {storage ? t(`storage.mode.${storage.mode}`) : "—"}
        </Badge>
      </footer>

      <TaskSheet
        taskId={openTaskId}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
      />

      <NewTaskDialog
        open={newTask.open}
        onOpenChange={(open) => setNewTask((current) => ({ ...current, open }))}
        defaultStatus={newTask.status}
        defaultAssigneeId={newTask.assigneeId}
      />

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("storage.resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("storage.resetDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("action.cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void resetDemo();
                setResetOpen(false);
              }}
            >
              {t("action.reset")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/** کارت آمار کوچک برای استفادهٔ بیرونی. */
export function StatCard({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <Card className={cn("py-2", className)}>
      <CardContent className="px-3">
        <div className="text-lg font-semibold tabular-nums">{value}</div>
        <div className="text-[11px] text-muted-foreground">{label}</div>
      </CardContent>
    </Card>
  );
}
