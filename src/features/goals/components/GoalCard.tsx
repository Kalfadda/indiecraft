import { motion } from "motion/react";
import { Target, CheckCircle2, Clock, ChevronRight, Calendar } from "lucide-react";
import type { GoalWithCreator } from "../hooks/useGoals";
import { GOAL_STATUSES, ASSET_PRIORITIES } from "@/types/database";
import { useTheme } from "@/stores/themeStore";

interface GoalCardProps {
  goal: GoalWithCreator;
  taskCount?: number;
  completedCount?: number;
  onClick: () => void;
}

export function GoalCard({ goal, taskCount = 0, completedCount = 0, onClick }: GoalCardProps) {
  const theme = useTheme();
  const status = GOAL_STATUSES[goal.status];
  const progress = taskCount > 0 ? Math.round((completedCount / taskCount) * 100) : 0;
  const creatorName = goal.creator?.display_name || goal.creator?.email?.split('@')[0] || "Unknown";
  const priority = goal.priority ? ASSET_PRIORITIES[goal.priority as keyof typeof ASSET_PRIORITIES] : null;

  return (
    <motion.div
      whileHover={{ scale: 1.01, y: -2 }}
      whileTap={{ scale: 0.99 }}
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
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: `${status.color}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Target style={{ width: 18, height: 18, color: status.color }} />
          </div>
          <div>
            <h3 style={{
              fontSize: 16,
              fontWeight: 600,
              color: theme.colors.text,
              margin: 0,
              lineHeight: 1.3,
              transition: 'all 0.3s ease',
            }}>
              {goal.name}
            </h3>
            <span style={{
              fontSize: 12,
              color: theme.colors.textMuted,
              transition: 'all 0.3s ease',
            }}>
              by {creatorName}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {priority && (
            <span style={{
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              backgroundColor: `${priority.color}15`,
              color: priority.color,
            }}>
              {priority.label}
            </span>
          )}
          <span style={{
            padding: '4px 10px',
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 600,
            backgroundColor: `${status.color}15`,
            color: status.color,
          }}>
            {status.label}
          </span>
        </div>
      </div>

      {/* Description */}
      {goal.description && (
        <p style={{
          fontSize: 13,
          color: theme.colors.textMuted,
          margin: '0 0 16px 0',
          lineHeight: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          transition: 'all 0.3s ease',
        }}>
          {goal.description}
        </p>
      )}

      {/* Progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, color: theme.colors.textMuted, fontWeight: 500, transition: 'all 0.3s ease' }}>
            Progress
          </span>
          <span style={{ fontSize: 12, color: theme.colors.text, fontWeight: 600, transition: 'all 0.3s ease' }}>
            {progress}%
          </span>
        </div>
        <div style={{
          height: 6,
          backgroundColor: theme.colors.backgroundSecondary,
          borderRadius: 999,
          overflow: 'hidden',
          transition: 'all 0.3s ease',
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
      </div>

      {/* Footer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
            <CheckCircle2 style={{ width: 14, height: 14 }} />
            <span style={{ fontSize: 12 }}>
              {completedCount}/{taskCount} completed
            </span>
          </div>
          {goal.target_date ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
              <Calendar style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12 }}>
                {formatDate(goal.target_date)}
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: theme.colors.textMuted, transition: 'all 0.3s ease' }}>
              <Clock style={{ width: 14, height: 14 }} />
              <span style={{ fontSize: 12 }}>
                {formatDate(goal.created_at)}
              </span>
            </div>
          )}
        </div>
        <ChevronRight style={{ width: 16, height: 16, color: theme.colors.textMuted }} />
      </div>
    </motion.div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
