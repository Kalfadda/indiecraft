import { useState, useEffect, useCallback, useRef } from "react";
import { check } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";

export type UpdateStatus = "idle" | "checking" | "available" | "downloading" | "ready" | "error";

export function useUpdater() {
  const [status, setStatus] = useState<UpdateStatus>("idle");
  const [progress, setProgress] = useState(0);
  const [version, setVersion] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  const checkForUpdates = useCallback(async () => {
    try {
      setStatus("checking");
      setError(null);

      const update = await check();

      if (!update) {
        setStatus("idle");
        return;
      }

      setVersion(update.version);
      setStatus("available");

      let totalBytes = 0;
      let downloadedBytes = 0;

      await update.downloadAndInstall((event) => {
        if (event.event === "Started") {
          totalBytes = event.data.contentLength ?? 0;
          setStatus("downloading");
          setProgress(0);
        } else if (event.event === "Progress") {
          downloadedBytes += event.data.chunkLength;
          if (totalBytes > 0) {
            setProgress(Math.round((downloadedBytes / totalBytes) * 100));
          }
        } else if (event.event === "Finished") {
          setStatus("ready");
          setProgress(100);
        }
      });

      await relaunch();
    } catch (e) {
      console.error("Update check failed:", e);
      setError(e instanceof Error ? e.message : String(e));
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    status,
    progress,
    version,
    error,
    checkForUpdates,
  };
}
