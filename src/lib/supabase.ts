import { SupabaseClient } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured as checkConfigured } from "./supabaseConfig";

/**
 * Proxy-wrapped Supabase client.
 * This allows existing imports to work without changes.
 * The actual client is lazily initialized when first accessed.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const client = getSupabase();
    const value = client[prop as keyof SupabaseClient];
    // Bind methods to the client instance
    if (typeof value === "function") {
      return value.bind(client);
    }
    return value;
  },
});

/**
 * Check if Supabase is configured with URL and key
 */
export function isSupabaseConfigured(): boolean {
  return checkConfigured();
}
