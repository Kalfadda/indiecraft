import { useState } from "react";
import { motion } from "motion/react";
import { Target, Inbox, Plus, ChevronRight, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useTheme } from "@/stores/themeStore";
import { useGoals, useGoal, useInboxCount } from "../hooks/useGoals";
import { useAssets } from "@/features/assets/hooks/useAssets";
import { GoalForm } from "./GoalForm";
import { GoalDetailModal } from "./GoalDetailModal";
import { ASSET_CATEGORIES, type Goal } from "@/types/database";

interface GoalsDashboardProps {
  onNavigateToInbox: () => void;
  onNavigateToTask: (taskId: string) => void;
}

export function GoalsDashboard({ onNavigateToInbox, onNavigateToTask }: GoalsDashboardProps) {
  const theme = useTheme();
  const [showForm, setShowForm] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  // Get active goals
  const { data: activeGoals = [], isLoading: loadingGoals } = useGoals({ status: "active" });
  const { data: selectedGoal } = useGoal(selectedGoalId || undefined);

  // Get inbox count and tasks
  const { data: inboxCount = 0 } = useInboxCount();
  const { data: allTasks = [] } = useAssets();
  const inboxTasks = allTasks.filter(t => !t.goal_id).slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: 24,
        flexWrap: 'wrap',
      }}>
        <div>
          <h2 style={{
            fontSize: 28,
            fontWeight: 700,
            color: theme.colors.text,
            margin: 0,
            marginBottom: 6,
            transition: 'all 0.3s ease',
          }}>
            Goals
          </h2>
          <p style={{
            fontSize: 14,
            color: theme.colors.textMuted,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Track progress on what matters most
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '10px 18px',
            fontSize: 14,
            fontWeight: 600,
            color: '#fff',
            backgroundColor: theme.colors.primary,
            border: 'none',
            borderRadius: 10,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primaryHover;
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.primary;
          }}
        >
          <Plus style={{ width: 16, height: 16 }} />
          New Goal
        </button>
      </div>

      {/* Active Goals Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 16,
        }}>
          <Target style={{ width: 18, height: 18, color: theme.colors.primary }} />
          <h3 style={{
            fontSize: 16,
            fontWeight: 600,
            color: theme.colors.text,
            margin: 0,
            transition: 'all 0.3s ease',
          }}>
            Active Goals
          </h3>
          {activeGoals.length > 0 && (
            <span style={{
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: `${theme.colors.primary}15`,
              color: theme.colors.primary,
            }}>
              {activeGoals.length}
            </span>
          )}
        </div>

        {loadingGoals ? (
          <div style={{
            padding: 32,
            textAlign: 'center',
            color: theme.colors.textMuted,
          }}>
            Loading goals...
          </div>
        ) : activeGoals.length === 0 ? (
          <div style={{
            padding: 40,
            textAlign: 'center',
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            border: `1px dashed ${theme.colors.border}`,
          }}>
            <Target style={{ width: 48, height: 48, color: theme.colors.textMuted, opacity: 0.5, marginBottom: 16 }} />
            <p style={{ fontSize: 15, color: theme.colors.textMuted, margin: 0, marginBottom: 16 }}>
              No active goals yet. Create your first goal to start organizing tasks.
            </p>
            <button
              onClick={() => setShowForm(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 20px',
                fontSize: 14,
                fontWeight: 600,
                color: theme.colors.primary,
                backgroundColor: `${theme.colors.primary}15`,
                border: 'none',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <Plus style={{ width: 16, height: 16 }} />
              Create Goal
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeGoals.map((goal) => (
              <GoalProgressCard
                key={goal.id}
                goal={goal}
                onClick={() => setSelectedGoalId(goal.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Inbox Section */}
      <div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 16,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Inbox style={{ width: 18, height: 18, color: theme.colors.accent }} />
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.colors.text,
              margin: 0,
              transition: 'all 0.3s ease',
            }}>
              Inbox
            </h3>
            {inboxCount > 0 && (
              <span style={{
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                backgroundColor: `${theme.colors.accent}15`,
                color: theme.colors.accent,
              }}>
                {inboxCount}
              </span>
            )}
          </div>
          {inboxCount > 0 && (
            <button
              onClick={onNavigateToInbox}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '6px 12px',
                fontSize: 13,
                fontWeight: 500,
                color: theme.colors.primary,
                backgroundColor: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              View all
              <ArrowRight style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>

        {inboxTasks.length === 0 ? (
          <div style={{
            padding: 24,
            textAlign: 'center',
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            border: `1px dashed ${theme.colors.border}`,
          }}>
            <Inbox style={{ width: 32, height: 32, color: theme.colors.textMuted, opacity: 0.5, marginBottom: 12 }} />
            <p style={{ fontSize: 14, color: theme.colors.textMuted, margin: 0 }}>
              No tasks in inbox. Tasks without a goal will appear here.
            </p>
          </div>
        ) : (
          <div style={{
            backgroundColor: theme.colors.card,
            borderRadius: 12,
            border: `1px solid ${theme.colors.cardBorder}`,
            overflow: 'hidden',
          }}>
            {inboxTasks.map((task, index) => {
              const category = task.category ? ASSET_CATEGORIES[task.category] : null;
              return (
                <motion.div
                  key={task.id}
                  whileHover={{ backgroundColor: theme.colors.inputBg }}
                  onClick={() => onNavigateToTask(task.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderBottom: index < inboxTasks.length - 1 ? `1px solid ${theme.colors.border}` : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: task.status === 'in_progress' ? theme.colors.info :
                        task.status === 'completed' ? theme.colors.success : theme.colors.textMuted,
                    }} />
                    <span style={{
                      fontSize: 14,
                      fontWeight: 500,
                      color: theme.colors.text,
                    }}>
                      {task.name}
                    </span>
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
                  </div>
                  <ChevronRight style={{ width: 16, height: 16, color: theme.colors.textMuted }} />
                </motion.div>
              );
            })}
            {inboxCount > 5 && (
              <button
                onClick={onNavigateToInbox}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.colors.primary,
                  backgroundColor: theme.colors.inputBg,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                View {inboxCount - 5} more tasks
                <ArrowRight style={{ width: 14, height: 14 }} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Goal Detail Modal */}
      <GoalDetailModal
        goal={selectedGoal || null}
        isOpen={!!selectedGoalId}
        onClose={() => setSelectedGoalId(null)}
      />

      {/* Create Goal Form Modal */}
      {showForm && (
        <GoalForm onClose={() => setShowForm(false)} />
      )}
    </div>
  );
}

// Progress card for goals
function GoalProgressCard({
  goal,
  onClick,
}: {
  goal: Goal & { creator: { display_name: string | null; email: string } | null };
  onClick: () => void;
}) {
  const theme = useTheme();
  const { data: details } = useGoal(goal.id);

  const taskCount = details?.task_count || 0;
  const completedCount = details?.completed_task_count || 0;
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;

  return (
    <motion.div
      whileHover={{ scale: 1.005, y: -1 }}
      whileTap={{ scale: 0.995 }}
      onClick={onClick}
      style={{
        backgroundColor: theme.colors.card,
        borderRadius: 12,
        border: `1px solid ${theme.colors.cardBorder}`,
        padding: 20,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = theme.isDark
          ? '0 4px 12px rgba(0, 0, 0, 0.3)'
          : '0 4px 12px rgba(0, 0, 0, 0.08)';
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: progress === 100 ? `${theme.colors.success}15` : `${theme.colors.primary}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {progress === 100 ? (
              <CheckCircle2 style={{ width: 20, height: 20, color: theme.colors.success }} />
            ) : (
              <Target style={{ width: 20, height: 20, color: theme.colors.primary }} />
            )}
          </div>
          <div>
            <h4 style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.colors.text,
              margin: 0,
              marginBottom: 2,
            }}>
              {goal.name}
            </h4>
            <span style={{
              fontSize: 12,
              color: theme.colors.textMuted,
            }}>
              {taskCount} tasks · {completedCount} completed
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{
            fontSize: 20,
            fontWeight: 700,
            color: progress === 100 ? theme.colors.success : theme.colors.primary,
          }}>
            {progress}%
          </span>
          <ChevronRight style={{ width: 20, height: 20, color: theme.colors.textMuted }} />
        </div>
      </div>

      {/* Progress bar */}
      <div style={{
        height: 8,
        backgroundColor: theme.colors.backgroundSecondary,
        borderRadius: 999,
        overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            height: '100%',
            backgroundColor: progress === 100 ? theme.colors.success : theme.colors.primary,
            borderRadius: 999,
          }}
        />
      </div>

      {/* Target date if set */}
      {goal.target_date && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          marginTop: 12,
          color: theme.colors.textMuted,
          fontSize: 12,
        }}>
          <Clock style={{ width: 12, height: 12 }} />
          Target: {new Date(goal.target_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
        </div>
      )}
    </motion.div>
  );
}
