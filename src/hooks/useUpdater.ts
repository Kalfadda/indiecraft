import { useEffect, useState } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  async function checkForUpdates() {
    try {
      setStatus("checking");
      setError(null);

      const update = await check();

      if (update) {
        console.log(`Update available: ${update.version}`);
        setStatus("available");

        // Start downloading
        setStatus("downloading");

        let downloaded = 0;
        let contentLength = 0;

        await update.downloadAndInstall((event) => {
          switch (event.event) {
            case "Started":
              contentLength = event.data.contentLength || 0;
              console.log(`Download started, size: ${contentLength}`);
              break;
            case "Progress":
              downloaded += event.data.chunkLength;
              if (contentLength > 0) {
                setProgress(Math.round((downloaded / contentLength) * 100));
              }
              break;
            case "Finished":
              console.log("Download finished");
              break;
          }
        });

        setStatus("ready");

        // Relaunch after a short delay
        setTimeout(async () => {
          await relaunch();
        }, 1000);
      } else {
        console.log("No updates available");
        setStatus("idle");
      }
    } catch (err) {
      console.error("Update check failed:", err);
      setError(err instanceof Error ? err.message : "Update check failed");
      setStatus("error");
    }
  }

  // Check for updates on mount
  useEffect(() => {
    // Small delay to let the app fully initialize
    const timer = setTimeout(() => {
      checkForUpdates();
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return {
    status,
    progress,
    error,
    checkForUpdates,
  };
}
