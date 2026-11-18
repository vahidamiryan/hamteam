"use client";

import * as React from "react";
import { useLocale } from "@/components/locale-provider";
import { toast } from "@/components/ui/toast";

import { api } from "@/lib/api-client";
import type { MessageKey } from "@/lib/i18n";
import { indexOf, type WorkspaceIndex } from "@/lib/domain/workspace-index";
import { SupabaseRealtimeLink } from "@/lib/realtime";
import type { Member, StorageInfo, Workspace } from "@/lib/types";
import {
  CURRENT_USER_KEY,
  WorkspaceStore,
  type WorkspaceStatus,
} from "@/lib/workspace-store";
import type {
  GoalCreateInput,
  GoalUpdateInput,
  MemberCreateInput,
  MemberUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "@/lib/validation";
import type { RealtimeStatus } from "@/lib/realtime";

/** دسترسی به «من کدام عضو هستم» از مرورگر. */
const browserIdentity = {
  read: () =>
    typeof window === "undefined" ? null : window.localStorage.getItem(CURRENT_USER_KEY),
  write: (memberId: string) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(CURRENT_USER_KEY, memberId);
    }
  },
};

export type WorkspaceActions = {
  setCurrentUserId: (memberId: string) => void;
  refresh: () => Promise<void>;
  createTask: (input: TaskCreateInput) => Promise<unknown>;
  updateTask: (
    taskId: string,
    input: TaskUpdateInput,
    options?: { success?: MessageKey },
  ) => Promise<unknown>;
  deleteTask: (taskId: string) => Promise<unknown>;
  addComment: (
    taskId: string,
    body: string,
    bodyEn?: string,
    attachments?: string[],
  ) => Promise<unknown>;
  deleteComment: (commentId: string) => Promise<unknown>;
  createMember: (input: MemberCreateInput) => Promise<unknown>;
  updateMember: (memberId: string, input: MemberUpdateInput) => Promise<unknown>;
  deleteMember: (memberId: string) => Promise<unknown>;
  createGoal: (input: GoalCreateInput) => Promise<unknown>;
  updateGoal: (goalId: string, input: GoalUpdateInput) => Promise<unknown>;
  deleteGoal: (goalId: string) => Promise<unknown>;
  resetDemo: () => Promise<unknown>;
};

export type WorkspaceState = {
  workspace: Workspace | null;
  storage: StorageInfo | null;
  status: WorkspaceStatus;
  error: string | null;
  realtimeStatus: RealtimeStatus;
  currentUser: Member | null;
  currentUserId: string | null;
  index: WorkspaceIndex | null;
};

const ActionsContext = React.createContext<WorkspaceActions | null>(null);
const StateContext = React.createContext<WorkspaceState | null>(null);

const EMPTY_STATE: WorkspaceState = {
  workspace: null,
  storage: null,
  status: "loading",
  error: null,
  realtimeStatus: "offline",
  currentUser: null,
  currentUserId: null,
  index: null,
};

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { t } = useLocale();

  const [store] = React.useState(
    () =>
      new WorkspaceStore({
        api,
        realtime: new SupabaseRealtimeLink(),
        identity: browserIdentity,
      }),
  );

  const snapshot = React.useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getServerSnapshot,
  );

  React.useEffect(() => store.start(), [store]);

  // رویدادهای استور همین‌جا ترجمه و به توست تبدیل می‌شوند (استور فارسی نمی‌داند).
  const notice = snapshot.notice;
  React.useEffect(() => {
    if (!notice) return;
    const { event } = notice;
    if (event.type === "noMember") {
      toast.add({ title: t("toast.noMember"), type: "error" });
    } else if (event.type === "error") {
      toast.add({ title: t("toast.error", { message: event.message }), type: "error" });
    } else {
      toast.add({ title: t(event.key, event.values), type: "success" });
    }
  }, [notice, t]);

  const actions = React.useMemo<WorkspaceActions>(
    () => ({
      setCurrentUserId: (memberId) => store.setCurrentUserId(memberId),
      refresh: () => store.refresh(),
      createTask: (input) => store.createTask(input),
      updateTask: (taskId, input, options) => store.updateTask(taskId, input, options),
      deleteTask: (taskId) => store.deleteTask(taskId),
      addComment: (taskId, body, bodyEn, attachments) =>
        store.addComment(taskId, body, bodyEn, attachments),
      deleteComment: (commentId) => store.deleteComment(commentId),
      createMember: (input) => store.createMember(input),
      updateMember: (memberId, input) => store.updateMember(memberId, input),
      deleteMember: (memberId) => store.deleteMember(memberId),
      createGoal: (input) => store.createGoal(input),
      updateGoal: (goalId, input) => store.updateGoal(goalId, input),
      deleteGoal: (goalId) => store.deleteGoal(goalId),
      resetDemo: () => store.resetDemo(),
    }),
    [store],
  );

  const state = React.useMemo<WorkspaceState>(() => {
    if (!snapshot.workspace) {
      return {
        ...EMPTY_STATE,
        storage: snapshot.storage,
        status: snapshot.status,
        error: snapshot.error,
        realtimeStatus: snapshot.realtimeStatus,
        currentUserId: snapshot.currentUserId,
      };
    }
    const index = indexOf(snapshot.workspace);
    const currentUser =
      index.member(snapshot.currentUserId) ?? snapshot.workspace.members[0] ?? null;
    return {
      workspace: snapshot.workspace,
      storage: snapshot.storage,
      status: snapshot.status,
      error: snapshot.error,
      realtimeStatus: snapshot.realtimeStatus,
      currentUser,
      currentUserId: currentUser?.id ?? null,
      index,
    };
  }, [snapshot]);

  return (
    <ActionsContext.Provider value={actions}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </ActionsContext.Provider>
  );
}

function useWorkspaceState(): WorkspaceState {
  return React.useContext(StateContext) ?? EMPTY_STATE;
}

function useWorkspaceActions(): WorkspaceActions {
  const actions = React.useContext(ActionsContext);
  if (!actions) throw new Error("useWorkspace باید داخل WorkspaceProvider استفاده شود.");
  return actions;
}

/** API عمومی: داده + اعمال‌ها، مثل قبل برای همهٔ کامپوننت‌ها. */
export function useWorkspace() {
  const state = useWorkspaceState();
  const actions = useWorkspaceActions();
  return React.useMemo(() => ({ ...state, ...actions }), [state, actions]);
}

/** فقط وضعیت؛ بدون اعمال‌ها. */
export { useWorkspaceState };

/** فقط ایندکس؛ برای کامپوننت‌هایی که به اعمال‌ها کاری ندارند. */
export function useWorkspaceIndex(): WorkspaceIndex | null {
  return useWorkspaceState().index;
}

/** فقط اعمال‌ها؛ شناسهٔ پایدار، پس با تغییر داده‌ها رندر دوباره نمی‌شود. */
export { useWorkspaceActions };
