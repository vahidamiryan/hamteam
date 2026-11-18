"use client";

import * as React from "react";

import {
  getSeenServerSnapshot,
  getSeenSnapshot,
  markTaskSeen as markTaskSeenInStore,
  markTasksSeen,
  subscribeSeen,
  type SeenDoc,
} from "./seen-store";
import { isUserMentioned } from "./mentions";
import type { Member, Task, Workspace } from "./types";

/** وضعیت «دیده‌نشده» یک تسک برای کاربر جاری. */
export interface TaskActivityState {
  hasChanges: boolean;
  hasUnreadMention: boolean;
  unreadCommentsCount: number;
}

export type ActivityMap = Record<string, TaskActivityState>;

const IDLE: TaskActivityState = {
  hasChanges: false,
  hasUnreadMention: false,
  unreadCommentsCount: 0,
};

/** وضعیت یک تسک را از سند «دیده‌شده» و فضای کاری می‌سازد. */
export function activityForTask(
  workspace: Workspace,
  task: Task,
  user: Member | null,
  doc: SeenDoc | null,
): TaskActivityState {
  if (!user) return IDLE;
  const since = doc?.seen[task.id] ?? doc?.baseline ?? null;
  if (!since) return IDLE;

  const unread = workspace.comments.filter(
    (comment) =>
      comment.taskId === task.id &&
      comment.authorId !== user.id &&
      comment.createdAt > since,
  );
  const hasUnreadMention = unread.some(
    (comment) => isUserMentioned(comment.body, user) || isUserMentioned(comment.bodyEn, user),
  );
  const hasChanges = hasUnreadMention || unread.length > 0 || task.updatedAt > since;

  return { hasChanges, hasUnreadMention, unreadCommentsCount: unread.length };
}

function parseSeen(raw: string): SeenDoc | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<SeenDoc>;
    if (typeof parsed?.baseline !== "string") return null;
    return { v: 1, baseline: parsed.baseline, seen: parsed.seen ?? {} };
  } catch {
    return null;
  }
}

/**
 * پیگیری تغییرات و منشن‌ها برای کاربر جاری.
 * منبع حقیقت در localStorage است و از طریق `useSyncExternalStore` خوانده می‌شود،
 * بنابراین نیازی به setState داخل effect نیست و رندر سرور هم پایدار می‌ماند.
 */
export function useTaskActivity(workspace: Workspace | null, currentUser: Member | null) {
  const userId = currentUser?.id ?? null;
  const raw = React.useSyncExternalStore(
    subscribeSeen,
    () => getSeenSnapshot(userId),
    getSeenServerSnapshot,
  );
  const doc = React.useMemo(() => parseSeen(raw), [raw]);

  const activityMap = React.useMemo<ActivityMap>(() => {
    if (!workspace || !currentUser) return {};
    const map: ActivityMap = {};
    for (const task of workspace.tasks) {
      map[task.id] = activityForTask(workspace, task, currentUser, doc);
    }
    return map;
  }, [workspace, currentUser, doc]);

  const markTaskSeen = React.useCallback(
    (taskId: string) => {
      if (userId) markTaskSeenInStore(userId, taskId);
    },
    [userId],
  );

  const markAllSeen = React.useCallback(() => {
    if (!userId || !workspace) return;
    markTasksSeen(
      userId,
      workspace.tasks.map((task) => task.id),
    );
  }, [userId, workspace]);

  const unreadTasksCount = React.useMemo(
    () => Object.values(activityMap).filter((state) => state.hasChanges).length,
    [activityMap],
  );

  const mentionedTasksCount = React.useMemo(
    () => Object.values(activityMap).filter((state) => state.hasUnreadMention).length,
    [activityMap],
  );

  return { activityMap, markTaskSeen, markAllSeen, unreadTasksCount, mentionedTasksCount };
}
