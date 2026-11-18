import type { StorageInfo, Workspace } from "../types";
import { createFileStore, fileStoreInfo } from "./file-store";
import { createPostgresStore } from "./pg-store";
import type { StoreResult, WorkspaceStore } from "./store";

/**
 * انتخاب درایور ذخیره‌سازی:
 *  - اگر DATABASE_URL (یا POSTGRES_URL) تنظیم شده باشد → PostgreSQL
 *  - در غیر این صورت → فایل JSON (پایدار در اجرای محلی/سرور، موقت در Vercel)
 */
type Storage = { store: WorkspaceStore; info: StorageInfo };

let cached: Storage | null = null;

export function hasDatabaseUrl(): boolean {
  return Boolean(
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim(),
  );
}

export function getStorage(): Storage {
  if (cached) return cached;

  if (hasDatabaseUrl()) {
    cached = {
      store: createPostgresStore(),
      info: {
        mode: "postgres",
        persistent: true,
        label: "PostgreSQL",
        hint: "داده‌ها در دیتابیس ذخیره می‌شوند و بعد از هر استقرار باقی می‌مانند.",
      },
    };
    return cached;
  }

  cached = {
    store: createFileStore(),
    info: fileStoreInfo.ephemeral
      ? {
          mode: "ephemeral",
          persistent: false,
          label: "حالت نمایشی",
          hint: "بدون DATABASE_URL، داده‌ها فقط در حافظه‌ی موقت سرور می‌مانند و با هر ری‌استارت بازنشانی می‌شوند. برای ذخیره‌ی پایدار یک دیتابیس رایگان وصل کنید.",
        }
      : {
          mode: "file",
          persistent: true,
          label: "فایل محلی",
          hint: `داده‌ها در فایل ${fileStoreInfo.path} ذخیره می‌شوند.`,
        },
  };
  return cached;
}

export function getStorageInfo(): StorageInfo {
  return getStorage().info;
}

export async function readWorkspace(): Promise<{
  workspace: Workspace;
  storage: StorageInfo;
}> {
  const { store, info } = getStorage();
  return { workspace: await store.read(), storage: info };
}

export async function updateWorkspace<T>(
  mutator: (workspace: Workspace) => T,
): Promise<{ workspace: Workspace; storage: StorageInfo; result: StoreResult<T>["result"] }> {
  const { store, info } = getStorage();
  const { workspace, result } = await store.apply(mutator);
  return { workspace, storage: info, result };
}

export async function resetWorkspace(): Promise<{
  workspace: Workspace;
  storage: StorageInfo;
}> {
  const { store, info } = getStorage();
  return { workspace: await store.reset(), storage: info };
}
