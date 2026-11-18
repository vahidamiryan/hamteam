import { compareTasks, isOverdue, type WorkspaceIndex } from "./workspace-index";
import type { Task, TaskStatus } from "../types";

/** شرطی‌های فیلتر به‌صورت مستقل؛ افزودن شرط تازه نیازی به تغییر بقیه ندارد. */
export interface TaskPredicate {
  matches(task: Task): boolean;
}

export type TaskFilterOptions = {
  /** اگر تعیین نشود، همهٔ وضعیت‌ها برمی‌گردند. */
  status?: TaskStatus | null;
  search?: string;
  assigneeId?: string | null;
  onlyOverdue?: boolean;
  /** فقط تسک‌های دارای تغییر جدید برای کاربر جاری */
  onlyTracking?: boolean;
  /** فقط تسک‌هایی که کاربر در آن‌ها منشن شده است */
  onlyMentioned?: boolean;
};

export type TaskFilterExtras = {
  activity?: Record<string, { hasChanges: boolean; hasUnreadMention: boolean }>;
};

class StatusPredicate implements TaskPredicate {
  constructor(private readonly status: TaskStatus) {}
  matches(task: Task) {
    return task.status === this.status;
  }
}

class AssigneePredicate implements TaskPredicate {
  constructor(private readonly assigneeId: string) {}
  matches(task: Task) {
    return task.assigneeId === this.assigneeId;
  }
}

class OverduePredicate implements TaskPredicate {
  constructor(private readonly now: Date) {}
  matches(task: Task) {
    return isOverdue(task, this.now);
  }
}

class ActivityPredicate implements TaskPredicate {
  constructor(
    private readonly activity: NonNullable<TaskFilterExtras["activity"]>,
    private readonly mode: "any" | "mention",
  ) {}
  matches(task: Task) {
    const state = this.activity[task.id];
    return this.mode === "mention" ? Boolean(state?.hasUnreadMention) : Boolean(state?.hasChanges);
  }
}

class SearchPredicate implements TaskPredicate {
  constructor(
    private readonly needle: string,
    private readonly index: WorkspaceIndex,
  ) {}
  matches(task: Task) {
    return this.index.searchText(task).includes(this.needle);
  }
}

/**
 * پرس‌وجوی تسک‌ها: شرط‌ها یک‌بار ساخته می‌شوند و روی هر تسک فقط اجرا می‌شوند.
 * جست‌وجو از متن نرمال‌شدهٔ ایندکس استفاده می‌کند، پس `toLowerCase` در هر کلید
 * و برای هر تسک تکرار نمی‌شود.
 */
export class TaskQuery {
  private constructor(
    private readonly predicates: TaskPredicate[],
    private readonly sort: (a: Task, b: Task) => number,
  ) {}

  static from(
    options: TaskFilterOptions,
    index: WorkspaceIndex,
    extras: TaskFilterExtras = {},
    now: Date = new Date(),
  ): TaskQuery {
    const predicates: TaskPredicate[] = [];
    if (options.status) predicates.push(new StatusPredicate(options.status));
    if (options.assigneeId) predicates.push(new AssigneePredicate(options.assigneeId));
    if (options.onlyOverdue) predicates.push(new OverduePredicate(now));
    if (options.onlyTracking && extras.activity) {
      predicates.push(new ActivityPredicate(extras.activity, "any"));
    }
    if (options.onlyMentioned && extras.activity) {
      predicates.push(new ActivityPredicate(extras.activity, "mention"));
    }
    const needle = (options.search ?? "").trim().toLowerCase();
    if (needle) predicates.push(new SearchPredicate(needle, index));
    return new TaskQuery(predicates, compareTasks);
  }

  matches(task: Task): boolean {
    for (const predicate of this.predicates) {
      if (!predicate.matches(task)) return false;
    }
    return true;
  }

  /** تسک‌های منطبق، مرتب‌شده. */
  select(index: WorkspaceIndex): Task[] {
    const result: Task[] = [];
    for (const task of index.tasksList) {
      if (this.matches(task)) result.push(task);
    }
    return result.sort(this.sort);
  }
}
