import type { Workspace } from "../types";

export interface StoreResult<T> {
  workspace: Workspace;
  result: T;
}

export interface WorkspaceStore {
  read(): Promise<Workspace>;
  /** یک تغییر اتمیک روی سند فضای کاری اعمال می‌کند و نسخه‌ی تازه را برمی‌گرداند. */
  apply<T>(mutator: (workspace: Workspace) => T): Promise<StoreResult<T>>;
  /** داده‌ی نمونه را از نو می‌سازد. */
  reset(): Promise<Workspace>;
}
