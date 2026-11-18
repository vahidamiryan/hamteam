import { daysUntil } from "../dates";
import { PRIORITY_META } from "../labels";
import type { Comment, Goal, Member, Task, TaskStatus, Workspace } from "../types";

export interface WorkspaceStats {
  total: number;
  open: number;
  inProgress: number;
  blocked: number;
  done: number;
  overdue: number;
  unassigned: number;
}

export interface MemberStats {
  total: number;
  open: number;
  inProgress: number;
  blocked: number;
  done: number;
  overdue: number;
}

export interface GoalProgress {
  total: number;
  done: number;
  blocked: number;
  percent: number;
}

export function isOpen(task: Task): boolean {
  return task.status !== "done";
}

export function isOverdue(task: Task, now: Date = new Date()): boolean {
  if (!task.dueDate || task.status === "done") return false;
  const days = daysUntil(task.dueDate, now);
  return days !== null && days < 0;
}

/**
 * فهرست فضای کاری: یک لایهٔ ماندگار برای جست‌وجوی O(1) روی اعضا، هدف‌ها، تسک‌ها
 * و گفت‌وگوهای هر تسک.
 *
 * چرا کلاس؟ چون کارش دقیقاً یکی است (SRP): تبدیل یک سند خام به ساختار قابل
 * جست‌وجو. کامپوننت‌ها دیگر برای هر کارت کل آرایه‌ها را نمی‌گردند و هر سند
 * تازه فقط یک‌بار ایندکس می‌شود (`indexOf` مثل Flyweight عمل می‌کند).
 */
export class WorkspaceIndex {
  private readonly members = new Map<string, Member>();
  private readonly goals = new Map<string, Goal>();
  private readonly tasks = new Map<string, Task>();
  private readonly commentsByTask = new Map<string, Comment[]>();
  private readonly tasksByGoal = new Map<string, Task[]>();
  private readonly tasksByAssignee = new Map<string, Task[]>();
  private readonly searchBlobs = new Map<string, string>();

  private statsCache: WorkspaceStats | null = null;
  private memberStatsCache = new Map<string, MemberStats>();
  private goalProgressCache = new Map<string, GoalProgress>();

  constructor(readonly workspace: Workspace) {
    for (const member of workspace.members) this.members.set(member.id, member);
    for (const goal of workspace.goals) this.goals.set(goal.id, goal);
    for (const task of workspace.tasks) {
      this.tasks.set(task.id, task);
      if (task.goalId) push(this.tasksByGoal, task.goalId, task);
      if (task.assigneeId) push(this.tasksByAssignee, task.assigneeId, task);
    }
    for (const comment of workspace.comments) {
      push(this.commentsByTask, comment.taskId, comment);
    }
    for (const list of this.commentsByTask.values()) {
      list.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    }
  }

  get membersList(): readonly Member[] {
    return this.workspace.members;
  }

  get goalsList(): readonly Goal[] {
    return this.workspace.goals;
  }

  get tasksList(): readonly Task[] {
    return this.workspace.tasks;
  }

  member(id: string | null | undefined): Member | null {
    if (!id) return null;
    return this.members.get(id) ?? null;
  }

  goal(id: string | null | undefined): Goal | null {
    if (!id) return null;
    return this.goals.get(id) ?? null;
  }

  task(id: string | null | undefined): Task | null {
    if (!id) return null;
    return this.tasks.get(id) ?? null;
  }

  /** گفت‌وگوهای یک تسک، مرتب بر اساس زمان. */
  comments(taskId: string): readonly Comment[] {
    return this.commentsByTask.get(taskId) ?? EMPTY_COMMENTS;
  }

  commentCount(taskId: string): number {
    return this.commentsByTask.get(taskId)?.length ?? 0;
  }

  tasksForGoal(goalId: string): readonly Task[] {
    return this.tasksByGoal.get(goalId) ?? EMPTY_TASKS;
  }

  tasksForMember(memberId: string): readonly Task[] {
    return this.tasksByAssignee.get(memberId) ?? EMPTY_TASKS;
  }

