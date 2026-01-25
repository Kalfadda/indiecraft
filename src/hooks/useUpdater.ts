import { useState } from "react";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

/**
 * Updater hook - disabled in BYOD version.
 * Auto-updates are not available when using your own Supabase instance.
 */
export function useUpdater() {
  const [status] = useState<UpdateStatus>("idle");
  const [progress] = useState(0);
  const [version] = useState<string | null>(null);
  const [error] = useState<string | null>(null);

  async function checkForUpdates() {
    // No-op - updates disabled in BYOD version
    console.log("Auto-updates disabled in BYOD version");
  }

  return {
    status,
    progress,
    version,
    error,
    checkForUpdates,
  };
}
