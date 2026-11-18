"use client";

import * as React from "react";
import { toast } from "sonner";

import { api, type WorkspacePayload } from "@/lib/api-client";
import type { Member, StorageInfo, Task, Workspace } from "@/lib/types";
import type {
  GoalCreateInput,
  GoalUpdateInput,
  MemberCreateInput,
  MemberUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "@/lib/validation";

const CURRENT_USER_KEY = "hamteam:current-member";

type MutateOptions = {
  /** تغییر خوش‌بینانه روی نسخه‌ی محلی، قبل از پاسخ سرور. */
  optimistic?: (workspace: Workspace) => void;
  request: () => Promise<WorkspacePayload>;
  success?: string;
};

type WorkspaceContextValue = {
  workspace: Workspace | null;
  storage: StorageInfo | null;
  status: "loading" | "ready" | "error";
  error: string | null;
  currentUser: Member | null;
  setCurrentUserId: (memberId: string) => void;
  refresh: () => Promise<void>;
  mutate: (options: MutateOptions) => Promise<WorkspacePayload | null>;
  createTask: (input: TaskCreateInput) => Promise<WorkspacePayload | null>;
  updateTask: (
    taskId: string,
    input: TaskUpdateInput,
    options?: { success?: string },
  ) => Promise<WorkspacePayload | null>;
  deleteTask: (taskId: string) => Promise<WorkspacePayload | null>;
  addComment: (taskId: string, body: string) => Promise<WorkspacePayload | null>;
  deleteComment: (commentId: string) => Promise<WorkspacePayload | null>;
  createMember: (input: MemberCreateInput) => Promise<WorkspacePayload | null>;
  updateMember: (
    memberId: string,
    input: MemberUpdateInput,
  ) => Promise<WorkspacePayload | null>;
  deleteMember: (memberId: string) => Promise<WorkspacePayload | null>;
  createGoal: (input: GoalCreateInput) => Promise<WorkspacePayload | null>;
  updateGoal: (
    goalId: string,
    input: GoalUpdateInput,
  ) => Promise<WorkspacePayload | null>;
  deleteGoal: (goalId: string) => Promise<WorkspacePayload | null>;
  resetDemo: () => Promise<WorkspacePayload | null>;
};

const WorkspaceContext = React.createContext<WorkspaceContextValue | null>(null);

function applyOptimisticTaskPatch(
  workspace: Workspace,
  taskId: string,
  patch: TaskUpdateInput,
) {
  const task = workspace.tasks.find((item) => item.id === taskId);
  if (!task) return;
  const now = new Date().toISOString();

  if (patch.title !== undefined) task.title = patch.title;
  if (patch.description !== undefined) task.description = patch.description;
  if (patch.priority !== undefined) task.priority = patch.priority;
  if (patch.assigneeId !== undefined) task.assigneeId = patch.assigneeId;
  if (patch.goalId !== undefined) task.goalId = patch.goalId;
  if (patch.dueDate !== undefined) task.dueDate = patch.dueDate;
  if (patch.blockedReason !== undefined) {
    task.blockedReason = patch.blockedReason?.trim() || null;
  }
  if (patch.status !== undefined && patch.status !== task.status) {
    task.status = patch.status;
    task.completedAt = patch.status === "done" ? now : null;
    if (patch.status !== "blocked" && patch.blockedReason === undefined) {
      task.blockedReason = null;
    }
  }
  task.updatedAt = now;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [workspace, setWorkspace] = React.useState<Workspace | null>(null);
  const [storage, setStorage] = React.useState<StorageInfo | null>(null);
  const [status, setStatus] = React.useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = React.useState<string | null>(null);
  const [currentUserId, setCurrentUserIdState] = React.useState<string | null>(null);

  // بارگذاری اولیه: کاربر فعال از مرورگر بازیابی می‌شود و سپس فضای کاری خوانده می‌شود.
  React.useEffect(() => {
    let active = true;

    async function bootstrap() {
      const stored = window.localStorage.getItem(CURRENT_USER_KEY);
      try {
        const payload = await api.workspace();
        if (!active) return;
        const fallback = payload.data.members[0]?.id ?? null;
        const known = payload.data.members.some((member) => member.id === stored)
          ? stored
          : fallback;
        setWorkspace(payload.data);
        setStorage(payload.storage);
        setCurrentUserIdState(known);
        setError(null);
        setStatus("ready");
        if (known) window.localStorage.setItem(CURRENT_USER_KEY, known);
      } catch (cause) {
        if (!active) return;
        setError(cause instanceof Error ? cause.message : "خطای نامشخص");
        setStatus("error");
      }
    }

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  const refresh = React.useCallback(async () => {
    try {
      const payload = await api.workspace();
      setWorkspace(payload.data);
      setStorage(payload.storage);
      setError(null);
      setStatus("ready");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "خطای نامشخص");
      setStatus("error");
    }
  }, []);

  const setCurrentUserId = React.useCallback((memberId: string) => {
    setCurrentUserIdState(memberId);
    window.localStorage.setItem(CURRENT_USER_KEY, memberId);
  }, []);

  const mutate = React.useCallback(
    async ({ optimistic, request, success }: MutateOptions) => {
      if (optimistic) {
        setWorkspace((current) => {
          if (!current) return current;
          const draft = structuredClone(current);
          optimistic(draft);
          return draft;
        });
      }
      try {
        const payload = await request();
        setWorkspace(payload.data);
        setStorage(payload.storage);
        if (success) toast.success(success);
        return payload;
      } catch (cause) {
        toast.error(cause instanceof Error ? cause.message : "خطای نامشخص");
        // وضعیت محلی را با واقعیت سرور هم‌تراز می‌کنیم.
        await refresh();
        return null;
      }
    },
    [refresh],
  );

  const value = React.useMemo<WorkspaceContextValue>(() => {
    // اگر عضو انتخاب‌شده حذف شده باشد، اولین عضو تیم به‌عنوان «من» در نظر گرفته می‌شود.
    const currentUser =
      workspace?.members.find((member) => member.id === currentUserId) ??
      workspace?.members[0] ??
      null;
    const actorId = currentUser?.id ?? null;

    return {
      workspace,
      storage,
      status,
      error,
      currentUser,
      setCurrentUserId,
      refresh,
      mutate,

      createTask: (input) =>
        mutate({ request: () => api.createTask(input), success: "تسک ساخته شد" }),

      updateTask: (taskId, input, options) =>
        mutate({
          optimistic: (draft) => applyOptimisticTaskPatch(draft, taskId, input),
          request: () => api.updateTask(taskId, input),
          success: options?.success,
        }),

      deleteTask: (taskId) =>
        mutate({
          optimistic: (draft) => {
            draft.tasks = draft.tasks.filter((task) => task.id !== taskId);
            draft.comments = draft.comments.filter(
              (comment) => comment.taskId !== taskId,
            );
          },
          request: () => api.deleteTask(taskId),
          success: "تسک حذف شد",
        }),

      addComment: (taskId, body) => {
        if (!actorId) {
          toast.error("اول مشخص کنید شما کدام عضو تیم هستید.");
          return Promise.resolve(null);
        }
        return mutate({
          request: () => api.addComment(taskId, { authorId: actorId, body }),
        });
      },

      deleteComment: (commentId) =>
        mutate({
          optimistic: (draft) => {
            draft.comments = draft.comments.filter(
              (comment) => comment.id !== commentId,
            );
          },
          request: () => api.deleteComment(commentId),
        }),

      createMember: (input) =>
        mutate({ request: () => api.createMember(input), success: "عضو تیم اضافه شد" }),

      updateMember: (memberId, input) =>
        mutate({
          request: () => api.updateMember(memberId, input),
          success: "اطلاعات عضو ذخیره شد",
        }),

      deleteMember: (memberId) =>
        mutate({
          optimistic: (draft) => {
            draft.members = draft.members.filter((member) => member.id !== memberId);
            for (const task of draft.tasks) {
              if (task.assigneeId === memberId) task.assigneeId = null;
            }
            for (const goal of draft.goals) {
              if (goal.ownerId === memberId) goal.ownerId = null;
            }
          },
          request: () => api.deleteMember(memberId),
          success: "عضو حذف شد",
        }),

      createGoal: (input) =>
        mutate({ request: () => api.createGoal(input), success: "هدف ساخته شد" }),

      updateGoal: (goalId, input) =>
        mutate({ request: () => api.updateGoal(goalId, input), success: "هدف ذخیره شد" }),

      deleteGoal: (goalId) =>
        mutate({
          optimistic: (draft) => {
            draft.goals = draft.goals.filter((goal) => goal.id !== goalId);
            for (const task of draft.tasks) {
              if (task.goalId === goalId) task.goalId = null;
            }
          },
          request: () => api.deleteGoal(goalId),
          success: "هدف حذف شد",
        }),

      resetDemo: () =>
        mutate({ request: () => api.reset(), success: "داده‌ی نمونه بازنشانی شد" }),
    };
  }, [workspace, storage, status, error, currentUserId, setCurrentUserId, refresh, mutate]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace(): WorkspaceContextValue {
  const context = React.useContext(WorkspaceContext);
  if (!context) {
    throw new Error("useWorkspace باید داخل WorkspaceProvider استفاده شود.");
  }
  return context;
}

export type { Task };
