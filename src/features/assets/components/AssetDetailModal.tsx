import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Clock, CheckCircle2, Tag, Flag, ArrowLeft, ArrowRight, Archive, Edit2, ChevronDown, UserCheck, UserMinus, CalendarDays, MessageCircle, Send, Trash2, GitBranch } from "lucide-react";
import type { AssetWithCreator } from "../hooks/useAssets";
import { getDaysUntilDelete } from "../hooks/useAssets";
import { useComments } from "../hooks/useComments";
import { useCommentMutations } from "../hooks/useCommentMutations";
import { usePipelinesForTask } from "@/features/pipelines/hooks/usePipelines";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, PIPELINE_STATUSES, type AssetCategory, type AssetPriority } from "@/types/database";
import { useAuthStore } from "@/stores/authStore";

interface AssetDetailModalProps {
  asset: AssetWithCreator | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkInProgress?: (id: string) => void;
  onMarkCompleted?: (id: string) => void;
  onMarkImplemented?: (id: string) => void;
  onMoveToPending?: (id: string) => void;
  onMoveToInProgress?: (id: string) => void;
  onMoveToCompleted?: (id: string) => void;
  onUpdate?: (id: string, data: { name: string; blurb: string; category: AssetCategory | null; priority: AssetPriority | null; eta_date: string | null }) => void;
  onClaim?: (id: string) => void;
  onUnclaim?: (id: string) => void;
  isTransitioning?: boolean;
}

const STATUS_STYLES = {
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
    bg: 'rgba(59, 130, 246, 0.15)',
    color: '#2563eb',
    label: 'Completed'
  },
  implemented: {
    bg: 'rgba(22, 163, 74, 0.15)',
    color: '#16a34a',
    label: 'Implemented'
  }
};

