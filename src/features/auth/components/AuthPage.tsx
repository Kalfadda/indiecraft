import { useState } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { LoginForm } from "./LoginForm";
import { RegisterForm } from "./RegisterForm";
import { Loader2, Box } from "lucide-react";

export function AuthPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");

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
    </div>
  );
}
