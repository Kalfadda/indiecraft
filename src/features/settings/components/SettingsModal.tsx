import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Download, CheckCircle, XCircle } from "lucide-react";
import { useTheme } from "@/stores/themeStore";
import { exportConfig } from "@/lib/configExportImport";
import { loadConfig } from "@/lib/supabaseConfig";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const theme = useTheme();
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [exportStatus, setExportStatus] = useState<"idle" | "success" | "error">("idle");
  const [exportError, setExportError] = useState("");

  useEffect(() => {
    if (isOpen) {
      loadConfig().then((config) => {
        if (config?.supabaseUrl) {
          setSupabaseUrl(config.supabaseUrl);
        }
      });
      setExportStatus("idle");
      setExportError("");
    }
  }, [isOpen]);

  const handleExport = async () => {
    try {
      setExportStatus("idle");
      setExportError("");
      const path = await exportConfig();
      if (path) {
        setExportStatus("success");
      }
    } catch (err) {
      setExportStatus("error");
      setExportError(
        err instanceof Error ? err.message : typeof err === "string" ? err : "Export failed"
      );
    }
  };

  const truncatedUrl = supabaseUrl.length > 40
    ? supabaseUrl.slice(0, 40) + "..."
    : supabaseUrl;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: "fixed",
              inset: 0,
              backgroundColor: "rgba(0, 0, 0, 0.5)",
              backdropFilter: "blur(4px)",
              zIndex: 100,
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 101,
              padding: 24,
              pointerEvents: "none",
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              style={{
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                border: `1px solid ${theme.colors.border}`,
                width: "100%",
                maxWidth: 440,
                padding: 24,
                pointerEvents: "auto",
                boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 24,
                }}
              >
                <h2
                  style={{
                    fontSize: 20,
                    fontWeight: 600,
                    color: theme.colors.text,
                    margin: 0,
                  }}
                >
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: "none",
                    backgroundColor: "transparent",
                    cursor: "pointer",
                    color: theme.colors.textMuted,
                  }}
                >
                  <X style={{ width: 18, height: 18 }} />
                </button>
              </div>

              {/* Connection Section */}
              <div style={{ marginBottom: 20 }}>
                <h3
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textMuted,
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    margin: "0 0 12px 0",
                  }}
                >
                  Connection
                </h3>
                <div
                  style={{
                    padding: "10px 14px",
                    borderRadius: 8,
                    backgroundColor: theme.colors.inputBg || "rgba(255,255,255,0.05)",
                    border: `1px solid ${theme.colors.border}`,
                    fontSize: 13,
                    fontFamily: "monospace",
                    color: theme.colors.textMuted,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                  title={supabaseUrl}
                >
                  {truncatedUrl || "Not configured"}
                </div>
              </div>

              {/* Export Button */}
              <button
                onClick={handleExport}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: 600,
                  backgroundColor: theme.colors.primary,
                  color: "#fff",
                  transition: "opacity 0.2s",
                }}
              >
                <Download style={{ width: 16, height: 16 }} />
                Export Config
              </button>

              {/* Export feedback */}
              {exportStatus === "success" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "rgba(22, 163, 74, 0.15)",
                    color: "#4ade80",
                    fontSize: 13,
                  }}
                >
                  <CheckCircle style={{ width: 16, height: 16 }} />
                  Config exported successfully!
                </motion.div>
              )}

              {exportStatus === "error" && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginTop: 12,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: "rgba(239, 68, 68, 0.15)",
                    color: "#f87171",
                    fontSize: 13,
                  }}
                >
                  <XCircle style={{ width: 16, height: 16 }} />
                  {exportError || "Export failed"}
                </motion.div>
              )}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
