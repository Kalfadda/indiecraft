import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Clock, CheckCircle2, Tag, Flag, ArrowLeft, ArrowRight, Edit2, ChevronDown, UserCheck, UserMinus, CalendarDays, MessageCircle, Send, Trash2, Target, ShieldAlert, ShieldOff } from "lucide-react";
import type { AssetWithCreator } from "../hooks/useAssets";
import { useComments } from "../hooks/useComments";
import { useCommentMutations } from "../hooks/useCommentMutations";
import { useGoalsForTask } from "@/features/goals";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, GOAL_STATUSES, type AssetCategory, type AssetPriority } from "@/types/database";
import { useAuthStore } from "@/stores/authStore";
import { useTheme } from "@/stores/themeStore";

interface AssetDetailModalProps {
  asset: AssetWithCreator | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkInProgress?: (id: string) => void;
  onMarkCompleted?: (id: string) => void;
  onMarkBlocked?: (id: string, reason: string) => void;
  onMoveToPending?: (id: string) => void;
  onMoveToInProgress?: (id: string) => void;
  onUnblock?: (id: string) => void;
  onUpdate?: (id: string, data: { name: string; blurb: string; category: AssetCategory | null; priority: AssetPriority | null; eta_date: string | null }) => void;
  onClaim?: (id: string) => void;
  onUnclaim?: (id: string) => void;
  isTransitioning?: boolean;
}

const STATUS_STYLES = {
  blocked: {
    bg: 'rgba(75, 0, 130, 0.2)',
    color: '#4b0082',
    label: 'Blocked'
  },
  pending: {
    bg: 'rgba(202, 138, 4, 0.15)',
    color: '#b45309',
    label: 'Pending'
  },
  in_progress: {
    bg: 'rgba(124, 58, 237, 0.15)',
    color: '#7c3aed',
    label: 'In Progress'
  },
  completed: {
    bg: 'rgba(22, 163, 74, 0.15)',
    color: '#16a34a',
    label: 'Completed'
  }
};

