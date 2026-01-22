import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion } from "motion/react";
import { Inbox, Target, ChevronRight, Clock, ArrowUpRight, PlayCircle, CheckCircle2, ShieldAlert, Tag, X } from "lucide-react";
import { useTheme } from "@/stores/themeStore";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { useGoals } from "../hooks/useGoals";
import { useGoalMutations } from "../hooks/useGoalMutations";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, type AssetCategory, type AssetStatus } from "@/types/database";

interface InboxViewProps {
  onNavigateToTask: (taskId: string) => void;
}

export function InboxView({ onNavigateToTask }: InboxViewProps) {
  const theme = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<AssetCategory | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<AssetStatus | null>(null);
  const [moveToGoalTaskId, setMoveToGoalTaskId] = useState<string | null>(null);
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null);
  const buttonRefs = useRef<Map<string, HTMLButtonElement>>(new Map());

  // Get all tasks and filter to inbox (no goal_id)
  const { data: allTasks = [] } = useAssets();
  const { data: activeGoals = [] } = useGoals({ status: "active" });
  const { addTaskToGoal } = useGoalMutations();

  // Filter to inbox tasks (no goal)
  let inboxTasks = allTasks.filter(t => !t.goal_id);

  // Apply category filter
  if (selectedCategory) {
    inboxTasks = inboxTasks.filter(t => t.category === selectedCategory);
  }

  // Apply status filter
  if (selectedStatus) {
    inboxTasks = inboxTasks.filter(t => t.status === selectedStatus);
  }

  const handleMoveToGoal = (taskId: string, goalId: string) => {
    addTaskToGoal.mutate({ goalId, assetId: taskId });
    setMoveToGoalTaskId(null);
    setDropdownPosition(null);
  };

  const handleOpenDropdown = (taskId: string) => {
    if (moveToGoalTaskId === taskId) {
      setMoveToGoalTaskId(null);
      setDropdownPosition(null);
      return;
    }

    const button = buttonRefs.current.get(taskId);
    if (button) {
      const rect = button.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        left: rect.right - 220, // Align right edge with button
      });
      setMoveToGoalTaskId(taskId);
    }
  };

  const handleCloseDropdown = () => {
    setMoveToGoalTaskId(null);
    setDropdownPosition(null);
  };

  const statusIcons: Record<AssetStatus, React.ReactNode> = {
    blocked: <ShieldAlert style={{ width: 14, height: 14 }} />,
    pending: <Clock style={{ width: 14, height: 14 }} />,
    in_progress: <PlayCircle style={{ width: 14, height: 14 }} />,
    completed: <CheckCircle2 style={{ width: 14, height: 14 }} />,
  };

  const statusColors: Record<AssetStatus, string> = {
    blocked: theme.colors.error,
    pending: theme.colors.textMuted,
    in_progress: theme.colors.info,
    completed: theme.colors.success,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: `${theme.colors.accent}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Inbox style={{ width: 20, height: 20, color: theme.colors.accent }} />
          </div>
          <div>
            <h2 style={{
              fontSize: 26,
              fontWeight: 700,
              color: theme.colors.text,
              margin: 0,
              transition: 'all 0.3s ease',
            }}>
              Inbox
            </h2>
            <p style={{
              fontSize: 14,
              color: theme.colors.textMuted,
              margin: 0,
              transition: 'all 0.3s ease',
            }}>
              {inboxTasks.length} tasks not assigned to any goal
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {/* Category Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: theme.colors.textMuted,
          }}>
            <Tag style={{ width: 14, height: 14 }} />
            Category:
          </div>
          <button
            onClick={() => setSelectedCategory(null)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: selectedCategory === null ? theme.colors.primary : theme.colors.pillBg,
              color: selectedCategory === null ? '#fff' : theme.colors.pillText,
            }}
          >
            All
          </button>
          {Object.entries(ASSET_CATEGORIES).map(([key, val]) => (
            <button
              key={key}
              onClick={() => setSelectedCategory(key as AssetCategory)}
              style={{
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: selectedCategory === key ? `${val.color}20` : theme.colors.pillBg,
                color: selectedCategory === key ? val.color : theme.colors.pillText,
              }}
            >
              {val.label}
            </button>
          ))}
          {selectedCategory && (
            <button
              onClick={() => setSelectedCategory(null)}
              title="Clear filter"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 24,
                height: 24,
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                backgroundColor: theme.colors.pillBg,
                color: theme.colors.pillText,
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            color: theme.colors.textMuted,
          }}>
            Status:
          </div>
          <button
            onClick={() => setSelectedStatus(null)}
            style={{
              padding: '6px 12px',
              borderRadius: 999,
              border: 'none',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 500,
              backgroundColor: selectedStatus === null ? theme.colors.primary : theme.colors.pillBg,
              color: selectedStatus === null ? '#fff' : theme.colors.pillText,
            }}
          >
            All
          </button>
          {(["blocked", "pending", "in_progress", "completed"] as AssetStatus[]).map((status) => (
            <button
              key={status}
              onClick={() => setSelectedStatus(status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 4,
                padding: '6px 12px',
                borderRadius: 999,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: 500,
                backgroundColor: selectedStatus === status ? `${statusColors[status]}20` : theme.colors.pillBg,
                color: selectedStatus === status ? statusColors[status] : theme.colors.pillText,
              }}
            >
              {statusIcons[status]}
              {status.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks List */}
      {inboxTasks.length === 0 ? (
        <div style={{
          padding: 48,
          textAlign: 'center',
          backgroundColor: theme.colors.card,
          borderRadius: 12,
          border: `1px dashed ${theme.colors.border}`,
        }}>
          <Inbox style={{ width: 48, height: 48, color: theme.colors.textMuted, opacity: 0.5, marginBottom: 16 }} />
          <p style={{ fontSize: 16, color: theme.colors.textMuted, margin: 0 }}>
            {selectedCategory || selectedStatus
              ? "No tasks match your filters."
              : "No tasks in inbox. All tasks are assigned to goals!"}
          </p>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
        }}>
          {inboxTasks.map((task) => {
            const category = task.category ? ASSET_CATEGORIES[task.category] : null;
            const priority = task.priority ? ASSET_PRIORITIES[task.priority] : null;

            return (
              <motion.div
                key={task.id}
                whileHover={{ scale: 1.002 }}
                style={{
                  backgroundColor: theme.colors.card,
                  borderRadius: 12,
                  border: `1px solid ${theme.colors.cardBorder}`,
                  padding: 16,
                  transition: 'all 0.3s ease',
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.boxShadow = theme.isDark
                    ? '0 2px 8px rgba(0, 0, 0, 0.2)'
                    : '0 2px 8px rgba(0, 0, 0, 0.05)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}>
                  <div
                    style={{ flex: 1, cursor: 'pointer' }}
                    onClick={() => onNavigateToTask(task.id)}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: statusColors[task.status],
                        fontSize: 12,
                      }}>
                        {statusIcons[task.status]}
                      </div>
                      <h4 style={{
                        fontSize: 15,
                        fontWeight: 600,
                        color: theme.colors.text,
                        margin: 0,
                      }}>
                        {task.name}
                      </h4>
                      {category && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 500,
                          backgroundColor: `${category.color}20`,
                          color: category.color,
                        }}>
                          {category.label}
                        </span>
                      )}
                      {priority && (
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 500,
                          backgroundColor: `${priority.color}20`,
                          color: priority.color,
                        }}>
                          {priority.label}
                        </span>
                      )}
                    </div>
                    {task.blurb && (
                      <p style={{
                        fontSize: 13,
                        color: theme.colors.textMuted,
                        margin: 0,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        maxWidth: 500,
                      }}>
                        {task.blurb}
                      </p>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Move to Goal button */}
                    <button
                      ref={(el) => {
                        if (el) buttonRefs.current.set(task.id, el);
                        else buttonRefs.current.delete(task.id);
                      }}
                      onClick={() => handleOpenDropdown(task.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '8px 12px',
                        fontSize: 12,
                        fontWeight: 500,
                        color: theme.colors.primary,
                        backgroundColor: `${theme.colors.primary}10`,
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                      }}
                    >
                      <Target style={{ width: 14, height: 14 }} />
                      Move to Goal
                    </button>

                    {/* View Task button */}
                    <button
                      onClick={() => onNavigateToTask(task.id)}
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
                      }}
                    >
                      <ArrowUpRight style={{ width: 18, height: 18 }} />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Goal Selector Dropdown - rendered via portal */}
      {moveToGoalTaskId && dropdownPosition && createPortal(
        <>
          {/* Backdrop to close dropdown on click outside */}
          <div
            onClick={handleCloseDropdown}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 9998,
            }}
          />
          <div style={{
            position: 'fixed',
            top: dropdownPosition.top,
            left: dropdownPosition.left,
            minWidth: 220,
            backgroundColor: theme.colors.card,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: 10,
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
            zIndex: 9999,
            overflow: 'hidden',
          }}>
            <div style={{
              padding: '12px 14px',
              borderBottom: `1px solid ${theme.colors.border}`,
              fontSize: 12,
              fontWeight: 600,
              color: theme.colors.textMuted,
            }}>
              Select a goal
            </div>
            {activeGoals.length === 0 ? (
              <div style={{
                padding: '16px 14px',
                fontSize: 13,
                color: theme.colors.textMuted,
                textAlign: 'center',
              }}>
                No active goals. Create one first.
              </div>
            ) : (
              <div style={{ maxHeight: 200, overflow: 'auto' }}>
                {activeGoals.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => handleMoveToGoal(moveToGoalTaskId, goal.id)}
                    style={{
                      width: '100%',
                      padding: '12px 14px',
                      fontSize: 13,
                      textAlign: 'left',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: `1px solid ${theme.colors.border}`,
                      cursor: 'pointer',
                      color: theme.colors.text,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.backgroundColor = theme.colors.inputBg;
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <Target style={{ width: 14, height: 14, color: theme.colors.primary }} />
                    {goal.name}
                  </button>
                ))}
              </div>
            )}
            <button
              onClick={handleCloseDropdown}
              style={{
                width: '100%',
                padding: '10px 14px',
                fontSize: 12,
                textAlign: 'center',
                backgroundColor: theme.colors.inputBg,
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.textMuted,
              }}
            >
              Cancel
            </button>
          </div>
        </>,
        document.body
      )}
    </div>
  );
}
