"use client";

import * as React from "react";
import {
  ChevronDownIcon,
  Columns3Icon,
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
import { ThemeToggle } from "@/components/theme-toggle";
import { useTaskActivity } from "@/lib/task-activity";
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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useWorkspace } from "@/components/workspace-provider";
import { formatRelative } from "@/lib/dates";
import { filterTasks, workspaceStats, type TaskFilterOptions } from "@/lib/derived";
import { memberName } from "@/lib/locale-text";
import type { Locale } from "@/lib/i18n";
import type { TaskStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type View = "board" | "table" | "people" | "goals";

const NAV: {
  value: View;
  labelKey: "nav.board" | "nav.table" | "nav.people" | "nav.goals";
  icon: React.ComponentType<{ className?: string }>;
}[] = [
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
    realtimeStatus,
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

  const {
    activityMap,
    markTaskSeen,
    markAllSeen,
    unreadTasksCount,
    mentionedTasksCount,
  } = useTaskActivity(workspace, currentUser);

  const stats = workspace ? workspaceStats(workspace) : null;

  // فیلترها با تأخیر به نماها می‌رسند: تایپ در جست‌وجو فوری می‌ماند و
  // محاسبهٔ سنگین فهرست، رندر ورودی را قفل نمی‌کند.
  const deferredFilters = React.useDeferredValue(filters);
  const filtered = workspace
    ? filterTasks(workspace, deferredFilters, { activity: activityMap })
    : [];

  const openNewTask = React.useCallback(
    (taskStatus: TaskStatus = "backlog") =>
      setNewTask({ open: true, status: taskStatus, assigneeId: filters.assigneeId ?? null }),
    [filters.assigneeId],
  );

  const showMemberTasks = React.useCallback((memberId: string) => {
    setFilters({ search: "", assigneeId: memberId, onlyOverdue: false });
    setView("board");
  }, []);

  const statItems = stats
    ? [
        { label: t("stats.total"), value: stats.total },
        { label: t("stats.inProgress"), value: stats.inProgress },
        { label: t("stats.blocked"), value: stats.blocked, tone: "blocked" as const },
        { label: t("stats.overdue"), value: stats.overdue, tone: "blocked" as const },
        { label: t("stats.unassigned"), value: stats.unassigned },
      ]
    : [];

  return (
    <div className="flex min-h-svh flex-col bg-background">
      <header className="sticky top-0 z-30 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-2 px-3 py-2 sm:px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
              <UsersIcon />
            </span>
            <div className="leading-tight">
              <h1 className="text-sm font-medium">{t("app.name")}</h1>
              <p className="hidden text-xs text-muted-foreground sm:block">
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
            className="order-3 w-full sm:order-none sm:ms-3 sm:w-auto"
            aria-label={t("nav.views")}
          >
            {NAV.map((item) => (
              <ToggleGroupItem
                key={item.value}
                value={item.value}
                className="flex-1 gap-1.5 px-1.5 text-xs sm:flex-none sm:px-2"
                aria-label={t(item.labelKey)}
              >
                <item.icon className="size-3.5" />
                <span className="truncate">{t(item.labelKey)}</span>
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
              <ToggleGroupItem value="fa" aria-label={t("app.fa")} className="px-2 text-xs">
                فا
              </ToggleGroupItem>
              <ToggleGroupItem value="en" aria-label={t("app.en")} className="px-2 text-xs">
                EN
              </ToggleGroupItem>
            </ToggleGroup>

            <ThemeToggle className="hidden sm:inline-flex" />

            {currentUser ? (
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={<Button variant="outline" size="sm" />}
                  className="gap-1.5 px-1.5 font-normal"
                  aria-label={t("action.thisIsMe")}
                >
                  <MemberAvatar member={currentUser} size="sm" />
                  <span className="hidden max-w-24 truncate text-xs sm:inline">
                    {memberName(locale, currentUser)}
                  </span>
                  <ChevronDownIcon
                    data-icon="inline-end"
                    className="text-muted-foreground"
                  />
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
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-3 px-3 py-3 sm:px-6">
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
                <Skeleton key={index} className="h-40 rounded-lg" />
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
            {stats ? (
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {statItems.map((item, index) => (
                  <React.Fragment key={item.label}>
                    {index > 0 ? (
                      <span aria-hidden="true" className="text-border">
                        ·
                      </span>
                    ) : null}
                    <span className="tabular-nums">
                      {item.label}{" "}
                      <span
                        className={cn(
                          "font-medium",
                          item.tone === "blocked" && item.value > 0
                            ? "text-destructive"
                            : "text-foreground",
                        )}
                      >
                        {formatNumber(item.value)}
                      </span>
                    </span>
                  </React.Fragment>
                ))}
              </div>
            ) : null}

            {view === "board" || view === "table" ? (
              <FilterBar
                filters={filters}
                onChange={setFilters}
                resultCount={filtered.length}
                unreadCount={unreadTasksCount}
                mentionCount={mentionedTasksCount}
                onMarkAllSeen={markAllSeen}
              />
            ) : null}

            {view === "board" ? (
              <BoardView
                filters={deferredFilters}
                onOpenTask={setOpenTaskId}
                onAddTask={openNewTask}
                activity={activityMap}
              />
            ) : null}

            {view === "table" ? (
              <TableView
                filters={deferredFilters}
                onOpenTask={setOpenTaskId}
                activity={activityMap}
              />
            ) : null}

            {view === "people" ? (
              <PeopleView onOpenTask={setOpenTaskId} onShowTasks={showMemberTasks} />
            ) : null}

            {view === "goals" ? <GoalsView onOpenTask={setOpenTaskId} /> : null}
          </>
        ) : null}
      </main>

      <Separator />
      <footer className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-2 text-xs text-muted-foreground sm:px-6">
        <span className="flex items-center gap-2">
          <span>{storage ? t(`storage.mode.${storage.mode}`) : "—"}</span>
          {realtimeStatus === "connected" ? (
            <span
              className="inline-flex items-center gap-1.5"
              title={t("realtime.connectedTitle")}
            >
              <span className="size-1.5 rounded-full bg-status-done" aria-hidden="true" />
              {t("realtime.live")}
            </span>
          ) : realtimeStatus === "connecting" ? (
            <span
              className="inline-flex items-center gap-1.5"
              title={t("realtime.connectingTitle")}
            >
              <span className="size-1.5 rounded-full bg-status-pending" aria-hidden="true" />
              {t("realtime.connecting")}
            </span>
          ) : null}
        </span>
        <span className="tabular-nums">
          {workspace ? t("app.lastUpdated", { when: formatRelative(locale, workspace.updatedAt) }) : ""}
        </span>
      </footer>

      <TaskSheet
        taskId={openTaskId}
        onOpenChange={(open) => {
          if (!open) setOpenTaskId(null);
        }}
        onSeen={markTaskSeen}
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
