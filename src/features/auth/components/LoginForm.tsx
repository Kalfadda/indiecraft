import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { Loader2, LogIn } from "lucide-react";

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

export function LoginForm({ onSwitchToRegister }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div style={{
        width: 400,
        borderRadius: 12,
        border: '1px solid #e5e5eb',
        backgroundColor: '#ffffff',
        boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)'
      }}>
        <div style={{ padding: '24px 24px 0', textAlign: 'center' }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e1e2e', margin: '0 0 8px' }}>
            Welcome Back
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Sign in to access IndieCraft
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{
                  padding: 12,
                  borderRadius: 8,
                  backgroundColor: 'rgba(220, 38, 38, 0.08)',
                  border: '1px solid rgba(220, 38, 38, 0.2)',
                  fontSize: 14,
                  color: '#dc2626'
                }}
              >
                {error}
              </motion.div>
            )}
            <div>
              <label htmlFor="email" style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#4b5563',
                marginBottom: 8
              }}>
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@team.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#f9fafb',
                  color: '#1e1e2e',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div>
              <label htmlFor="password" style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#4b5563',
                marginBottom: 8
              }}>
                Password
              </label>
              <input
                id="password"
                type="password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 8,
                  border: '1px solid #e5e5eb',
                  backgroundColor: '#f9fafb',
                  color: '#1e1e2e',
                  fontSize: 14,
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>
          <div style={{
            padding: '0 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 16
          }}>
            <button
              type="submit"
              disabled={isLoading}
              style={{
                width: '100%',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                backgroundColor: isLoading ? '#a78bfa' : '#7c3aed',
                color: '#fff',
                fontSize: 14,
                fontWeight: 500,
                cursor: isLoading ? 'not-allowed' : 'pointer',
                opacity: isLoading ? 0.7 : 1
              }}
            >
              {isLoading ? (
                <Loader2 style={{ marginRight: 8, width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
              ) : (
                <LogIn style={{ marginRight: 8, width: 16, height: 16 }} />
              )}
              Sign In
            </button>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToRegister}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0
                }}
              >
                Register
              </button>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
