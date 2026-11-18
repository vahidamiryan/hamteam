import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { seedWorkspace } from "../seed";
import type { Workspace } from "../types";
import type { StoreResult, WorkspaceStore } from "./store";

/**
 * ذخیره‌سازی فایلی: بدون نیاز به هیچ سرویس بیرونی.
 * روی سرور معمولی (VPS/داکر) پایدار است؛ روی Vercel فقط در /tmp کار می‌کند
 * و با ری‌استارت پاک می‌شود.
 */
function resolveDataDir(): string {
  const custom = process.env.WORKSPACE_DATA_DIR?.trim();
  if (custom) return path.resolve(custom);
  if (process.env.VERCEL) return path.join(os.tmpdir(), "hamteam");
  return path.join(process.cwd(), ".data");
}

const dataDir = resolveDataDir();
const dataFile = path.join(dataDir, "workspace.json");
const tmpFile = path.join(dataDir, `workspace.${process.pid}.tmp`);

/** همه‌ی خواندن/نوشتن‌ها سریالی می‌شوند تا نوشتن هم‌زمان فایل را خراب نکند. */
let queue: Promise<unknown> = Promise.resolve();
function withLock<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(task, task);
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

async function persist(workspace: Workspace): Promise<void> {
  await mkdir(dataDir, { recursive: true });
  await writeFile(tmpFile, JSON.stringify(workspace, null, 2), "utf8");
  await rename(tmpFile, dataFile);
}

async function load(): Promise<Workspace> {
  try {
    const raw = await readFile(dataFile, "utf8");
    const parsed = JSON.parse(raw) as Workspace;
    if (!parsed || !Array.isArray(parsed.tasks) || !Array.isArray(parsed.members)) {
      throw new Error("workspace file is corrupted");
    }
    return parsed;
  } catch {
    const seeded = seedWorkspace();
    await persist(seeded);
    return seeded;
  }
}

export function createFileStore(): WorkspaceStore {
  return {
    read() {
      return withLock(load);
    },

    apply<T>(mutator: (workspace: Workspace) => T): Promise<StoreResult<T>> {
      return withLock(async () => {
        const current = await load();
        const draft = structuredClone(current);
        const result = mutator(draft);
        draft.version = current.version + 1;
        draft.updatedAt = new Date().toISOString();
        await persist(draft);
        return { workspace: draft, result };
      });
    },

    reset() {
      return withLock(async () => {
        const seeded = seedWorkspace();
        await persist(seeded);
        return seeded;
      });
    },
  };
}

export const fileStoreInfo = {
  path: dataFile,
  ephemeral: Boolean(process.env.VERCEL) && !process.env.WORKSPACE_DATA_DIR,
};
