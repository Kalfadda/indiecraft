import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Target } from "lucide-react";
import { useGoalMutations } from "../hooks/useGoalMutations";
import { useTheme } from "@/stores/themeStore";
import { ASSET_PRIORITIES, type AssetPriority } from "@/types/database";

interface GoalFormProps {
  onClose: () => void;
}

export function GoalForm({ onClose }: GoalFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<AssetPriority | "">("");
  const [targetDate, setTargetDate] = useState("");
  const { createGoal } = useGoalMutations();
  const theme = useTheme();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    createGoal.mutate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        priority: priority || undefined,
        target_date: targetDate || undefined,
      },
      {
        onSuccess: () => {
          onClose();
        },
      }
    );
  };

  return (
    <AnimatePresence>
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
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          style={{
            width: '100%',
            maxWidth: 480,
            backgroundColor: theme.colors.card,
            borderRadius: 16,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
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
            alignItems: 'center',
            justifyContent: 'space-between',
            transition: 'all 0.3s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                backgroundColor: `${theme.colors.primary}15`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}>
                <Target style={{ width: 20, height: 20, color: theme.colors.primary }} />
              </div>
              <div>
                <h2 style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: theme.colors.text,
                  margin: 0,
                  transition: 'all 0.3s ease',
                }}>
                  New Goal
                </h2>
                <p style={{
                  fontSize: 13,
                  color: theme.colors.textMuted,
                  margin: 0,
                  transition: 'all 0.3s ease',
                }}>
                  Create a goal to organize related tasks
                </p>
              </div>
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
                transition: 'all 0.3s ease',
              }}
            >
              <X style={{ width: 20, height: 20 }} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Name */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.textMuted,
                  marginBottom: 8,
                  transition: 'all 0.3s ease',
                }}>
                  Goal Name *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Launch Beta v1.0"
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    borderRadius: 10,
                    border: `1px solid ${theme.colors.inputBorder}`,
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                  autoFocus
                />
              </div>

              {/* Description */}
              <div>
                <label style={{
                  display: 'block',
                  fontSize: 13,
                  fontWeight: 600,
                  color: theme.colors.textMuted,
                  marginBottom: 8,
                  transition: 'all 0.3s ease',
                }}>
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what this goal aims to achieve..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    fontSize: 14,
                    borderRadius: 10,
                    border: `1px solid ${theme.colors.inputBorder}`,
                    backgroundColor: theme.colors.inputBg,
                    color: theme.colors.text,
                    outline: 'none',
                    boxSizing: 'border-box',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'all 0.3s ease',
                  }}
                  onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                  onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                />
              </div>

              {/* Priority and Target Date in row */}
              <div style={{ display: 'flex', gap: 16 }}>
                {/* Priority */}
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textMuted,
                    marginBottom: 8,
                    transition: 'all 0.3s ease',
                  }}>
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as AssetPriority | "")}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.inputBg,
                      color: theme.colors.text,
                      outline: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <option value="">No priority</option>
                    {Object.entries(ASSET_PRIORITIES).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>

                {/* Target Date */}
                <div style={{ flex: 1 }}>
                  <label style={{
                    display: 'block',
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.colors.textMuted,
                    marginBottom: 8,
                    transition: 'all 0.3s ease',
                  }}>
                    Target Date
                  </label>
                  <input
                    type="date"
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 14,
                      borderRadius: 10,
                      border: `1px solid ${theme.colors.inputBorder}`,
                      backgroundColor: theme.colors.inputBg,
                      color: theme.colors.text,
                      outline: 'none',
                      boxSizing: 'border-box',
                      cursor: 'pointer',
                      transition: 'all 0.3s ease',
                    }}
                    onFocus={(e) => e.currentTarget.style.borderColor = theme.colors.primary}
                    onBlur={(e) => e.currentTarget.style.borderColor = theme.colors.inputBorder}
                  />
                </div>
              </div>

              {/* Info text */}
              <p style={{
                fontSize: 12,
                color: theme.colors.textMuted,
                margin: 0,
                lineHeight: 1.5,
                transition: 'all 0.3s ease',
              }}>
                Goals help you organize related tasks. Tasks without a goal appear in your Inbox.
              </p>
            </div>

            {/* Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: `1px solid ${theme.colors.border}`,
              backgroundColor: theme.colors.inputBg,
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 12,
              transition: 'all 0.3s ease',
            }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 500,
                  color: theme.colors.textMuted,
                  backgroundColor: theme.colors.card,
                  border: `1px solid ${theme.colors.border}`,
                  borderRadius: 10,
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={!name.trim() || createGoal.isPending}
                style={{
                  padding: '10px 20px',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#fff',
                  backgroundColor: name.trim() ? theme.colors.primary : theme.colors.border,
                  border: 'none',
                  borderRadius: 10,
                  cursor: name.trim() ? 'pointer' : 'not-allowed',
                  transition: 'all 0.3s ease',
                }}
              >
                {createGoal.isPending ? 'Creating...' : 'Create Goal'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
