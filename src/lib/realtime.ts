import { SUPABASE_ENABLED, getSupabaseClient } from "./supabase-client";
import type { Workspace } from "./types";

export type RealtimeStatus = "connected" | "connecting" | "offline";

export interface RealtimeEvents {
  onWorkspace: (workspace: Workspace) => void;
  onStatus: (status: RealtimeStatus) => void;
}

/**
 * کانال همگام‌سازی زنده پشت یک اینترفیس؛ استور فقط این قرارداد را می‌شناسد
 * و به Supabase وابسته نیست (Dependency Inversion).
 */
export interface RealtimeLink {
  readonly initialStatus: RealtimeStatus;
  connect(events: RealtimeEvents): () => void;
}

/** پیاده‌سازی Supabase Realtime؛ تمام جزئیات کانال و پیام‌ها همین‌جا می‌ماند. */
export class SupabaseRealtimeLink implements RealtimeLink {
  readonly initialStatus: RealtimeStatus = SUPABASE_ENABLED ? "connecting" : "offline";

  connect({ onWorkspace, onStatus }: RealtimeEvents): () => void {
    const supabase = getSupabaseClient();
    if (!supabase) {
      onStatus("offline");
      return () => {};
    }

    const channel = supabase
      .channel("hamteam:workspace-doc")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "workspace_doc" },
        (payload) => {
          const doc = payload.new as { data?: Workspace; version?: number } | undefined;
          if (doc?.data && typeof doc.data.version === "number") onWorkspace(doc.data);
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") onStatus("connected");
        else if (status === "CLOSED" || status === "CHANNEL_ERROR") onStatus("offline");
        else onStatus("connecting");
      });

    return () => {
      void supabase.removeChannel(channel);
    };
  }
}

/** لینک خنثی برای محیط‌هایی که همگام‌سازی زنده ندارند (تست، SSR). */
export class NoopRealtimeLink implements RealtimeLink {
  readonly initialStatus: RealtimeStatus = "offline";
  connect(): () => void {
    return () => {};
  }
}
