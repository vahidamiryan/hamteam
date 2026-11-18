import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

const DEFAULT_SUPABASE_URL = "https://vybdawzzwoqsgrwrkkqr.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ5YmRhd3p6d29xc2dyd3Jra3FyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA3Njc4OTcsImV4cCI6MjEwNjM0Mzg5N30._QnxmnyWF7jYQVU6CbLgZkdUsVt_YOoGwmZt1n1-P3c";

export function getSupabaseClient(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;

  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || DEFAULT_SUPABASE_URL;
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    DEFAULT_SUPABASE_ANON_KEY;

  if (!url || !anonKey) return null;

  try {
    client = createClient(url, anonKey, {
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    return client;
  } catch (error) {
    console.error("[supabase-client] failed to initialize", error);
    return null;
  }
}
