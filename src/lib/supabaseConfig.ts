import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { appDataDir, join } from "@tauri-apps/api/path";
import { exists, readTextFile, writeTextFile, mkdir } from "@tauri-apps/plugin-fs";
import type { AppConfig } from "../types/config";

const CONFIG_FILENAME = "config.json";

let cachedConfig: AppConfig | null = null;
let supabaseClient: SupabaseClient | null = null;

/**
 * Get the path to the config file
 */
async function getConfigPath(): Promise<string> {
  const appDir = await appDataDir();
  return await join(appDir, CONFIG_FILENAME);
}

/**
 * Load config from the app data directory
 */
export async function loadConfig(): Promise<AppConfig | null> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const configPath = await getConfigPath();
    const fileExists = await exists(configPath);

    if (!fileExists) {
      return null;
    }

    const content = await readTextFile(configPath);
    cachedConfig = JSON.parse(content) as AppConfig;
    return cachedConfig;
  } catch (error) {
    console.error("Failed to load config:", error);
    return null;
  }
}

/**
 * Save config to the app data directory
 */
export async function saveConfig(config: AppConfig): Promise<void> {
  try {
    const appDir = await appDataDir();
    const dirExists = await exists(appDir);

    if (!dirExists) {
      await mkdir(appDir, { recursive: true });
    }

    const configPath = await getConfigPath();
    await writeTextFile(configPath, JSON.stringify(config, null, 2));
    cachedConfig = config;

    // Reset the client so it gets recreated with new config
    supabaseClient = null;
  } catch (error) {
    console.error("Failed to save config:", error);
    throw error;
  }
}

/**
 * Check if Supabase is configured (has URL and key)
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(cachedConfig?.supabaseUrl && cachedConfig?.supabaseAnonKey);
}

/**
 * Check if schema has been initialized
 */
export function isSchemaInitialized(): boolean {
  return Boolean(cachedConfig?.schemaInitialized);
}

/**
 * Get or create the Supabase client
 */
export function getSupabase(): SupabaseClient {
  if (supabaseClient) {
    return supabaseClient;
  }

  if (!cachedConfig?.supabaseUrl || !cachedConfig?.supabaseAnonKey) {
    throw new Error("Supabase is not configured. Please complete setup first.");
  }

  supabaseClient = createClient(cachedConfig.supabaseUrl, cachedConfig.supabaseAnonKey);
  return supabaseClient;
}

/**
 * Validate that the Supabase connection works
 */
export async function validateConnection(url: string, anonKey: string): Promise<{ success: boolean; error?: string }> {
  try {
    const testClient = createClient(url, anonKey);

    // Try to make a simple authenticated request
    // This will fail if the URL or key is invalid
    const { error } = await testClient.auth.getSession();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Connection failed",
    };
  }
}

/**
 * Check if the required database tables exist
 */
export async function checkSchemaExists(): Promise<{ exists: boolean; missingTables: string[] }> {
  const requiredTables = [
    "profiles",
    "assets",
    "events",
    "goals",
    "goal_tasks",
    "task_dependencies",
    "model_requests",
    "feature_requests",
    "comments",
    "notifications",
    "bulletins",
  ];

  const missingTables: string[] = [];

  try {
    const client = getSupabase();

    for (const table of requiredTables) {
      const { error } = await client.from(table).select("id").limit(1);

      // Error code 42P01 means table doesn't exist
      if (error && error.code === "42P01") {
        missingTables.push(table);
      }
    }

    return {
      exists: missingTables.length === 0,
      missingTables,
    };
  } catch (error) {
    console.error("Failed to check schema:", error);
    return { exists: false, missingTables: requiredTables };
  }
}

/**
 * Clear cached config (for testing or re-setup)
 */
export function clearConfigCache(): void {
  cachedConfig = null;
  supabaseClient = null;
}
