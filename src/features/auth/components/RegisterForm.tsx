import { useState } from "react";
import { motion } from "motion/react";
import { useAuth } from "../hooks/useAuth";
import { Loader2, UserPlus } from "lucide-react";

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

export function RegisterForm({ onSwitchToLogin }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signUp(email, password, displayName);
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setIsLoading(false);
    }
  }

  if (success) {
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
          boxShadow: '0 4px 24px rgba(0, 0, 0, 0.08)',
          padding: 24,
          textAlign: 'center'
        }}>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#1e1e2e', margin: '0 0 8px' }}>
            Check Your Email
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: '0 0 24px' }}>
            We sent a confirmation link to <strong style={{ color: '#1e1e2e' }}>{email}</strong>
          </p>
          <button
            onClick={onSwitchToLogin}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: '1px solid #e5e5eb',
              backgroundColor: 'transparent',
              color: '#6b7280',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer'
            }}
          >
            Back to Sign In
          </button>
        </div>
      </motion.div>
    );
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
            Join IndieCraft
          </h2>
          <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
            Create your team account
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
              <label htmlFor="displayName" style={{
                display: 'block',
                fontSize: 14,
                fontWeight: 500,
                color: '#4b5563',
                marginBottom: 8
              }}>
                Display Name
              </label>
              <input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
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
                placeholder="Choose a password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
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
                <UserPlus style={{ marginRight: 8, width: 16, height: 16 }} />
              )}
              Create Account
            </button>
            <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
              Already have an account?{" "}
              <button
                type="button"
                onClick={onSwitchToLogin}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#7c3aed',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: 0
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
