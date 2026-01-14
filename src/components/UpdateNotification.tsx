import { motion, AnimatePresence } from "motion/react";
import { Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { useUpdater, type UpdateStatus } from "../hooks/useUpdater";

export function UpdateNotification() {
  const { status, progress, version } = useUpdater();

  // Don't show anything if idle, checking, or error (fail silently)
  if (status === "idle" || status === "checking" || status === "error") {
    return null;
  }

  const config: Record<Exclude<UpdateStatus, "idle" | "checking" | "error">, {
    icon: React.ReactNode;
    title: string;
    message: string;
  }> = {
    available: {
      icon: <Download style={{ width: 48, height: 48, color: "#7c3aed" }} />,
      title: "Update Available",
      message: "Preparing download...",
    },
    downloading: {
      icon: <RefreshCw style={{ width: 48, height: 48, color: "#7c3aed", animation: "spin 1s linear infinite" }} />,
      title: "Downloading Update",
      message: `${progress}% complete`,
    },
    ready: {
      icon: <CheckCircle2 style={{ width: 48, height: 48, color: "#16a34a" }} />,
      title: "Update Ready",
      message: "Restarting application...",
    },
  };

  const current = config[status];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
        }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          style={{
            backgroundColor: "#1e1e2e",
            borderRadius: 16,
            padding: "48px 64px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 24,
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            border: "1px solid #2d2d3d",
            maxWidth: 400,
            textAlign: "center",
          }}
        >
          {current.icon}

          <div>
            <h2 style={{
              fontSize: 24,
              fontWeight: 600,
              color: "#fff",
              margin: 0,
              marginBottom: 8
            }}>
              {current.title}
            </h2>
            {version && (
              <p style={{
                fontSize: 14,
                color: "#a78bfa",
                margin: 0,
                marginBottom: 8
              }}>
                Version {version}
              </p>
            )}
            <p style={{
              fontSize: 14,
              color: "#9ca3af",
              margin: 0
            }}>
              {current.message}
            </p>
          </div>

          {status === "downloading" && (
            <div style={{ width: "100%", marginTop: 8 }}>
              <div style={{
                width: "100%",
                height: 8,
                backgroundColor: "#2d2d3d",
                borderRadius: 4,
                overflow: "hidden",
              }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                  style={{
                    height: "100%",
                    backgroundColor: "#7c3aed",
                    borderRadius: 4,
                  }}
                />
              </div>
            </div>
          )}

          <p style={{
            fontSize: 12,
            color: "#6b7280",
            margin: 0,
            marginTop: 8
          }}>
            Please wait while the update is installed.
            <br />
            The app will restart automatically.
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