export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  onMarkInProgress,
  onMarkCompleted,
  onMarkBlocked,
  onMoveToPending,
  onMoveToInProgress,
  onUnblock,
  onUpdate,
  onClaim,
  onUnclaim,
  isTransitioning,
}: AssetDetailModalProps) {
  const user = useAuthStore((state) => state.user);
  const theme = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [editCategory, setEditCategory] = useState<AssetCategory | "">("");
  const [editPriority, setEditPriority] = useState<AssetPriority | "">("");
  const [editEtaDate, setEditEtaDate] = useState<string>("");
  const [newComment, setNewComment] = useState("");
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // Comments
  const { data: comments = [], isLoading: commentsLoading } = useComments(asset?.id);
  const { createComment, deleteComment } = useCommentMutations();

  // Goal info
  const { data: goals = [] } = useGoalsForTask(asset?.id);
  const activeGoal = goals.find(g => g.status === "active" || g.status === "completed");

  // Reset edit state when asset changes or modal closes
  useEffect(() => {
    if (asset) {
      setEditName(asset.name);
      setEditBlurb(asset.blurb || "");
      setEditCategory(asset.category || "");
      setEditPriority(asset.priority || "");
      setEditEtaDate(asset.eta_date || "");
    }
    setIsEditing(false);
    setNewComment("");
    setShowBlockModal(false);
    setBlockReason("");
  }, [asset, isOpen]);

  if (!asset) return null;

  const creatorName = asset.creator?.display_name || asset.creator?.email || "Unknown";
  const category = asset.category ? ASSET_CATEGORIES[asset.category] : null;
  const priority = asset.priority ? ASSET_PRIORITIES[asset.priority] : null;
  const statusStyle = STATUS_STYLES[asset.status];

  // Claim state
  const isClaimed = !!asset.claimed_by;
  const isClaimedByMe = user?.id === asset.claimed_by;
  const claimerName = asset.claimer?.display_name || asset.claimer?.email || "Unknown";

  const handleSave = () => {
    if (onUpdate && editName.trim()) {
      onUpdate(asset.id, {
        name: editName.trim(),
        blurb: editBlurb.trim(),
        category: editCategory || null,
        priority: editPriority || null,
        eta_date: editEtaDate || null,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(asset.name);
    setEditBlurb(asset.blurb || "");
    setEditCategory(asset.category || "");
    setEditPriority(asset.priority || "");
    setEditEtaDate(asset.eta_date || "");
    setIsEditing(false);
  };

  const handleAddComment = () => {
    if (!newComment.trim() || !asset) return;
    createComment.mutate({
      asset_id: asset.id,
      content: newComment.trim(),
    });
    setNewComment("");
  };

  const handleDeleteComment = (commentId: string) => {
    if (!asset) return;
    deleteComment.mutate({ commentId, assetId: asset.id });
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
            onClick={onClose}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(4px)',
              zIndex: 100,
              transition: 'all 0.3s ease',
            }}
          />

          {/* Modal Container - handles centering */}
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
                    backgroundColor: statusStyle.bg,
                    color: statusStyle.color,
                  }}>
                    {statusStyle.label}
                  </span>

                  {/* Claimed badge */}
                  {isClaimed && (
                    <motion.span
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      style={{
                        padding: '4px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 600,
                        background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                        color: theme.colors.textInverse,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: `0 2px 4px ${theme.colors.primaryLight}`,
                      }}
                    >
                      <UserCheck style={{ width: 12, height: 12 }} />
                      {isClaimedByMe ? 'Claimed by you' : `Claimed by ${claimerName.split('@')[0]}`}
                    </motion.span>
                  )}

                  {/* Category badge */}
                  {category && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: `${category.color}20`,
                      color: category.color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}>
                      <Tag style={{ width: 12, height: 12 }} />
                      {category.label}
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

                  {/* Goal badge */}
                  {activeGoal && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: `${GOAL_STATUSES[activeGoal.status].color}20`,
                      color: GOAL_STATUSES[activeGoal.status].color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      <Target style={{ width: 12, height: 12 }} />
                      {activeGoal.name}
                    </span>
                  )}
                </div>

                {isEditing ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    style={{
                      fontSize: 20,
                      fontWeight: 600,
                      color: theme.colors.text,
                      margin: 0,
                      lineHeight: 1.3,
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.inputBg,
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                    placeholder="Task name"
                  />
                ) : (
                  <h2 style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: theme.colors.text,
                    margin: 0,
                    lineHeight: 1.3,
                    transition: 'all 0.3s ease',
                  }}>
                    {asset.name}
                  </h2>
                )}
              </div>

              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                {onUpdate && !isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
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
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.primaryLight;
                      e.currentTarget.style.color = theme.colors.primary;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = theme.colors.textMuted;
                    }}
                    title="Edit task"
                  >
                    <Edit2 style={{ width: 18, height: 18 }} />
                  </button>
                )}
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
                    transition: 'all 0.3s ease',
                  }}
                >
                  <X style={{ width: 20, height: 20 }} />
                </button>
              </div>
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
                  marginBottom: 8,
                  margin: '0 0 8px 0',
                  transition: 'all 0.3s ease',
                }}>
                  Description
                </h3>
                {isEditing ? (
                  <textarea
                    value={editBlurb}
                    onChange={(e) => {
                      setEditBlurb(e.target.value);
                      // Auto-resize based on content
                      e.target.style.height = 'auto';
                      e.target.style.height = `${Math.min(e.target.scrollHeight, 400)}px`;
                    }}
                    ref={(el) => {
                      // Set initial height based on content when entering edit mode
                      if (el) {
                        el.style.height = 'auto';
                        el.style.height = `${Math.min(el.scrollHeight, 400)}px`;
                      }
                    }}
                    style={{
                      width: '100%',
                      minHeight: 120,
                      maxHeight: 400,
                      padding: 16,
                      fontSize: 14,
                      color: theme.colors.textSecondary,
                      lineHeight: 1.6,
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.inputBg,
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      overflowY: 'auto',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                    placeholder="Add a description..."
                  />
                ) : (
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
                      color: theme.colors.textSecondary,
                      lineHeight: 1.6,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}>
                      {asset.blurb || "No description provided."}
                    </p>
                  </div>
                )}
              </div>

              {/* Category, Priority & ETA (edit mode only) */}
              {isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
                  {/* Category */}
                  <div>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
                      transition: 'all 0.3s ease',
                    }}>
                      Category
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={editCategory}
                        onChange={(e) => setEditCategory(e.target.value as AssetCategory | "")}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${theme.colors.inputBorder}`,
                          backgroundColor: theme.colors.inputBg,
                          color: editCategory ? theme.colors.text : theme.colors.textMuted,
                          appearance: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                        onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                      >
                        <option value="">No category</option>
                        {Object.entries(ASSET_CATEGORIES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                      <ChevronDown style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: theme.colors.textMuted,
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
                      transition: 'all 0.3s ease',
                    }}>
                      Priority
                    </h3>
                    <div style={{ position: 'relative' }}>
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value as AssetPriority | "")}
                        style={{
                          width: '100%',
                          padding: '10px 36px 10px 14px',
                          borderRadius: 8,
                          border: `1px solid ${theme.colors.inputBorder}`,
                          backgroundColor: theme.colors.inputBg,
                          color: editPriority ? theme.colors.text : theme.colors.textMuted,
                          appearance: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          outline: 'none',
                          transition: 'all 0.3s ease',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                        onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                      >
                        <option value="">No priority</option>
                        {Object.entries(ASSET_PRIORITIES).map(([key, val]) => (
                          <option key={key} value={key}>{val.label}</option>
                        ))}
                      </select>
                      <ChevronDown style={{
                        position: 'absolute',
                        right: 12,
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: theme.colors.textMuted,
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>

                  {/* ETA Date */}
                  <div>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: theme.colors.textMuted,
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.3s ease',
                    }}>
                      <CalendarDays style={{ width: 14, height: 14 }} />
                      ETA Date
                    </h3>
                    <input
                      type="date"
                      value={editEtaDate}
                      onChange={(e) => setEditEtaDate(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: 8,
                        border: `1px solid ${theme.colors.inputBorder}`,
                        backgroundColor: theme.colors.inputBg,
                        color: editEtaDate ? theme.colors.text : theme.colors.textMuted,
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                    />
                    <p style={{ fontSize: 11, color: theme.colors.textMuted, marginTop: 4, margin: '4px 0 0 0' }}>
                      Creates a deliverable on schedule
                    </p>
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
                  }}>
                    <User style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Created by</span>
                  </div>
                  <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
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
                  }}>
                    <Clock style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Created</span>
                  </div>
                  <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
                    {formatFullDate(asset.created_at)}
                  </p>
                </div>

                {/* Completed info */}
                {asset.status === "completed" && asset.completer && (
                  <>
                    <div style={{
                      backgroundColor: theme.colors.infoBg,
                      borderRadius: 10,
                      padding: 14,
                      transition: 'all 0.3s ease',
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: theme.colors.info,
                      }}>
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Completed by</span>
                      </div>
                      <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
                        {asset.completer.display_name || asset.completer.email}
                      </p>
                    </div>

                    {asset.completed_at && (
                      <div style={{
                        backgroundColor: theme.colors.infoBg,
                        borderRadius: 10,
                        padding: 14,
                        transition: 'all 0.3s ease',
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          color: theme.colors.info,
                        }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Completed on</span>
                        </div>
                        <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
                          {formatFullDate(asset.completed_at)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Claimed info */}
                {isClaimed && asset.claimer && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        backgroundColor: theme.colors.claimedBg,
                        borderRadius: 10,
                        padding: 14,
                        border: `1px solid ${theme.colors.primaryLight}`,
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: theme.colors.primary,
                      }}>
                        <UserCheck style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Claimed by</span>
                      </div>
                      <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
                        {asset.claimer.display_name || asset.claimer.email}
                      </p>
                    </motion.div>

                    {asset.claimed_at && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        style={{
                          backgroundColor: theme.colors.claimedBg,
                          borderRadius: 10,
                          padding: 14,
                          border: `1px solid ${theme.colors.primaryLight}`,
                          transition: 'all 0.3s ease',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          color: theme.colors.primary,
                        }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Claimed on</span>
                        </div>
                        <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 500, margin: 0 }}>
                          {formatFullDate(asset.claimed_at)}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}

                {/* Blocked info */}
                {asset.status === "blocked" && asset.blocker && (
                  <>
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      style={{
                        backgroundColor: 'rgba(75, 0, 130, 0.08)',
                        borderRadius: 10,
                        padding: 14,
                        border: '1px solid rgba(75, 0, 130, 0.2)',
                        gridColumn: '1 / -1',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: '#4b0082',
                      }}>
                        <ShieldAlert style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Blocked by {asset.blocker.display_name || asset.blocker.email}</span>
                      </div>
                      {asset.blocked_reason && (
                        <p style={{ fontSize: 14, color: theme.colors.text, fontWeight: 400, margin: 0, lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                          {asset.blocked_reason}
                        </p>
                      )}
                      {asset.blocked_at && (
                        <p style={{ fontSize: 12, color: theme.colors.textMuted, margin: '8px 0 0 0' }}>
                          {formatFullDate(asset.blocked_at)}
                        </p>
                      )}
                    </motion.div>
                  </>
                )}
              </div>

              {/* Comments Section */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.textMuted,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.3s ease',
                }}>
                  <MessageCircle style={{ width: 14, height: 14 }} />
                  Updates ({comments.length})
                </h3>

                {/* Comments list */}
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  marginBottom: 16,
                }}>
                  {commentsLoading ? (
                    <div style={{
                      padding: 16,
                      textAlign: 'center',
                      color: theme.colors.textMuted,
                      fontSize: 14,
                    }}>
                      Loading updates...
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{
                      padding: 20,
                      textAlign: 'center',
                      color: theme.colors.textMuted,
                      fontSize: 14,
                      backgroundColor: theme.colors.inputBg,
                      borderRadius: 10,
                      border: `1px dashed ${theme.colors.border}`,
                      transition: 'all 0.3s ease',
                    }}>
                      No updates yet. Add one to track progress.
                    </div>
                  ) : (
                    comments.map((comment) => {
                      const isOwner = user?.id === comment.created_by;
                      const authorName = comment.author?.display_name || comment.author?.email?.split('@')[0] || 'Unknown';
                      return (
                        <motion.div
                          key={comment.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          style={{
                            backgroundColor: theme.colors.inputBg,
                            borderRadius: 10,
                            padding: 14,
                            border: `1px solid ${theme.colors.border}`,
                            transition: 'all 0.3s ease',
                          }}
                        >
                          <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'flex-start',
                            marginBottom: 8,
                          }}>
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                            }}>
                              <div style={{
                                width: 28,
                                height: 28,
                                borderRadius: '50%',
                                backgroundColor: theme.colors.primary,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: theme.colors.textInverse,
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: theme.colors.text,
                                }}>
                                  {authorName}
                                </span>
                                <span style={{
                                  fontSize: 12,
                                  color: theme.colors.textMuted,
                                  marginLeft: 8,
                                }}>
                                  {formatCommentDate(comment.created_at)}
                                </span>
                              </div>
                            </div>
                            {isOwner && (
                              <button
                                onClick={() => handleDeleteComment(comment.id)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  width: 24,
                                  height: 24,
                                  borderRadius: 6,
                                  border: 'none',
                                  backgroundColor: 'transparent',
                                  color: theme.colors.textMuted,
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = theme.colors.errorBg;
                                  e.currentTarget.style.color = theme.colors.error;
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = theme.colors.textMuted;
                                }}
                                title="Delete update"
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            )}
                          </div>
                          <p style={{
                            fontSize: 14,
                            color: theme.colors.textSecondary,
                            lineHeight: 1.5,
                            margin: 0,
                            whiteSpace: 'pre-wrap',
                          }}>
                            {comment.content}
                          </p>
                        </motion.div>
                      );
                    })
                  )}
                </div>

                {/* Add comment form */}
                <div style={{
                  display: 'flex',
                  gap: 10,
                }}>
                  <input
                    type="text"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment();
                      }
                    }}
                    placeholder="Add a progress update..."
                    style={{
                      flex: 1,
                      padding: '10px 14px',
                      borderRadius: 8,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.card,
                      color: theme.colors.text,
                      fontSize: 14,
                      outline: 'none',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || createComment.isPending}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '10px 16px',
                      borderRadius: 8,
                      border: 'none',
                      backgroundColor: newComment.trim() ? theme.colors.primary : theme.colors.border,
                      color: newComment.trim() ? theme.colors.textInverse : theme.colors.textMuted,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: newComment.trim() ? 'pointer' : 'not-allowed',
                      transition: 'all 0.15s ease',
                      gap: 6,
                    }}
                  >
                    <Send style={{ width: 14, height: 14 }} />
                    Post
                  </button>
                </div>
              </div>
            </div>

            {/* Footer with actions */}
            {isEditing ? (
              <div style={{
                padding: '16px 24px',
                borderTop: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.backgroundSecondary,
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
                transition: 'all 0.3s ease',
              }}>
                <button
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
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
                  onClick={handleSave}
                  disabled={!editName.trim()}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: 'none',
                    backgroundColor: editName.trim() ? theme.colors.primary : theme.colors.border,
                    color: theme.colors.textInverse,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: editName.trim() ? 'pointer' : 'not-allowed',
                    transition: 'all 0.3s ease',
                  }}
                >
                  Save Changes
                </button>
              </div>
            ) : (onMarkInProgress || onMarkCompleted || onMarkBlocked || onMoveToPending || onMoveToInProgress || onUnblock || onClaim || onUnclaim) && (
              <div style={{
                padding: '16px 24px',
                borderTop: `1px solid ${theme.colors.border}`,
                backgroundColor: theme.colors.backgroundSecondary,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                transition: 'all 0.3s ease',
              }}>
                {/* Block/Unblock button row */}
                {(onMarkBlocked || onUnblock) && asset.status !== "blocked" && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setShowBlockModal(true)}
                      disabled={isTransitioning}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 20px',
                        borderRadius: 10,
                        border: '2px solid rgba(75, 0, 130, 0.3)',
                        backgroundColor: 'rgba(75, 0, 130, 0.08)',
                        color: '#4b0082',
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: isTransitioning ? 'not-allowed' : 'pointer',
                        opacity: isTransitioning ? 0.7 : 1,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ShieldAlert style={{ marginRight: 8, width: 18, height: 18 }} />
                      Mark as Blocked
                    </motion.button>
                  </div>
                )}

                {/* Unblock button for blocked tasks */}
                {onUnblock && asset.status === "blocked" && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => onUnblock(asset.id)}
                      disabled={isTransitioning}
                      style={{
                        flex: 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 20px',
                        borderRadius: 10,
                        border: 'none',
                        background: `linear-gradient(135deg, ${theme.colors.success} 0%, #22c55e 100%)`,
                        color: theme.colors.textInverse,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: isTransitioning ? 'not-allowed' : 'pointer',
                        opacity: isTransitioning ? 0.7 : 1,
                        boxShadow: `0 4px 12px ${theme.colors.successBg}`,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <ShieldOff style={{ marginRight: 8, width: 18, height: 18 }} />
                      Unblock Task
                    </motion.button>
                  </div>
                )}

                {/* Claim/Unclaim button row */}
                {(onClaim || onUnclaim) && asset.status !== "blocked" && (
                  <div style={{ display: 'flex', gap: 12 }}>
                    {!isClaimed && onClaim && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onClaim(asset.id)}
                        disabled={isTransitioning}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 20px',
                          borderRadius: 10,
                          border: 'none',
                          background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                          color: theme.colors.textInverse,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isTransitioning ? 'not-allowed' : 'pointer',
                          opacity: isTransitioning ? 0.7 : 1,
                          boxShadow: `0 4px 12px ${theme.colors.primaryLight}`,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <UserCheck style={{ marginRight: 8, width: 18, height: 18 }} />
                        Claim This Task
                      </motion.button>
                    )}
                    {isClaimed && isClaimedByMe && onUnclaim && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onUnclaim(asset.id)}
                        disabled={isTransitioning}
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '12px 20px',
                          borderRadius: 10,
                          border: `2px solid ${theme.colors.primaryLight}`,
                          backgroundColor: theme.colors.primaryLighter,
                          color: theme.colors.primary,
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isTransitioning ? 'not-allowed' : 'pointer',
                          opacity: isTransitioning ? 0.7 : 1,
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <UserMinus style={{ marginRight: 8, width: 18, height: 18 }} />
                        Release Claim
                      </motion.button>
                    )}
                    {isClaimed && !isClaimedByMe && (
                      <div style={{
                        flex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '12px 20px',
                        borderRadius: 10,
                        backgroundColor: theme.colors.primaryLighter,
                        color: theme.colors.primary,
                        fontSize: 14,
                        fontWeight: 500,
                        transition: 'all 0.3s ease',
                      }}>
                        <UserCheck style={{ marginRight: 8, width: 16, height: 16 }} />
                        Claimed by {claimerName.split('@')[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Status action buttons - only show buttons appropriate for current status */}
                <div style={{ display: 'flex', gap: 12 }}>
                {/* Back buttons - move task to earlier workflow stages */}
                {onMoveToPending && asset.status && asset.status !== "pending" && asset.status !== "blocked" && (
                  <button
                    onClick={() => onMoveToPending(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.card,
                      color: theme.colors.textMuted,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <ArrowLeft style={{ marginRight: 8, width: 16, height: 16 }} />
                    Back to Pending
                  </button>
                )}

                {onMoveToInProgress && asset.status && asset.status === "completed" && (
                  <button
                    onClick={() => onMoveToInProgress(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.border}`,
                      backgroundColor: theme.colors.card,
                      color: theme.colors.textMuted,
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <ArrowLeft style={{ marginRight: 8, width: 16, height: 16 }} />
                    Back to In Progress
                  </button>
                )}

                {/* Forward buttons */}
                {onMarkInProgress && asset.status && asset.status === "pending" && (
                  <button
                    onClick={() => onMarkInProgress(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: isTransitioning ? theme.colors.accent : theme.colors.primary,
                      color: theme.colors.textInverse,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    Start Working
                    <ArrowRight style={{ marginLeft: 8, width: 16, height: 16 }} />
                  </button>
                )}

                {onMarkCompleted && asset.status && asset.status === "in_progress" && (
                  <button
                    onClick={() => onMarkCompleted(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: isTransitioning ? theme.colors.accent : theme.colors.success,
                      color: theme.colors.textInverse,
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <CheckCircle2 style={{ marginRight: 8, width: 16, height: 16 }} />
                    Mark Completed
                  </button>
                )}
                </div>
              </div>
            )}
            </motion.div>
          </div>

          {/* Block Reason Modal */}
          {showBlockModal && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowBlockModal(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.6)',
                  zIndex: 200,
                }}
              />
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
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
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
                  <div style={{
                    padding: '20px 24px',
                    borderBottom: `1px solid ${theme.colors.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'all 0.3s ease',
                  }}>
                    <div style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      backgroundColor: 'rgba(75, 0, 130, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                      <ShieldAlert style={{ width: 20, height: 20, color: '#4b0082' }} />
                    </div>
                    <div>
                      <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: theme.colors.text }}>
                        Block Task
                      </h3>
                      <p style={{ margin: 0, fontSize: 13, color: theme.colors.textMuted }}>
                        Provide a reason for blocking this task
                      </p>
                    </div>
                  </div>
                  <div style={{ padding: 24 }}>
                    <textarea
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Why is this task blocked? (e.g., waiting for dependencies, need clarification, external blocker)"
                      style={{
                        width: '100%',
                        minHeight: 120,
                        padding: 14,
                        fontSize: 14,
                        color: theme.colors.text,
                        lineHeight: 1.5,
                        borderRadius: 10,
                        border: `1px solid ${theme.colors.inputBorder}`,
                        backgroundColor: theme.colors.inputBg,
                        resize: 'vertical',
                        outline: 'none',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                        transition: 'all 0.3s ease',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#4b0082'}
                      onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                      autoFocus
                    />
                  </div>
                  <div style={{
                    padding: '16px 24px',
                    borderTop: `1px solid ${theme.colors.border}`,
                    backgroundColor: theme.colors.backgroundSecondary,
                    display: 'flex',
                    gap: 12,
                    justifyContent: 'flex-end',
                    transition: 'all 0.3s ease',
                  }}>
                    <button
                      onClick={() => {
                        setShowBlockModal(false);
                        setBlockReason("");
                      }}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
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
                      onClick={() => {
                        if (onMarkBlocked && blockReason.trim()) {
                          onMarkBlocked(asset.id, blockReason.trim());
                          setShowBlockModal(false);
                          setBlockReason("");
                        }
                      }}
                      disabled={!blockReason.trim()}
                      style={{
                        padding: '10px 20px',
                        borderRadius: 8,
                        border: 'none',
                        backgroundColor: blockReason.trim() ? '#4b0082' : theme.colors.border,
                        color: theme.colors.textInverse,
                        fontSize: 14,
                        fontWeight: 600,
                        cursor: blockReason.trim() ? 'pointer' : 'not-allowed',
                        transition: 'all 0.3s ease',
                      }}
                    >
                      Block Task
                    </button>
                  </div>
                </motion.div>
              </div>
            </>
          )}
        </>
      )}
    </AnimatePresence>
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

function formatCommentDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
