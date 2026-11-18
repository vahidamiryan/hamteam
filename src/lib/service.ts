import { randomAvatarIndex } from "./avatars";
import { newId } from "./ids";
import { ApiError } from "./http";
import { resetWorkspace, updateWorkspace } from "./storage";
import type { StorageInfo, Task, Workspace } from "./types";
import type {
  CommentCreateInput,
  GoalCreateInput,
  GoalUpdateInput,
  MemberCreateInput,
  MemberUpdateInput,
  TaskCreateInput,
  TaskUpdateInput,
} from "./validation";

type ServiceResult<T> = {
  workspace: Workspace;
  storage: StorageInfo;
  result: T;
};

function requireMember(workspace: Workspace, memberId: string | null | undefined) {
  if (!memberId) return;
  if (!workspace.members.some((member) => member.id === memberId)) {
    throw new ApiError(400, "عضوی که انتخاب کرده‌اید پیدا نشد.");
  }
}

function requireGoal(workspace: Workspace, goalId: string | null | undefined) {
  if (!goalId) return;
  if (!workspace.goals.some((goal) => goal.id === goalId)) {
    throw new ApiError(400, "هدفی که انتخاب کرده‌اید پیدا نشد.");
  }
}

function findTask(workspace: Workspace, taskId: string): Task {
  const task = workspace.tasks.find((item) => item.id === taskId);
  if (!task) throw new ApiError(404, "تسک پیدا نشد.");
  return task;
}

