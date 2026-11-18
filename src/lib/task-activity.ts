"use client";

import * as React from "react";
import type { Member, Task, Workspace } from "./types";

const SEEN_STORAGE_PREFIX = "hamteam:seen-tasks:";

export interface TaskActivityState {
  hasChanges: boolean;
  hasUnreadMention: boolean;
  unreadCommentsCount: number;
}

/** بررسی می‌کند که آیا در متنی کاربر جاری منشن شده است یا خیر */
export function isUserMentioned(text: string | undefined, user: Member | null): boolean {
  if (!text || !user) return false;
  const name = user.name?.trim();
  const nameEn = user.nameEn?.trim();
  if (name && text.includes(`@${name}`)) return true;
  if (nameEn && text.toLowerCase().includes(`@${nameEn.toLowerCase()}`)) return true;
  return false;
}

/**
 * هوک پیگیری فعالیت و تغییرات تسک‌ها بر اساس کاربر جاری.
 * وضعیت مشاهده در مرورگر ذخیره می‌شود تا کاربر با هر بار ورود متوجه تغییرات جدید بشود.
 */
export function useTaskActivity(workspace: Workspace | null, currentUser: Member | null) {
  const [seenMap, setSeenMap] = React.useState<Record<string, string>>({});
  const storageKey = currentUser ? `${SEEN_STORAGE_PREFIX}${currentUser.id}` : null;

  // بارگذاری داده‌های مشاهده‌شده کاربر از localStorage
  React.useEffect(() => {
    if (!storageKey) {
      setSeenMap({});
      return;
    }
    try {
      const stored = window.localStorage.getItem(storageKey);
      if (stored) {
        setSeenMap(JSON.parse(stored));
      } else {
        // برای بار اول: وضعیت فعلی تسک‌ها به‌عنوان مبنا ثبت می‌شود تا از این به بعد تغییرات ردیابی شوند
        const initial: Record<string, string> = {};
        const now = new Date(Date.now() - 3600 * 1000).toISOString(); // ۱ ساعت قبل
        workspace?.tasks.forEach((task) => {
          initial[task.id] = now;
        });
        window.localStorage.setItem(storageKey, JSON.stringify(initial));
        setSeenMap(initial);
      }
    } catch {
      setSeenMap({});
    }
  }, [storageKey, workspace?.tasks.length]);

  const markTaskSeen = React.useCallback(
    (taskId: string) => {
      if (!storageKey) return;
      const now = new Date().toISOString();
      setSeenMap((prev) => {
        const next = { ...prev, [taskId]: now };
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch {}
        return next;
      });
    },
    [storageKey],
  );

  const markAllSeen = React.useCallback(() => {
    if (!storageKey || !workspace) return;
    const now = new Date().toISOString();
    const next: Record<string, string> = {};
    workspace.tasks.forEach((t) => {
      next[t.id] = now;
    });
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
    } catch {}
    setSeenMap(next);
  }, [storageKey, workspace]);

  const getTaskActivity = React.useCallback(
    (task: Task): TaskActivityState => {
      if (!currentUser || !workspace) {
        return { hasChanges: false, hasUnreadMention: false, unreadCommentsCount: 0 };
      }

      const lastSeen = seenMap[task.id];
      if (!lastSeen) {
        // اگر هنوز دیده نشده
        const taskComments = workspace.comments.filter((c) => c.taskId === task.id);
        const hasMention = taskComments.some(
          (c) => isUserMentioned(c.body, currentUser) || isUserMentioned(c.bodyEn, currentUser),
        );
        return {
          hasChanges: true,
          hasUnreadMention: hasMention,
          unreadCommentsCount: taskComments.filter((c) => c.authorId !== currentUser.id).length,
        };
      }

      // نظرات جدیدتر از آخرین مشاهده که توسط دیگران ثبت شده‌اند
      const unreadComments = workspace.comments.filter(
        (c) =>
          c.taskId === task.id &&
          c.createdAt > lastSeen &&
          c.authorId !== currentUser.id,
      );

      const hasUnreadMention = unreadComments.some(
        (c) => isUserMentioned(c.body, currentUser) || isUserMentioned(c.bodyEn, currentUser),
      );

      // تسک آپدیت شده بعد از آخرین مشاهده (تغییر وضعیت، فیلد، یا کامنت جدید)
      const hasChanges =
        task.updatedAt > lastSeen || unreadComments.length > 0 || hasUnreadMention;

      return {
        hasChanges,
        hasUnreadMention,
        unreadCommentsCount: unreadComments.length,
      };
    },
    [currentUser, workspace, seenMap],
  );

  // تعداد کل تسک‌های دارای تغییر جدید
  const unreadTasksCount = React.useMemo(() => {
    if (!workspace || !currentUser) return 0;
    return workspace.tasks.filter((t) => getTaskActivity(t).hasChanges).length;
  }, [workspace, currentUser, getTaskActivity]);

  const mentionedTasksCount = React.useMemo(() => {
    if (!workspace || !currentUser) return 0;
    return workspace.tasks.filter((t) => getTaskActivity(t).hasUnreadMention).length;
  }, [workspace, currentUser, getTaskActivity]);

  return {
    seenMap,
    markTaskSeen,
    markAllSeen,
    getTaskActivity,
    unreadTasksCount,
    mentionedTasksCount,
  };
}
