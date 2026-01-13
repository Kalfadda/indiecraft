import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, User, Clock, CheckCircle2, Tag, Flag, ArrowLeft, ArrowRight, Archive, Edit2, ChevronDown } from "lucide-react";
import type { AssetWithCreator } from "../hooks/useAssets";
import { getDaysUntilDelete } from "../hooks/useAssets";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, type AssetCategory, type AssetPriority } from "@/types/database";

interface AssetDetailModalProps {
  asset: AssetWithCreator | null;
  isOpen: boolean;
  onClose: () => void;
  onMarkCompleted?: (id: string) => void;
  onMarkImplemented?: (id: string) => void;
  onMoveToPending?: (id: string) => void;
  onMoveToCompleted?: (id: string) => void;
  onUpdate?: (id: string, data: { name: string; blurb: string; category: AssetCategory | null; priority: AssetPriority | null }) => void;
  isTransitioning?: boolean;
}

const STATUS_STYLES = {
  pending: {
    bg: 'rgba(202, 138, 4, 0.15)',
    color: '#b45309',
    label: 'Pending'
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
  onMarkCompleted,
  onMarkImplemented,
  onMoveToPending,
  onMoveToCompleted,
  onUpdate,
  isTransitioning,
}: AssetDetailModalProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBlurb, setEditBlurb] = useState("");
  const [editCategory, setEditCategory] = useState<AssetCategory | "">("");
  const [editPriority, setEditPriority] = useState<AssetPriority | "">("");

  // Reset edit state when asset changes or modal closes
  useEffect(() => {
    if (asset) {
      setEditName(asset.name);
      setEditBlurb(asset.blurb || "");
      setEditCategory(asset.category || "");
      setEditPriority(asset.priority || "");
    }
    setIsEditing(false);
  }, [asset, isOpen]);

  if (!asset) return null;

  const creatorName = asset.creator?.display_name || asset.creator?.email || "Unknown";
  const category = asset.category ? ASSET_CATEGORIES[asset.category] : null;
  const priority = asset.priority ? ASSET_PRIORITIES[asset.priority] : null;
  const statusStyle = STATUS_STYLES[asset.status];
  const daysLeft = asset.status === "implemented" ? getDaysUntilDelete(asset.implemented_at) : null;

  const handleSave = () => {
    if (onUpdate && editName.trim()) {
      onUpdate(asset.id, {
        name: editName.trim(),
        blurb: editBlurb.trim(),
        category: editCategory || null,
        priority: editPriority || null,
      });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditName(asset.name);
    setEditBlurb(asset.blurb || "");
    setEditCategory(asset.category || "");
    setEditPriority(asset.priority || "");
    setIsEditing(false);
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
                    onChange={(e) => setEditBlurb(e.target.value)}
                    style={{
                      width: '100%',
                      minHeight: 120,
                      padding: 16,
                      fontSize: 14,
                      color: '#4b5563',
                      lineHeight: 1.6,
                      borderRadius: 10,
                      border: '1px solid #e5e5eb',
                      backgroundColor: '#f9fafb',
                      resize: 'vertical',
                      outline: 'none',
                      fontFamily: 'inherit',
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

              {/* Category & Priority (edit mode only) */}
              {isEditing && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 24 }}>
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
            ) : (onMarkCompleted || onMarkImplemented || onMoveToPending || onMoveToCompleted) && (
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid #e5e5eb',
                backgroundColor: '#fafafa',
                display: 'flex',
                gap: 12,
              }}>
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
