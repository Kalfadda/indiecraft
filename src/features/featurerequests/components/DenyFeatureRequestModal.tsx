import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, XCircle, Loader2 } from "lucide-react";

interface DenyFeatureRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  isLoading?: boolean;
  requestName?: string;
}

export function DenyFeatureRequestModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  requestName,
}: DenyFeatureRequestModalProps) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!reason.trim()) {
      setError("Please provide a reason for denial");
      return;
    }

    onConfirm(reason.trim());
  };

  const handleClose = () => {
    setReason("");
    setError(null);
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
              zIndex: 200,
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
              zIndex: 201,
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
                backgroundColor: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
              {/* Header */}
              <div style={{
                padding: '20px 24px',
                borderBottom: '1px solid #e5e5eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <XCircle style={{ width: 20, height: 20, color: '#ef4444' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1e1e2e', margin: 0 }}>
                      Deny Request
                    </h3>
                    {requestName && (
                      <p style={{ fontSize: 13, color: '#6b7280', margin: '2px 0 0 0' }}>
                        {requestName}
                      </p>
                    )}
                  </div>
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
                    color: '#9ca3af',
                    cursor: 'pointer',
                  }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit}>
                <div style={{ padding: 24 }}>
                  <p style={{
                    fontSize: 14,
                    color: '#6b7280',
                    marginBottom: 16,
                    marginTop: 0,
                  }}>
                    Please provide a reason for denying this request. This will be visible to the requester.
                  </p>

                  <label htmlFor="reason" style={{
                    display: 'block',
                    fontSize: 14,
                    fontWeight: 500,
                    color: '#4b5563',
                    marginBottom: 8,
                  }}>
                    Denial Reason
                  </label>
                  <textarea
                    id="reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g., This feature already exists, or it's out of scope for the current roadmap..."
                    rows={4}
                    autoFocus
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      borderRadius: 8,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#f9fafb',
                      color: '#1e1e2e',
                      fontSize: 14,
                      outline: 'none',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      minHeight: 100,
                    }}
                  />

                  {error && (
                    <div style={{
                      marginTop: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      fontSize: 13,
                    }}>
                      {error}
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div style={{
                  padding: '16px 24px',
                  borderTop: '1px solid #e5e5eb',
                  backgroundColor: '#fafafa',
                  display: 'flex',
                  gap: 12,
                  justifyContent: 'flex-end',
                }}>
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#fff',
                      color: '#6b7280',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      opacity: isLoading ? 0.7 : 1,
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading || !reason.trim()}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 20px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: isLoading || !reason.trim() ? '#fca5a5' : '#ef4444',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isLoading || !reason.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isLoading && (
                      <Loader2 style={{ marginRight: 8, width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                    )}
                    Deny Request
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