  /** متن جست‌وجوی یک تسک؛ یک‌بار ساخته می‌شود تا هر کلید جست‌وجو ارزان باشد. */
  searchText(task: Task): string {
    const cached = this.searchBlobs.get(task.id);
    if (cached !== undefined) return cached;
    const blob = [
      task.title,
      task.titleEn,
      task.description,
      task.descriptionEn,
      task.blockedReason,
      task.blockedReasonEn,
    ]
      .filter(Boolean)
      .join("\n")
      .toLowerCase();
    this.searchBlobs.set(task.id, blob);
    return blob;
  }

  stats(now: Date = new Date()): WorkspaceStats {
    if (this.statsCache) return this.statsCache;
    const counts: Record<TaskStatus, number> = {
      backlog: 0,
      in_progress: 0,
      pending: 0,
      blocked: 0,
      done: 0,
    };
    let overdue = 0;
    let unassigned = 0;
    for (const task of this.workspace.tasks) {
      counts[task.status] += 1;
      if (isOverdue(task, now)) overdue += 1;
      if (isOpen(task) && !task.assigneeId) unassigned += 1;
    }
    this.statsCache = {
      total: this.workspace.tasks.length,
      open: counts.backlog + counts.in_progress + counts.pending + counts.blocked,
      inProgress: counts.in_progress,
      blocked: counts.blocked,
      done: counts.done,
      overdue,
      unassigned,
    };
    return this.statsCache;
  }

  memberStats(memberId: string, now: Date = new Date()): MemberStats {
    const cached = this.memberStatsCache.get(memberId);
    if (cached) return cached;
    const tasks = this.tasksForMember(memberId);
    const stats: MemberStats = {
      total: tasks.length,
      open: tasks.filter(isOpen).length,
      inProgress: tasks.filter((task) => task.status === "in_progress").length,
      blocked: tasks.filter((task) => task.status === "blocked").length,
      done: tasks.filter((task) => task.status === "done").length,
      overdue: tasks.filter((task) => isOverdue(task, now)).length,
    };
    this.memberStatsCache.set(memberId, stats);
    return stats;
  }

  goalProgress(goalId: string): GoalProgress {
    const cached = this.goalProgressCache.get(goalId);
    if (cached) return cached;
    const tasks = this.tasksForGoal(goalId);
    const done = tasks.filter((task) => task.status === "done").length;
    const blocked = tasks.filter((task) => task.status === "blocked").length;
    const progress: GoalProgress = {
      total: tasks.length,
      done,
      blocked,
      percent: tasks.length === 0 ? 0 : Math.round((done / tasks.length) * 100),
    };
    this.goalProgressCache.set(goalId, progress);
    return progress;
  }
}

const EMPTY_COMMENTS: readonly Comment[] = Object.freeze([]);
const EMPTY_TASKS: readonly Task[] = Object.freeze([]);

function push<K, V>(map: Map<K, V[]>, key: K, value: V) {
  const list = map.get(key);
  if (list) list.push(value);
  else map.set(key, [value]);
}

const indexCache = new WeakMap<Workspace, WorkspaceIndex>();

/** ایندکس مشترک برای هر نسخهٔ سند؛ سند تازه = ایندکس تازه. */
export function indexOf(workspace: Workspace): WorkspaceIndex {
  const cached = indexCache.get(workspace);
  if (cached) return cached;
  const created = new WorkspaceIndex(workspace);
  indexCache.set(workspace, created);
  return created;
}

/** ترتیب پیش‌فرض کارت‌ها: اولویت بالاتر، بعد سررسید نزدیک‌تر، بعد جدیدتر. */
export function compareTasks(a: Task, b: Task): number {
  const priority = PRIORITY_META[b.priority].weight - PRIORITY_META[a.priority].weight;
  if (priority !== 0) return priority;
  if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) {
    return a.dueDate.localeCompare(b.dueDate);
  }
  if (a.dueDate && !b.dueDate) return -1;
  if (!a.dueDate && b.dueDate) return 1;
  return b.createdAt.localeCompare(a.createdAt);
}
