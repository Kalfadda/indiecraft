import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Clock, Flag, Check, XCircle, MessageSquare, ExternalLink } from "lucide-react";
import type { FeatureRequestWithCreator } from "../hooks/useFeatureRequests";
import { getDaysUntilHide } from "../hooks/useFeatureRequests";
import { ASSET_PRIORITIES, FEATURE_REQUEST_STATUSES } from "@/types/database";
import { DenyFeatureRequestModal } from "./DenyFeatureRequestModal";
import { useTheme } from "@/stores/themeStore";

interface FeatureRequestDetailModalProps {
  request: FeatureRequestWithCreator | null;
  isOpen: boolean;
  onClose: () => void;
  onAccept?: (id: string) => void;
  onDeny?: (id: string, reason: string) => void;
  isTransitioning?: boolean;
}

export function FeatureRequestDetailModal({
  request,
  isOpen,
  onClose,
  onAccept,
  onDeny,
  isTransitioning,
}: FeatureRequestDetailModalProps) {
  const [showDenyModal, setShowDenyModal] = useState(false);
  const theme = useTheme();

  if (!request) return null;

  const creatorName = request.creator?.display_name || request.creator?.email || "Unknown";
  const priority = request.priority ? ASSET_PRIORITIES[request.priority] : null;
  const statusStyle = FEATURE_REQUEST_STATUSES[request.status];
  const daysLeft = request.status === "denied" ? getDaysUntilHide(request.denied_at) : null;
  const isOpen_ = request.status === "open";
  const isDenied = request.status === "denied";
  const isAccepted = request.status === "accepted";

  const handleDenyConfirm = (reason: string) => {
    if (onDeny) {
      onDeny(request.id, reason);
      setShowDenyModal(false);
    }
  };

  return (
    <>
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
                  maxWidth: 560,
                  maxHeight: 'calc(100vh - 48px)',
                  backgroundColor: theme.colors.card,
                  borderRadius: 16,
                  boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                  pointerEvents: 'auto',
                  transition: 'all 0.3s ease',
                }}
              >
                {/* Header */}
                <div style={{
                  padding: '20px 24px',
                  borderBottom: `1px solid ${theme.colors.border}`,
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: 16,
                  transition: 'all 0.3s ease',
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
                      {/* Status badge */}
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 500,
                        backgroundColor: `${statusStyle.color}18`,
                        color: statusStyle.color,
                      }}>
                        {statusStyle.label}
                      </span>

                      {/* Days until auto-hide for denied */}
                      {daysLeft !== null && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: daysLeft <= 2 ? `${theme.colors.error}26` : `${theme.colors.textMuted}26`,
                          color: daysLeft <= 2 ? theme.colors.error : theme.colors.textMuted,
                        }}>
                          {daysLeft === 0 ? 'Hiding soon' : `Auto-hides in ${daysLeft}d`}
                        </span>
                      )}

                      {/* Priority badge */}
                      {priority && (
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 500,
                          backgroundColor: `${priority.color}20`,
                          color: priority.color,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                        }}>
                          <Flag style={{ width: 12, height: 12 }} />
                          {priority.label}
                        </span>
                      )}
                    </div>

                    <h2 style={{
                      fontSize: 22,
                      fontWeight: 600,
                      color: theme.colors.text,
                      margin: 0,
                      lineHeight: 1.3,
                      transition: 'all 0.3s ease',
                    }}>
                      {request.name}
                    </h2>
                  </div>

                  <button
                    onClick={onClose}
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
                      flexShrink: 0,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <X style={{ width: 20, height: 20 }} />
                  </button>
                </div>

                {/* Content - scrollable */}
                <div style={{
                  flex: 1,
                  overflow: 'auto',
                  padding: 24,
                }}>
                  {/* Description */}
                  <div style={{ marginBottom: 24 }}>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
                      transition: 'all 0.3s ease',
                    }}>
                      Description
                    </h3>
                    <div style={{
                      backgroundColor: theme.colors.inputBg,
                      borderRadius: 10,
                      padding: 16,
                      maxHeight: 200,
                      overflow: 'auto',
                      transition: 'all 0.3s ease',
                    }}>
                      <p style={{
                        fontSize: 14,
                        color: theme.colors.textMuted,
                        lineHeight: 1.6,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        transition: 'all 0.3s ease',
                      }}>
                        {request.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  {/* Denial reason (if denied) */}
                  {isDenied && request.denial_reason && (
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: theme.colors.error,
                        textTransform: 'uppercase',
                        letterSpacing: '0.05em',
                        margin: '0 0 8px 0',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        transition: 'all 0.3s ease',
                      }}>
                        <MessageSquare style={{ width: 14, height: 14 }} />
                        Denial Reason
                      </h3>
                      <div style={{
                        backgroundColor: `${theme.colors.error}14`,
                        borderRadius: 10,
                        padding: 16,
                        border: `1px solid ${theme.colors.error}26`,
                        transition: 'all 0.3s ease',
                      }}>
                        <p style={{
                          fontSize: 14,
                          color: theme.colors.textMuted,
                          lineHeight: 1.6,
                          margin: 0,
                          whiteSpace: 'pre-wrap',
                          transition: 'all 0.3s ease',
                        }}>
                          {request.denial_reason}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Accepted notice */}
                  {isAccepted && (
                    <div style={{ marginBottom: 24 }}>
                      <div style={{
                        backgroundColor: `${theme.colors.success}14`,
                        borderRadius: 10,
                        padding: 16,
                        border: `1px solid ${theme.colors.success}26`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{
                          width: 40,
                          height: 40,
                          borderRadius: 10,
                          backgroundColor: `${theme.colors.success}26`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.3s ease',
                        }}>
                          <Check style={{ width: 20, height: 20, color: theme.colors.success }} />
                        </div>
                        <div>
                          <p style={{ fontSize: 14, fontWeight: 600, color: theme.colors.success, margin: 0, transition: 'all 0.3s ease' }}>
                            Request Accepted
                          </p>
                          <p style={{ fontSize: 13, color: theme.colors.textMuted, margin: '2px 0 0 0', transition: 'all 0.3s ease' }}>
                            A task has been created from this request
                          </p>
                        </div>
                        {request.linked_asset_id && (
                          <button
                            onClick={() => {
                              // Could navigate to the task - for now just show it exists
                            }}
                            style={{
                              marginLeft: 'auto',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 12px',
                              borderRadius: 8,
                              border: `1px solid ${theme.colors.success}4d`,
                              backgroundColor: 'transparent',
                              color: theme.colors.success,
                              fontSize: 13,
                              fontWeight: 500,
                              cursor: 'pointer',
                              transition: 'all 0.3s ease',
                            }}
                          >
                            <ExternalLink style={{ width: 14, height: 14 }} />
                            View Task
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Meta info */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, 1fr)',
                    gap: 16,
                  }}>
                    {/* Created by */}
                    <div style={{
                      backgroundColor: theme.colors.inputBg,
                      borderRadius: 10,
                      padding: 14,
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: theme.colors.textMuted,
                        transition: 'all 0.3s ease',
                      }}>
                        <User style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Requested by</span>
                      </div>
                      <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                        {creatorName}
                      </p>
                    </div>

                    {/* Created at */}
                    <div style={{
                      backgroundColor: theme.colors.inputBg,
                      borderRadius: 10,
                      padding: 14,
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: theme.colors.textMuted,
                        transition: 'all 0.3s ease',
                      }}>
                        <Clock style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Requested</span>
                      </div>
                      <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                        {formatFullDate(request.created_at)}
                      </p>
                    </div>

                    {/* Accepted info */}
                    {isAccepted && request.accepter && (
                      <>
                        <div style={{
                          backgroundColor: `${theme.colors.success}14`,
                          borderRadius: 10,
                          padding: 14,
                          transition: 'all 0.3s ease',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                            color: theme.colors.success,
                            transition: 'all 0.3s ease',
                          }}>
                            <Check style={{ width: 14, height: 14 }} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>Accepted by</span>
                          </div>
                          <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                            {request.accepter.display_name || request.accepter.email}
                          </p>
                        </div>

                        {request.accepted_at && (
                          <div style={{
                            backgroundColor: `${theme.colors.success}14`,
                            borderRadius: 10,
                            padding: 14,
                            transition: 'all 0.3s ease',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                              color: theme.colors.success,
                              transition: 'all 0.3s ease',
                            }}>
                              <Clock style={{ width: 14, height: 14 }} />
                              <span style={{ fontSize: 12, fontWeight: 500 }}>Accepted on</span>
                            </div>
                            <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                              {formatFullDate(request.accepted_at)}
                            </p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Denied info */}
                    {isDenied && request.denier && (
                      <>
                        <div style={{
                          backgroundColor: `${theme.colors.error}14`,
                          borderRadius: 10,
                          padding: 14,
                          transition: 'all 0.3s ease',
                        }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            marginBottom: 6,
                            color: theme.colors.error,
                            transition: 'all 0.3s ease',
                          }}>
                            <XCircle style={{ width: 14, height: 14 }} />
                            <span style={{ fontSize: 12, fontWeight: 500 }}>Denied by</span>
                          </div>
                          <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                            {request.denier.display_name || request.denier.email}
                          </p>
                        </div>

                        {request.denied_at && (
                          <div style={{
                            backgroundColor: `${theme.colors.error}14`,
                            borderRadius: 10,
                            padding: 14,
                            transition: 'all 0.3s ease',
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginBottom: 6,
                              color: theme.colors.error,
                              transition: 'all 0.3s ease',
                            }}>
                              <Clock style={{ width: 14, height: 14 }} />
                              <span style={{ fontSize: 12, fontWeight: 500 }}>Denied on</span>
                            </div>
                            <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0, transition: 'all 0.3s ease' }}>
                              {formatFullDate(request.denied_at)}
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Footer with actions (only for open requests) */}
                {isOpen_ && (onAccept || onDeny) && (
                  <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.inputBg,
                    display: 'flex',
                    gap: 12,
                    transition: 'all 0.3s ease',
                  }}>
                    {onDeny && (
                      <button
                        onClick={() => setShowDenyModal(true)}
                        disabled={isTransitioning}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 20px',
                          borderRadius: 10,
                          border: `1px solid ${theme.colors.error}4d`,
                          backgroundColor: `${theme.colors.error}14`,
                          color: theme.colors.error,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isTransitioning ? 'not-allowed' : 'pointer',
                          opacity: isTransitioning ? 0.7 : 1,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <XCircle style={{ marginRight: 8, width: 18, height: 18 }} />
                        Deny
                      </button>
                    )}

                    {onAccept && (
                      <button
                        onClick={() => onAccept(request.id)}
                        disabled={isTransitioning}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 20px',
                          borderRadius: 10,
                          border: 'none',
                          backgroundColor: isTransitioning ? `${theme.colors.success}80` : theme.colors.success,
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isTransitioning ? 'not-allowed' : 'pointer',
                          opacity: isTransitioning ? 0.7 : 1,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <Check style={{ marginRight: 8, width: 18, height: 18 }} />
                        Accept & Create Task
                      </button>
                    )}
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Deny Modal */}
      <DenyFeatureRequestModal
        isOpen={showDenyModal}
        onClose={() => setShowDenyModal(false)}
        onConfirm={handleDenyConfirm}
        isLoading={isTransitioning}
        requestName={request?.name}
      />
    </>
  );
}

function formatFullDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}