/** منطق دامنه؛ رووت‌ها فقط ورودی را اعتبارسنجی و خروجی را برمی‌گردانند. */
export const workspaceService = {
  createTask(input: TaskCreateInput): Promise<ServiceResult<Task>> {
    const id = newId("task");
    return updateWorkspace((workspace) => {
      requireMember(workspace, input.assigneeId);
      requireGoal(workspace, input.goalId);

      const now = new Date().toISOString();
      const status = input.status ?? "backlog";
      const task: Task = {
        id,
        title: input.title,
        titleEn: input.titleEn?.trim() || undefined,
        description: input.description?.trim() ?? "",
        descriptionEn: input.descriptionEn?.trim() || undefined,
        status,
        priority: input.priority ?? "medium",
        assigneeId: input.assigneeId ?? null,
        goalId: input.goalId ?? null,
        dueDate: input.dueDate ?? null,
        blockedReason:
          status === "blocked" ? (input.blockedReason?.trim() || null) : null,
        blockedReasonEn:
          status === "blocked" ? input.blockedReasonEn?.trim() || undefined : undefined,
        createdAt: now,
        updatedAt: now,
        completedAt: status === "done" ? now : null,
      };
      workspace.tasks.unshift(task);
      return task;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  updateTask(taskId: string, input: TaskUpdateInput): Promise<ServiceResult<Task>> {
    return updateWorkspace((workspace) => {
      const task = findTask(workspace, taskId);
      if (input.assigneeId !== undefined) requireMember(workspace, input.assigneeId);
      if (input.goalId !== undefined) requireGoal(workspace, input.goalId);

      const now = new Date().toISOString();

      if (input.title !== undefined) task.title = input.title;
      if (input.titleEn !== undefined) task.titleEn = input.titleEn.trim() || undefined;
      if (input.description !== undefined) task.description = input.description;
      if (input.descriptionEn !== undefined) {
        task.descriptionEn = input.descriptionEn.trim() || undefined;
      }
      if (input.priority !== undefined) task.priority = input.priority;
      if (input.assigneeId !== undefined) task.assigneeId = input.assigneeId;
      if (input.goalId !== undefined) task.goalId = input.goalId;
      if (input.dueDate !== undefined) task.dueDate = input.dueDate;

      if (input.blockedReason !== undefined) {
        task.blockedReason = input.blockedReason?.trim() || null;
      }
      if (input.blockedReasonEn !== undefined) {
        task.blockedReasonEn = input.blockedReasonEn.trim() || undefined;
      }

      if (input.status !== undefined && input.status !== task.status) {
        task.status = input.status;
        task.completedAt = input.status === "done" ? now : null;
        if (input.status !== "blocked" && input.blockedReason === undefined) {
          task.blockedReason = null;
        }
      }

      task.updatedAt = now;
      return task;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  deleteTask(taskId: string): Promise<ServiceResult<{ id: string }>> {
    return updateWorkspace((workspace) => {
      findTask(workspace, taskId);
      workspace.tasks = workspace.tasks.filter((task) => task.id !== taskId);
      workspace.comments = workspace.comments.filter(
        (comment) => comment.taskId !== taskId,
      );
      return { id: taskId };
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  addComment(taskId: string, input: CommentCreateInput) {
    const id = newId("cmt");
    return updateWorkspace((workspace) => {
      requireMember(workspace, input.authorId);
      const task = findTask(workspace, taskId);
      const comment = {
        id,
        taskId,
        authorId: input.authorId,
        body: input.body,
        bodyEn: input.bodyEn?.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      workspace.comments.push(comment);
      task.updatedAt = comment.createdAt;
      return comment;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  deleteComment(commentId: string): Promise<ServiceResult<{ id: string }>> {
    return updateWorkspace((workspace) => {
      const exists = workspace.comments.some((comment) => comment.id === commentId);
      if (!exists) throw new ApiError(404, "کامنت پیدا نشد.");
      workspace.comments = workspace.comments.filter(
        (comment) => comment.id !== commentId,
      );
      return { id: commentId };
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  createMember(input: MemberCreateInput) {
    const id = newId("mem");
    return updateWorkspace((workspace) => {
      const duplicate = workspace.members.some(
        (member) => member.name.trim() === input.name.trim(),
      );
      if (duplicate) throw new ApiError(409, "عضوی با این نام از قبل وجود دارد.");

      const member = {
        id,
        name: input.name,
        nameEn: input.nameEn?.trim() || undefined,
        role: input.role?.trim() ?? "",
        roleEn: input.roleEn?.trim() || undefined,
        email: input.email?.trim() ?? "",
        avatarIndex: input.avatarIndex ?? randomAvatarIndex(),
        createdAt: new Date().toISOString(),
      };
      workspace.members.push(member);
      return member;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  updateMember(memberId: string, input: MemberUpdateInput) {
    return updateWorkspace((workspace) => {
      const member = workspace.members.find((item) => item.id === memberId);
      if (!member) throw new ApiError(404, "عضو پیدا نشد.");
      if (input.name !== undefined) member.name = input.name;
      if (input.nameEn !== undefined) member.nameEn = input.nameEn.trim() || undefined;
      if (input.role !== undefined) member.role = input.role.trim();
      if (input.roleEn !== undefined) member.roleEn = input.roleEn.trim() || undefined;
      if (input.email !== undefined) member.email = input.email.trim();
      if (input.avatarIndex !== undefined) member.avatarIndex = input.avatarIndex;
      return member;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  deleteMember(memberId: string): Promise<ServiceResult<{ id: string }>> {
    return updateWorkspace((workspace) => {
      const exists = workspace.members.some((member) => member.id === memberId);
      if (!exists) throw new ApiError(404, "عضو پیدا نشد.");
      workspace.members = workspace.members.filter((member) => member.id !== memberId);
      for (const task of workspace.tasks) {
        if (task.assigneeId === memberId) task.assigneeId = null;
      }
      for (const goal of workspace.goals) {
        if (goal.ownerId === memberId) goal.ownerId = null;
      }
      return { id: memberId };
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  createGoal(input: GoalCreateInput) {
    const id = newId("goal");
    return updateWorkspace((workspace) => {
      requireMember(workspace, input.ownerId);
      const goal = {
        id,
        title: input.title,
        titleEn: input.titleEn?.trim() || undefined,
        description: input.description?.trim() ?? "",
        descriptionEn: input.descriptionEn?.trim() || undefined,
        ownerId: input.ownerId ?? null,
        targetDate: input.targetDate ?? null,
        status: input.status ?? ("active" as const),
        createdAt: new Date().toISOString(),
      };
      workspace.goals.unshift(goal);
      return goal;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  updateGoal(goalId: string, input: GoalUpdateInput) {
    return updateWorkspace((workspace) => {
      const goal = workspace.goals.find((item) => item.id === goalId);
      if (!goal) throw new ApiError(404, "هدف پیدا نشد.");
      if (input.ownerId !== undefined) requireMember(workspace, input.ownerId);
      if (input.title !== undefined) goal.title = input.title;
      if (input.titleEn !== undefined) goal.titleEn = input.titleEn.trim() || undefined;
      if (input.description !== undefined) goal.description = input.description.trim();
      if (input.descriptionEn !== undefined) {
        goal.descriptionEn = input.descriptionEn.trim() || undefined;
      }
      if (input.ownerId !== undefined) goal.ownerId = input.ownerId;
      if (input.targetDate !== undefined) goal.targetDate = input.targetDate;
      if (input.status !== undefined) goal.status = input.status;
      return goal;
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  deleteGoal(goalId: string): Promise<ServiceResult<{ id: string }>> {
    return updateWorkspace((workspace) => {
      const exists = workspace.goals.some((goal) => goal.id === goalId);
      if (!exists) throw new ApiError(404, "هدف پیدا نشد.");
      workspace.goals = workspace.goals.filter((goal) => goal.id !== goalId);
      for (const task of workspace.tasks) {
        if (task.goalId === goalId) task.goalId = null;
      }
      return { id: goalId };
    }).then(({ workspace, storage, result }) => ({
      workspace,
      storage,
      result,
    }));
  },

  async reset() {
    const { workspace, storage } = await resetWorkspace();
    return { workspace, storage, result: workspace };
  },
};
