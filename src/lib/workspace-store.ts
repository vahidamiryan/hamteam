import type { MessageKey } from "./i18n";
import type { WorkspacePayload } from "./api-client";
import {
  patchTask,
  removeComment,
  removeGoal,
  removeMember,
  removeTask,
} from "./domain/workspace-patches";
import type { RealtimeLink, RealtimeStatus } from "./realtime";
import type { StorageInfo, Workspace } from "./types";
import type {
  CommentCreateInput,
  GoalCreateInput,
  GoalUpdateInput,
  MemberCreateInput,
  MemberUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "./validation";

/** قرارداد کلاینت HTTP؛ استور به پیاده‌سازی `fetch` وابسته نیست. */
export interface WorkspaceApi {
  workspace(): Promise<WorkspacePayload>;
  reset(): Promise<WorkspacePayload>;
  createTask(input: TaskCreateInput): Promise<WorkspacePayload>;
  updateTask(id: string, input: TaskUpdateInput): Promise<WorkspacePayload>;
  deleteTask(id: string): Promise<WorkspacePayload>;
  addComment(taskId: string, input: CommentCreateInput): Promise<WorkspacePayload>;
  deleteComment(id: string): Promise<WorkspacePayload>;
  createMember(input: MemberCreateInput): Promise<WorkspacePayload>;
  updateMember(id: string, input: MemberUpdateInput): Promise<WorkspacePayload>;
  deleteMember(id: string): Promise<WorkspacePayload>;
  createGoal(input: GoalCreateInput): Promise<WorkspacePayload>;
  updateGoal(id: string, input: GoalUpdateInput): Promise<WorkspacePayload>;
  deleteGoal(id: string): Promise<WorkspacePayload>;
}

/** ماندگاری «من کدام عضو هستم»؛ جدا از استور تا قابل تعویض باشد. */
export interface IdentityStore {
  read(): string | null;
  write(memberId: string): void;
}

/** رویدادهای قابل نمایش؛ متن‌ها در لایهٔ UI ترجمه می‌شوند (استور i18n نمی‌شناسد). */
export type WorkspaceEvent =
  | { type: "success"; key: MessageKey; values?: Record<string, string> }
  | { type: "error"; message: string }
  | { type: "noMember" };

export type WorkspaceNotice = { id: number; event: WorkspaceEvent };

export type WorkspaceStatus = "loading" | "ready" | "error";

export interface WorkspaceSnapshot {
  workspace: Workspace | null;
  storage: StorageInfo | null;
  status: WorkspaceStatus;
  error: string | null;
  realtimeStatus: RealtimeStatus;
  currentUserId: string | null;
  /** آخرین رویدادی که باید به کاربر نشان داده شود؛ UI آن را ترجمه و نمایش می‌دهد. */
  notice: WorkspaceNotice | null;
}

const SERVER_SNAPSHOT: WorkspaceSnapshot = {
  workspace: null,
  storage: null,
  status: "loading",
  error: null,
  realtimeStatus: "offline",
  currentUserId: null,
  notice: null,
};

type Deps = {
  api: WorkspaceApi;
  realtime: RealtimeLink;
  identity: IdentityStore;
};

/**
 * استور فضای کاری: یک کلاس با یک snapshot تغییرناپذیر، الگوی Observer برای
 * اشتراک و یک API دامنه‌محور برای کامپوننت‌ها.
 *
 * - تنها منبع حقیقت است (SRP): هیچ state‌ای در کامپوننت‌ها تکرار نمی‌شود.
 * - وابستگی‌هایش تزریق می‌شوند (DIP): API، همگام‌سازی زنده، هویت و اعلان.
 * - به‌روزرسانی خوش‌بینانه با اشتراک ساختاری انجام می‌شود تا رندر کارت‌های
 *   دست‌نخورده تکرار نشود.
 */
export class WorkspaceStore {
  private snapshot: WorkspaceSnapshot;
  private readonly listeners = new Set<() => void>();
  private disconnectRealtime: (() => void) | null = null;
  private noticeSeq = 0;

  constructor(private readonly deps: Deps) {
    this.snapshot = {
      ...SERVER_SNAPSHOT,
      realtimeStatus: deps.realtime.initialStatus,
    };
  }

  readonly subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  readonly getSnapshot = (): WorkspaceSnapshot => this.snapshot;

  readonly getServerSnapshot = (): WorkspaceSnapshot => SERVER_SNAPSHOT;

  /** بارگذاری اولیه + اتصال زنده + همگام‌سازی هنگام بازگشت به تب. */
  start(): () => void {
    void this.load();
    this.disconnectRealtime = this.deps.realtime.connect({
      onWorkspace: (incoming) => this.applyRemote(incoming),
      onStatus: (realtimeStatus) => this.set({ realtimeStatus }),
    });

    const sync = () => {
      if (typeof document === "undefined") return;
      if (document.visibilityState === "visible") void this.refresh();
    };
    window.addEventListener("focus", sync);
    document.addEventListener("visibilitychange", sync);

    return () => {
      window.removeEventListener("focus", sync);
      document.removeEventListener("visibilitychange", sync);
      this.disconnectRealtime?.();
      this.disconnectRealtime = null;
    };
  }

  async load() {
    try {
      const payload = await this.deps.api.workspace();
      const stored = this.deps.identity.read();
      const known =
        payload.data.members.find((member) => member.id === stored)?.id ??
        payload.data.members[0]?.id ??
        null;
      this.set({
        workspace: payload.data,
        storage: payload.storage,
        status: "ready",
        error: null,
        currentUserId: known,
      });
      if (known) this.deps.identity.write(known);
    } catch (cause) {
      this.fail(cause);
    }
  }

  async refresh() {
    try {
      const payload = await this.deps.api.workspace();
      this.set({
        workspace: payload.data,
        storage: payload.storage,
        status: "ready",
        error: null,
      });
    } catch (cause) {
      this.fail(cause);
    }
  }

  setCurrentUserId(memberId: string) {
    this.deps.identity.write(memberId);
    this.set({ currentUserId: memberId });
  }

  createTask(input: TaskCreateInput) {
    return this.mutate({
      request: () => this.deps.api.createTask(input),
      success: { type: "success", key: "toast.taskCreated" },
    });
  }

  updateTask(taskId: string, input: TaskUpdateInput, options?: { success?: MessageKey }) {
    return this.mutate({
      optimistic: (workspace) => patchTask(workspace, taskId, input),
      request: () => this.deps.api.updateTask(taskId, input),
      success: options?.success ? { type: "success", key: options.success } : undefined,
    });
  }

  deleteTask(taskId: string) {
    return this.mutate({
      optimistic: (workspace) => removeTask(workspace, taskId),
      request: () => this.deps.api.deleteTask(taskId),
      success: { type: "success", key: "toast.taskDeleted" },
    });
  }

  addComment(taskId: string, body: string, bodyEn?: string, attachments?: string[]) {
    const authorId = this.snapshot.currentUserId;
    if (!authorId) {
      this.emit({ type: "noMember" });
      return Promise.resolve(null);
    }
    return this.mutate({
      request: () =>
        this.deps.api.addComment(taskId, { authorId, body, bodyEn, attachments }),
    });
  }

  deleteComment(commentId: string) {
    return this.mutate({
      optimistic: (workspace) => removeComment(workspace, commentId),
      request: () => this.deps.api.deleteComment(commentId),
    });
  }

  createMember(input: MemberCreateInput) {
    return this.mutate({
      request: () => this.deps.api.createMember(input),
      success: { type: "success", key: "toast.memberCreated" },
    });
  }

  updateMember(memberId: string, input: MemberUpdateInput) {
    return this.mutate({
      request: () => this.deps.api.updateMember(memberId, input),
      success: { type: "success", key: "toast.memberUpdated" },
    });
  }

  deleteMember(memberId: string) {
    return this.mutate({
      optimistic: (workspace) => removeMember(workspace, memberId),
      request: () => this.deps.api.deleteMember(memberId),
      success: { type: "success", key: "toast.memberDeleted" },
    });
  }

  createGoal(input: GoalCreateInput) {
    return this.mutate({
      request: () => this.deps.api.createGoal(input),
      success: { type: "success", key: "toast.goalCreated" },
    });
  }

  updateGoal(goalId: string, input: GoalUpdateInput) {
    return this.mutate({
      request: () => this.deps.api.updateGoal(goalId, input),
      success: { type: "success", key: "toast.goalUpdated" },
    });
  }

  deleteGoal(goalId: string) {
    return this.mutate({
      optimistic: (workspace) => removeGoal(workspace, goalId),
      request: () => this.deps.api.deleteGoal(goalId),
      success: { type: "success", key: "toast.goalDeleted" },
    });
  }

  resetDemo() {
    return this.mutate({
      request: () => this.deps.api.reset(),
      success: { type: "success", key: "toast.reset" },
    });
  }

  private async mutate({
    optimistic,
    request,
    success,
  }: {
    optimistic?: (workspace: Workspace) => Workspace;
    request: () => Promise<WorkspacePayload>;
    success?: WorkspaceEvent;
  }): Promise<WorkspacePayload | null> {
    const current = this.snapshot.workspace;
    if (optimistic && current) {
      this.set({ workspace: optimistic(current) });
    }
    try {
      const payload = await request();
      this.set({ workspace: payload.data, storage: payload.storage });
      if (success) this.emit(success);
      return payload;
    } catch (cause) {
      this.emit({
        type: "error",
        message: cause instanceof Error ? cause.message : "",
      });
      await this.refresh();
      return null;
    }
  }

  private applyRemote(incoming: Workspace) {
    const current = this.snapshot.workspace;
    if (current && incoming.version < current.version) return;
    this.set({ workspace: incoming });
  }

  private fail(cause: unknown) {
    const message = cause instanceof Error ? cause.message : "";
    this.set({ error: message, status: "error" });
  }

  private emit(event: WorkspaceEvent) {
    this.noticeSeq += 1;
    this.set({ notice: { id: this.noticeSeq, event } });
  }

  private set(patch: Partial<WorkspaceSnapshot>) {
    this.snapshot = { ...this.snapshot, ...patch };
    for (const listener of this.listeners) listener();
  }
}

export const CURRENT_USER_KEY = "hamteam:current-member";
