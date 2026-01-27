import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Loader2, Box, Upload, Database } from "lucide-react";
import { importConfig } from "@/lib/configExportImport";
import { saveConfig } from "@/lib/supabaseConfig";

interface AuthPageProps {
  onReconfigure?: () => void;
}

export function AuthPage({ onReconfigure }: AuthPageProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [importStatus, setImportStatus] = useState<{ type: "idle" | "loading" | "success" | "error"; message?: string }>({ type: "idle" });

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#f4f4f7'
      }}>
        <Loader2 style={{ width: 32, height: 32, color: '#7c3aed', animation: 'spin 1s linear infinite' }} />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleImportConfig = async () => {
    setImportStatus({ type: "loading" });
    try {
      const config = await importConfig();
      if (!config) {
        setImportStatus({ type: "idle" });
        return;
      }
      await saveConfig({
        supabaseUrl: config.supabaseUrl,
        supabaseAnonKey: config.supabaseAnonKey,
        schemaInitialized: false,
      });
      setImportStatus({ type: "success", message: "Config imported! Launching setup..." });
      setTimeout(() => {
        onReconfigure?.();
      }, 1000);
    } catch (err) {
      setImportStatus({
        type: "error",
        message: err instanceof Error ? err.message : typeof err === "string" ? err : "Import failed",
      });
    }
  };

  return (
    <div style={{
      display: 'flex',
      minHeight: '100vh',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#f4f4f7',
      padding: 16
    }}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ marginBottom: 32, display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <div style={{
          display: 'flex',
          width: 48,
          height: 48,
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 12,
          backgroundColor: '#7c3aed'
        }}>
          <Box style={{ width: 24, height: 24, color: '#fff' }} />
        </div>
        <h1 style={{ fontSize: 30, fontWeight: 700, color: '#1e1e2e', margin: 0 }}>IndieCraft</h1>
      </motion.div>

      <AnimatePresence mode="wait">
        {mode === "login" ? (
          <LoginForm
            key="login"
            onSwitchToRegister={() => setMode("register")}
          />
        ) : (
          <RegisterForm
            key="register"
            onSwitchToLogin={() => setMode("login")}
          />
        )}
      </AnimatePresence>

      {/* Database setup actions */}
      {onReconfigure && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          style={{
            marginTop: 32,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 2 }}>
            Database Connection
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleImportConfig}
              disabled={importStatus.type === "loading"}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#7c3aed',
                backgroundColor: '#f3f0ff',
                border: '1px solid #e9e3ff',
                borderRadius: 8,
                cursor: importStatus.type === "loading" ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {importStatus.type === "loading" ? (
                <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
              ) : (
                <Upload style={{ width: 14, height: 14 }} />
              )}
              Import Config
            </button>
            <button
              onClick={onReconfigure}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '8px 16px',
                fontSize: 13,
                fontWeight: 500,
                color: '#6b7280',
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              <Database style={{ width: 14, height: 14 }} />
              Reconfigure
            </button>
          </div>
          {importStatus.type === "success" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, color: '#16a34a', marginTop: 4 }}
            >
              {importStatus.message}
            </motion.div>
          )}
          {importStatus.type === "error" && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ fontSize: 13, color: '#dc2626', marginTop: 4 }}
            >
              {importStatus.message}
            </motion.div>
          )}
        </motion.div>
      )}
    </div>
  );
}
