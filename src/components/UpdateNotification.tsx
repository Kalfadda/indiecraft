import { motion, AnimatePresence } from "motion/react";
import { Download, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { useUpdater, type UpdateStatus } from "../hooks/useUpdater";

export function UpdateNotification() {
  const { status, progress } = useUpdater();

  // Don't show anything if idle or just checking
  if (status === "idle" || status === "checking") {
    return null;
  }

  const config: Record<Exclude<UpdateStatus, "idle" | "checking">, {
    icon: React.ReactNode;
    message: string;
    bg: string;
    color: string;
  }> = {
    available: {
      icon: <Download style={{ width: 16, height: 16 }} />,
      message: "Update available, downloading...",
      bg: "rgba(59, 130, 246, 0.15)",
      color: "#3b82f6",
    },
    downloading: {
      icon: <RefreshCw style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />,
      message: `Downloading update... ${progress}%`,
      bg: "rgba(59, 130, 246, 0.15)",
      color: "#3b82f6",
    },
    ready: {
      icon: <CheckCircle2 style={{ width: 16, height: 16 }} />,
      message: "Update installed! Restarting...",
      bg: "rgba(22, 163, 74, 0.15)",
      color: "#16a34a",
    },
    error: {
      icon: <AlertCircle style={{ width: 16, height: 16 }} />,
      message: "Update check failed",
      bg: "rgba(239, 68, 68, 0.15)",
      color: "#ef4444",
    },
  };

  const current = config[status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        style={{
          position: "fixed",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          borderRadius: 8,
          backgroundColor: current.bg,
          color: current.color,
          fontSize: 14,
          fontWeight: 500,
          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
          zIndex: 1000,
        }}
      >
        {current.icon}
        {current.message}
      </motion.div>
    </AnimatePresence>
  );
}
