import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Send, MessageSquare } from "lucide-react";
import { useBulletinMutations } from "../hooks/useBulletinMutations";
import { useTheme } from "@/stores/themeStore";

interface BulletinFormProps {
  isOpen: boolean;
  onClose: () => void;
}

export function BulletinForm({ isOpen, onClose }: BulletinFormProps) {
  const [message, setMessage] = useState("");
  const { createBulletin } = useBulletinMutations();
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    createBulletin.mutate(
      { message: message.trim() },
      {
        onSuccess: () => {
          setMessage("");
          onClose();
        },
      }
    );
  };

  const handleClose = () => {
    setMessage("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
            }}
          />

          {/* Modal Container */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 101,
              padding: 24,
              pointerEvents: 'none',
            }}
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: 440,
                backgroundColor: theme.colors.card,
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                pointerEvents: 'auto',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Header */}
              <div
                style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  transition: 'all 0.3s ease',
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 12,
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MessageSquare style={{ width: 22, height: 22, color: '#fff' }} />
                </div>
                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text, transition: 'all 0.3s ease' }}>
                    Post a Note
                  </h3>
                  <p style={{ margin: '2px 0 0 0', fontSize: 13, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
                    Share something with the team
                  </p>
                </div>
                <button
                  onClick={handleClose}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 32,
                    height: 32,
                    borderRadius: 8,
                    border: 'none',
                    backgroundColor: 'transparent',
                    color: theme.colors.textMuted,
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit}>
                <div style={{ padding: 24, backgroundColor: theme.colors.card, transition: 'all 0.3s ease' }}>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Write your message here..."
                    maxLength={200}
                    autoFocus
                    style={{
                      width: '100%',
                      minHeight: 140,
                      padding: 16,
                      fontSize: 14,
                      color: theme.colors.text,
                      lineHeight: 1.5,
                      borderRadius: 12,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.inputBg,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: "'Comic Sans MS', 'Chalkboard', cursive, sans-serif",
                      boxSizing: 'border-box',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = theme.colors.primary)}
                    onBlur={(e) => (e.currentTarget.style.borderColor = theme.colors.inputBorder)}
                  />
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 12,
                      color: theme.colors.textMuted,
                      textAlign: 'right',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    {message.length}/200 characters
                  </div>
                </div>

                {/* Footer */}
                <div
                  style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    transition: 'all 0.3s ease',
                  }}
                >
                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      padding: '12px 24px',
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.card,
                      color: theme.colors.textMuted,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!message.trim() || createBulletin.isPending}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '12px 24px',
                      borderRadius: 10,
                      border: 'none',
                      background: message.trim()
                        ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                        : theme.colors.border,
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: message.trim() ? 'pointer' : 'not-allowed',
                      boxShadow: message.trim() ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <Send style={{ width: 16, height: 16 }} />
                    {createBulletin.isPending ? 'Posting...' : 'Post Note'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