export function AssetDetailModal({
  asset,
  isOpen,
  onClose,
  onMarkInProgress,
  onMarkCompleted,
  onMarkImplemented,
  onMoveToPending,
  onMoveToInProgress,
  onMoveToCompleted,
  onUpdate,
  onClaim,
  onUnclaim,
  isTransitioning,
}: AssetDetailModalProps) {
  const user = useAuthStore((state) => state.user);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [editCategory, setEditCategory] = useState<AssetCategory | "">("");
  const [editPriority, setEditPriority] = useState<AssetPriority | "">("");
  const [editEtaDate, setEditEtaDate] = useState<string>("");
  const [newComment, setNewComment] = useState("");

  // Comments
  const { data: comments = [], isLoading: commentsLoading } = useComments(asset?.id);
  const { createComment, deleteComment } = useCommentMutations();

  // Pipeline info
  const { data: pipelines = [] } = usePipelinesForTask(asset?.id);
  const activePipeline = pipelines.find(p => p.status === "active" || p.status === "completed");

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
  }, [asset, isOpen]);

  if (!asset) return null;

  const creatorName = asset.creator?.display_name || asset.creator?.email || "Unknown";
  const category = asset.category ? ASSET_CATEGORIES[asset.category] : null;
  const priority = asset.priority ? ASSET_PRIORITIES[asset.priority] : null;
  const statusStyle = STATUS_STYLES[asset.status];
  const daysLeft = asset.status === "implemented" ? getDaysUntilDelete(asset.implemented_at) : null;

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
                backgroundColor: '#ffffff',
                borderRadius: 16,
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                pointerEvents: 'auto',
              }}
            >
            {/* Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e5e5eb',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: 16,
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
                        background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        boxShadow: '0 2px 4px rgba(124, 58, 237, 0.3)',
                      }}
                    >
                      <UserCheck style={{ width: 12, height: 12 }} />
                      {isClaimedByMe ? 'Claimed by you' : `Claimed by ${claimerName.split('@')[0]}`}
                    </motion.span>
                  )}

                  {/* Days until auto-delete badge for implemented */}
                  {daysLeft !== null && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: daysLeft <= 2 ? 'rgba(220, 38, 38, 0.15)' : 'rgba(107, 114, 128, 0.15)',
                      color: daysLeft <= 2 ? '#dc2626' : '#6b7280',
                    }}>
                      {daysLeft === 0 ? 'Deleting soon' : `Auto-deletes in ${daysLeft}d`}
                    </span>
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

                  {/* Pipeline badge */}
                  {activePipeline && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 500,
                      backgroundColor: `${PIPELINE_STATUSES[activePipeline.status].color}20`,
                      color: PIPELINE_STATUSES[activePipeline.status].color,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}>
                      <GitBranch style={{ width: 12, height: 12 }} />
                      {activePipeline.name}
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
                      color: '#1e1e2e',
                      margin: 0,
                      lineHeight: 1.3,
                      width: '100%',
                      padding: '8px 12px',
                      borderRadius: 8,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#f9fafb',
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
                    placeholder="Task name"
                  />
                ) : (
                  <h2 style={{
                    fontSize: 22,
                    fontWeight: 600,
                    color: '#1e1e2e',
                    margin: 0,
                    lineHeight: 1.3,
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
                      color: '#9ca3af',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(124, 58, 237, 0.1)';
                      e.currentTarget.style.color = '#7c3aed';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#9ca3af';
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
                    color: '#9ca3af',
                    cursor: 'pointer',
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
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  marginBottom: 8,
                  margin: '0 0 8px 0',
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
                      color: '#4b5563',
                      lineHeight: 1.6,
                      borderRadius: 10,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#f9fafb',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                      overflowY: 'auto',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
                    placeholder="Add a description..."
                  />
                ) : (
                  <div style={{
                    backgroundColor: '#f9fafb',
                    borderRadius: 10,
                    padding: 16,
                    maxHeight: 200,
                    overflow: 'auto',
                  }}>
                    <p style={{
                      fontSize: 14,
                      color: '#4b5563',
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
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
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
                          border: '1px solid #e5e5eb',
                          backgroundColor: '#f9fafb',
                          color: editCategory ? '#1e1e2e' : '#9ca3af',
                          appearance: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
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
                        color: '#9ca3af',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>

                  {/* Priority */}
                  <div>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
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
                          border: '1px solid #e5e5eb',
                          backgroundColor: '#f9fafb',
                          color: editPriority ? '#1e1e2e' : '#9ca3af',
                          appearance: 'none',
                          cursor: 'pointer',
                          fontSize: 14,
                          outline: 'none',
                        }}
                        onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                        onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
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
                        color: '#9ca3af',
                        pointerEvents: 'none'
                      }} />
                    </div>
                  </div>

                  {/* ETA Date */}
                  <div>
                    <h3 style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#6b7280',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      margin: '0 0 8px 0',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
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
                        border: '1px solid #e5e5eb',
                        backgroundColor: '#f9fafb',
                        color: editEtaDate ? '#1e1e2e' : '#9ca3af',
                        fontSize: 14,
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                      onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
                    />
                    <p style={{ fontSize: 11, color: '#9ca3af', marginTop: 4, margin: '4px 0 0 0' }}>
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
                  backgroundColor: '#f9fafb',
                  borderRadius: 10,
                  padding: 14,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    color: '#9ca3af',
                  }}>
                    <User style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Created by</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                    {creatorName}
                  </p>
                </div>

                {/* Created at */}
                <div style={{
                  backgroundColor: '#f9fafb',
                  borderRadius: 10,
                  padding: 14,
                }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 6,
                    color: '#9ca3af',
                  }}>
                    <Clock style={{ width: 14, height: 14 }} />
                    <span style={{ fontSize: 12, fontWeight: 500 }}>Created</span>
                  </div>
                  <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                    {formatFullDate(asset.created_at)}
                  </p>
                </div>

                {/* Completed info */}
                {(asset.status === "completed" || asset.status === "implemented") && asset.completer && (
                  <>
                    <div style={{
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      borderRadius: 10,
                      padding: 14,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: '#2563eb',
                      }}>
                        <CheckCircle2 style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Completed by</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                        {asset.completer.display_name || asset.completer.email}
                      </p>
                    </div>

                    {asset.completed_at && (
                      <div style={{
                        backgroundColor: 'rgba(59, 130, 246, 0.08)',
                        borderRadius: 10,
                        padding: 14,
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          color: '#2563eb',
                        }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Completed on</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                          {formatFullDate(asset.completed_at)}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Implemented info */}
                {asset.status === "implemented" && asset.implementer && (
                  <>
                    <div style={{
                      backgroundColor: 'rgba(22, 163, 74, 0.08)',
                      borderRadius: 10,
                      padding: 14,
                    }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: '#16a34a',
                      }}>
                        <Archive style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Implemented by</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                        {asset.implementer.display_name || asset.implementer.email}
                      </p>
                    </div>

                    {asset.implemented_at && (
                      <div style={{
                        backgroundColor: 'rgba(22, 163, 74, 0.08)',
                        borderRadius: 10,
                        padding: 14,
                      }}>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          color: '#16a34a',
                        }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Implemented on</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                          {formatFullDate(asset.implemented_at)}
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
                        backgroundColor: 'rgba(124, 58, 237, 0.08)',
                        borderRadius: 10,
                        padding: 14,
                        border: '1px solid rgba(124, 58, 237, 0.15)',
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        marginBottom: 6,
                        color: '#7c3aed',
                      }}>
                        <UserCheck style={{ width: 14, height: 14 }} />
                        <span style={{ fontSize: 12, fontWeight: 500 }}>Claimed by</span>
                      </div>
                      <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                        {asset.claimer.display_name || asset.claimer.email}
                      </p>
                    </motion.div>

                    {asset.claimed_at && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.05 }}
                        style={{
                          backgroundColor: 'rgba(124, 58, 237, 0.08)',
                          borderRadius: 10,
                          padding: 14,
                          border: '1px solid rgba(124, 58, 237, 0.15)',
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          marginBottom: 6,
                          color: '#7c3aed',
                        }}>
                          <Clock style={{ width: 14, height: 14 }} />
                          <span style={{ fontSize: 12, fontWeight: 500 }}>Claimed on</span>
                        </div>
                        <p style={{ fontSize: 14, color: '#1e1e2e', fontWeight: 500, margin: 0 }}>
                          {formatFullDate(asset.claimed_at)}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </div>

              {/* Comments Section */}
              <div style={{ marginTop: 24 }}>
                <h3 style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: '#6b7280',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 12px 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
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
                      color: '#9ca3af',
                      fontSize: 14,
                    }}>
                      Loading updates...
                    </div>
                  ) : comments.length === 0 ? (
                    <div style={{
                      padding: 20,
                      textAlign: 'center',
                      color: '#9ca3af',
                      fontSize: 14,
                      backgroundColor: '#f9fafb',
                      borderRadius: 10,
                      border: '1px dashed #e5e5eb',
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
                            backgroundColor: '#f9fafb',
                            borderRadius: 10,
                            padding: 14,
                            border: '1px solid #e5e5eb',
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
                                backgroundColor: '#7c3aed',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontSize: 12,
                                fontWeight: 600,
                              }}>
                                {authorName.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <span style={{
                                  fontSize: 13,
                                  fontWeight: 600,
                                  color: '#1e1e2e',
                                }}>
                                  {authorName}
                                </span>
                                <span style={{
                                  fontSize: 12,
                                  color: '#9ca3af',
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
                                  color: '#9ca3af',
                                  cursor: 'pointer',
                                  transition: 'all 0.15s ease',
                                }}
                                onMouseOver={(e) => {
                                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                                  e.currentTarget.style.color = '#ef4444';
                                }}
                                onMouseOut={(e) => {
                                  e.currentTarget.style.backgroundColor = 'transparent';
                                  e.currentTarget.style.color = '#9ca3af';
                                }}
                                title="Delete update"
                              >
                                <Trash2 style={{ width: 14, height: 14 }} />
                              </button>
                            )}
                          </div>
                          <p style={{
                            fontSize: 14,
                            color: '#4b5563',
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
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#fff',
                      fontSize: 14,
                      outline: 'none',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = '#7c3aed'}
                    onBlur={(e) => e.currentTarget.style.borderColor = '#e5e5eb'}
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
                      backgroundColor: newComment.trim() ? '#7c3aed' : '#e5e5eb',
                      color: newComment.trim() ? '#fff' : '#9ca3af',
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
                borderTop: '1px solid #e5e5eb',
                backgroundColor: '#fafafa',
                display: 'flex',
                gap: 12,
                justifyContent: 'flex-end',
              }}>
                <button
                  onClick={handleCancel}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px 24px',
                    borderRadius: 10,
                    border: '1px solid #e5e5eb',
                    backgroundColor: '#fff',
                    color: '#6b7280',
                    fontSize: 14,
                    fontWeight: 500,
                    cursor: 'pointer',
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
                    backgroundColor: editName.trim() ? '#7c3aed' : '#d1d5db',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: editName.trim() ? 'pointer' : 'not-allowed',
                  }}
                >
                  Save Changes
                </button>
              </div>
            ) : (onMarkInProgress || onMarkCompleted || onMarkImplemented || onMoveToPending || onMoveToInProgress || onMoveToCompleted || onClaim || onUnclaim) && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e5eb',
                backgroundColor: '#fafafa',
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}>
                {/* Claim/Unclaim button row */}
                {(onClaim || onUnclaim) && (
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
                          background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
                          color: '#fff',
                          fontSize: 14,
                          fontWeight: 600,
                          cursor: isTransitioning ? 'not-allowed' : 'pointer',
                          opacity: isTransitioning ? 0.7 : 1,
                          boxShadow: '0 4px 12px rgba(124, 58, 237, 0.3)',
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
                          border: '2px solid rgba(124, 58, 237, 0.3)',
                          backgroundColor: 'rgba(124, 58, 237, 0.08)',
                          color: '#7c3aed',
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
                        backgroundColor: 'rgba(124, 58, 237, 0.08)',
                        color: '#7c3aed',
                        fontSize: 14,
                        fontWeight: 500,
                      }}>
                        <UserCheck style={{ marginRight: 8, width: 16, height: 16 }} />
                        Claimed by {claimerName.split('@')[0]}
                      </div>
                    )}
                  </div>
                )}

                {/* Status action buttons */}
                <div style={{ display: 'flex', gap: 12 }}>
                {/* Back buttons */}
                {onMoveToPending && (
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
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#fff',
                      color: '#6b7280',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    <ArrowLeft style={{ marginRight: 8, width: 16, height: 16 }} />
                    Back to Pending
                  </button>
                )}

                {onMoveToInProgress && (
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
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#fff',
                      color: '#6b7280',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    <ArrowLeft style={{ marginRight: 8, width: 16, height: 16 }} />
                    Back to In Progress
                  </button>
                )}

                {onMoveToCompleted && (
                  <button
                    onClick={() => onMoveToCompleted(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#fff',
                      color: '#6b7280',
                      fontSize: 14,
                      fontWeight: 500,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    <ArrowLeft style={{ marginRight: 8, width: 16, height: 16 }} />
                    Back to Completed
                  </button>
                )}

                {/* Forward buttons */}
                {onMarkInProgress && (
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
                      backgroundColor: isTransitioning ? '#c4b5fd' : '#7c3aed',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    Start Working
                    <ArrowRight style={{ marginLeft: 8, width: 16, height: 16 }} />
                  </button>
                )}

                {onMarkCompleted && (
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
                      backgroundColor: isTransitioning ? '#93c5fd' : '#3b82f6',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    <CheckCircle2 style={{ marginRight: 8, width: 16, height: 16 }} />
                    Mark Completed
                    <ArrowRight style={{ marginLeft: 8, width: 16, height: 16 }} />
                  </button>
                )}

                {onMarkImplemented && (
                  <button
                    onClick={() => onMarkImplemented(asset.id)}
                    disabled={isTransitioning}
                    style={{
                      flex: 1,
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '12px 20px',
                      borderRadius: 10,
                      border: 'none',
                      backgroundColor: isTransitioning ? '#86efac' : '#16a34a',
                      color: '#fff',
                      fontSize: 14,
                      fontWeight: 600,
                      cursor: isTransitioning ? 'not-allowed' : 'pointer',
                      opacity: isTransitioning ? 0.7 : 1,
                    }}
                  >
                    <Archive style={{ marginRight: 8, width: 16, height: 16 }} />
                    Mark Implemented
                    <ArrowRight style={{ marginLeft: 8, width: 16, height: 16 }} />
                  </button>
                )}
                </div>
              </div>
            )}
            </motion.div>
          </div>
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
