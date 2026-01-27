import { save, open } from "@tauri-apps/plugin-dialog";
import { readTextFile, writeTextFile } from "@tauri-apps/plugin-fs";
import { downloadDir, join } from "@tauri-apps/api/path";
import { loadConfig } from "./supabaseConfig";
import type { ExportedConfig } from "../types/config";

/**
 * Export the current Supabase config to a JSON file via OS save dialog.
 * Returns the file path on success, or null if the user cancelled.
 */
export async function exportConfig(): Promise<string | null> {
  const config = await loadConfig();
  if (!config?.supabaseUrl || !config?.supabaseAnonKey) {
    throw new Error("No Supabase configuration found to export.");
  }

  const exported: ExportedConfig = {
    app: "IndieCraft",
    version: 1,
    supabaseUrl: config.supabaseUrl,
    supabaseAnonKey: config.supabaseAnonKey,
  };

  // Use Downloads folder as default save location (ensures valid absolute path)
  let defaultPath: string;
  try {
    const dlDir = await downloadDir();
    defaultPath = await join(dlDir, "indiecraft-config.json");
  } catch {
    defaultPath = "indiecraft-config.json";
  }

  const filePath = await save({
    title: "Export IndieCraft Config",
    defaultPath,
    filters: [{ name: "JSON", extensions: ["json"] }],
  });

  if (!filePath) return null;

  await writeTextFile(filePath, JSON.stringify(exported, null, 2));
  return filePath;
}

/**
 * Import a Supabase config from a JSON file via OS open dialog.
 * Returns { supabaseUrl, supabaseAnonKey } on success, or null if cancelled.
 * Throws on invalid file contents.
 */
export async function importConfig(): Promise<{ supabaseUrl: string; supabaseAnonKey: string } | null> {
  const filePath = await open({
    title: "Import IndieCraft Config",
    filters: [{ name: "JSON", extensions: ["json"] }],
    multiple: false,
    directory: false,
  });

  if (!filePath) return null;

  const content = await readTextFile(filePath);
  let parsed: unknown;

  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("File is not valid JSON.");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    (parsed as Record<string, unknown>).app !== "IndieCraft" ||
    typeof (parsed as Record<string, unknown>).supabaseUrl !== "string" ||
    typeof (parsed as Record<string, unknown>).supabaseAnonKey !== "string"
  ) {
    throw new Error("Invalid config file. Expected an IndieCraft config export.");
  }

  const data = parsed as ExportedConfig;
  return {
    supabaseUrl: data.supabaseUrl,
    supabaseAnonKey: data.supabaseAnonKey,
  };
}
