import { Pool } from "pg";

import { seedWorkspace } from "../seed";
import type { Workspace } from "../types";
import type { StoreResult, WorkspaceStore } from "./store";

const DOC_ID = "default";
const MAX_ATTEMPTS = 6;

let pool: Pool | null = null;
let schemaReady: Promise<void> | null = null;

function sslFor(connectionString: string) {
  try {
    const url = new URL(connectionString);
    const isLocal = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
    if (isLocal || url.searchParams.get("sslmode") === "disable") return undefined;
    return { rejectUnauthorized: false };
  } catch {
    return { rejectUnauthorized: false };
  }
}

function getPool(): Pool {
  if (pool) return pool;
  const connectionString =
    process.env.DATABASE_URL?.trim() || process.env.POSTGRES_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL تنظیم نشده است.");
  }
  pool = new Pool({
    connectionString,
    max: 3,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
    ssl: sslFor(connectionString),
  });
  pool.on("error", (error) => {
    console.error("[postgres] unexpected pool error", error);
  });
  return pool;
}

async function ensureSchema(): Promise<void> {
  if (!schemaReady) {
    schemaReady = (async () => {
      await getPool().query(`
        create table if not exists workspace_doc (
          id text primary key,
          version integer not null default 1,
          data jsonb not null,
          updated_at timestamptz not null default now()
        )
      `);
    })().catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

async function readDoc(): Promise<Workspace> {
  await ensureSchema();
  const { rows } = await getPool().query<{ data: Workspace }>(
    "select data from workspace_doc where id = $1",
    [DOC_ID],
  );
  if (rows.length > 0) return rows[0].data;

  const seeded = seedWorkspace();
  await getPool().query(
    "insert into workspace_doc (id, version, data) values ($1, $2, $3::jsonb) on conflict (id) do nothing",
    [DOC_ID, seeded.version, JSON.stringify(seeded)],
  );
  const again = await getPool().query<{ data: Workspace }>(
    "select data from workspace_doc where id = $1",
    [DOC_ID],
  );
  return again.rows[0]?.data ?? seeded;
}

export function createPostgresStore(): WorkspaceStore {
  return {
    read: readDoc,

    async apply<T>(mutator: (workspace: Workspace) => T): Promise<StoreResult<T>> {
      await ensureSchema();
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        const current = await readDoc();
        const draft = structuredClone(current);
        // اگر mutator خطا بدهد (مثلاً ورودی نامعتبر)، تغییر ذخیره نمی‌شود.
        const result = mutator(draft);
        draft.version = current.version + 1;
        draft.updatedAt = new Date().toISOString();

        const updated = await getPool().query(
          `update workspace_doc
              set data = $2::jsonb, version = $3, updated_at = now()
            where id = $1 and version = $4`,
          [DOC_ID, JSON.stringify(draft), draft.version, current.version],
        );

        if (updated.rowCount === 1) {
          return { workspace: draft, result };
        }
      }
      throw new Error("ذخیره‌سازی به دلیل تغییر هم‌زمان داده‌ها ناموفق بود؛ دوباره تلاش کنید.");
    },

    async reset(): Promise<Workspace> {
      await ensureSchema();
      const seeded = seedWorkspace();
      await getPool().query(
        `insert into workspace_doc (id, version, data, updated_at)
         values ($1, $2, $3::jsonb, now())
         on conflict (id) do update
           set data = excluded.data,
               version = workspace_doc.version + 1,
               updated_at = now()`,
        [DOC_ID, seeded.version, JSON.stringify(seeded)],
      );
      return readDoc();
    },
  };
}
