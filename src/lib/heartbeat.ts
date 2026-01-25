import { supabase } from "./supabase";

/**
 * Sends a lightweight ping to Supabase to prevent the free tier
 * from pausing the database after 7 days of inactivity.
 * Called on app startup.
 */
export async function sendHeartbeat(): Promise<void> {
  try {
    // Simple count query - very lightweight
    await supabase.from("profiles").select("id", { count: "exact", head: true });
    console.log("[Heartbeat] Database ping successful");
  } catch (error) {
    // Silent fail - don't disrupt app if heartbeat fails
    console.warn("[Heartbeat] Database ping failed:", error);
  }
}
