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

export type WorkspacePayload = {
  data: Workspace;
  storage: StorageInfo;
  result?: unknown;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(init?.headers ?? {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && "error" in body
        ? String((body as { error: unknown }).error)
        : "درخواست ناموفق بود. اتصال شبکه را بررسی کنید.";
    throw new Error(message);
  }

  return body as T;
}

const json = (payload: unknown): RequestInit => ({
  method: "POST",
  body: JSON.stringify(payload),
});

const patch = (payload: unknown): RequestInit => ({
  method: "PATCH",
  body: JSON.stringify(payload),
});

export const api = {
  workspace: () => request<WorkspacePayload>("/api/workspace"),
  reset: () => request<WorkspacePayload>("/api/workspace/reset", { method: "POST" }),

  createTask: (input: TaskCreateInput) =>
    request<WorkspacePayload>("/api/tasks", json(input)),
  updateTask: (id: string, input: TaskUpdateInput) =>
    request<WorkspacePayload>(`/api/tasks/${id}`, patch(input)),
  deleteTask: (id: string) =>
    request<WorkspacePayload>(`/api/tasks/${id}`, { method: "DELETE" }),

  addComment: (taskId: string, input: CommentCreateInput) =>
    request<WorkspacePayload>(`/api/tasks/${taskId}/comments`, json(input)),
  deleteComment: (id: string) =>
    request<WorkspacePayload>(`/api/comments/${id}`, { method: "DELETE" }),

  createMember: (input: MemberCreateInput) =>
    request<WorkspacePayload>("/api/members", json(input)),
  updateMember: (id: string, input: MemberUpdateInput) =>
    request<WorkspacePayload>(`/api/members/${id}`, patch(input)),
  deleteMember: (id: string) =>
    request<WorkspacePayload>(`/api/members/${id}`, { method: "DELETE" }),

  createGoal: (input: GoalCreateInput) =>
    request<WorkspacePayload>("/api/goals", json(input)),
  updateGoal: (id: string, input: GoalUpdateInput) =>
    request<WorkspacePayload>(`/api/goals/${id}`, patch(input)),
  deleteGoal: (id: string) =>
    request<WorkspacePayload>(`/api/goals/${id}`, { method: "DELETE" }),
};
