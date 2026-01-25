import { motion } from "motion/react";
import { Clock, User, X, Tag, Flag, UserCheck, Target } from "lucide-react";
import type { AssetWithCreator } from "../hooks/useAssets";
import { useGoalsForTask } from "@/features/goals";
import { useTheme } from "@/stores/themeStore";
import { ASSET_CATEGORIES, ASSET_PRIORITIES, GOAL_STATUSES } from "@/types/database";

interface AssetCardProps {
  asset: AssetWithCreator;
  index: number;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
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

export function AssetCard({
  asset,
  index,
  onClick,
  onDelete,
  isDeleting,
}: AssetCardProps) {
  const theme = useTheme();
  const creatorName =
    asset.creator?.display_name || asset.creator?.email || "Unknown";
  const category = asset.category ? ASSET_CATEGORIES[asset.category] : null;
  const priority = asset.priority ? ASSET_PRIORITIES[asset.priority] : null;
  const statusStyle = STATUS_STYLES[asset.status];
  const isClaimed = !!asset.claimed_by;
  const claimerName = asset.claimer?.display_name || asset.claimer?.email || null;

  // Get goals this task belongs to
  const { data: goals = [] } = useGoalsForTask(asset.id);
  const activeGoal = goals.find(g => g.status === "active" || g.status === "completed");

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{
        duration: 0.3,
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1],
      }}
      whileHover={{ scale: 1.02, y: -4 }}
      layout
      style={{ height: '100%' }}
    >
      <div
        onClick={onClick}
        style={{
          height: '100%',
          borderRadius: 12,
          border: isClaimed
            ? `2px solid ${theme.colors.claimed}80`
            : asset.status === 'blocked'
            ? '1px solid rgba(75, 0, 130, 0.25)'
            : `1px solid ${category ? `${category.color}30` : theme.colors.cardBorder}`,
          backgroundColor: isClaimed
            ? theme.colors.claimedBg
            : asset.status === 'blocked'
            ? 'rgba(75, 0, 130, 0.03)'
            : (category ? `${category.color}${theme.isDark ? '10' : '06'}` : theme.colors.card),
          padding: isClaimed ? 19 : 20,
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
          boxShadow: theme.isDark ? 'none' : '0 1px 3px rgba(0,0,0,0.06)',
          cursor: onClick ? 'pointer' : 'default',
          position: 'relative',
        }}
      >
        {/* Header with badges */}
        <div style={{
          marginBottom: 12,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12
        }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Badges row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, flexWrap: 'wrap' }}>
              {/* Status badge */}
              <span style={{
                borderRadius: 999,
                padding: '3px 8px',
                fontSize: 11,
                fontWeight: 500,
                backgroundColor: statusStyle.bg,
                color: statusStyle.color
              }}>
                {statusStyle.label}
              </span>

              {/* Category badge */}
              {category && (
                <span style={{
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: `${category.color}18`,
                  color: category.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <Tag style={{ width: 10, height: 10 }} />
                  {category.label}
                </span>
              )}

              {/* Priority badge */}
              {priority && (
                <span style={{
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: `${priority.color}18`,
                  color: priority.color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3,
                }}>
                  <Flag style={{ width: 10, height: 10 }} />
                  {priority.label}
                </span>
              )}

              {/* Claimed badge */}
              {isClaimed && claimerName && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  style={{
                    borderRadius: 999,
                    padding: '3px 8px',
                    fontSize: 11,
                    fontWeight: 600,
                    background: `linear-gradient(135deg, ${theme.colors.primary} 0%, ${theme.colors.accent} 100%)`,
                    color: theme.colors.textInverse,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    boxShadow: `0 2px 4px ${theme.colors.primary}50`,
                  }}
                >
                  <UserCheck style={{ width: 10, height: 10 }} />
                  {claimerName.split('@')[0]}
                </motion.span>
              )}

              {/* Goal badge */}
              {activeGoal && (
                <span style={{
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: `${GOAL_STATUSES[activeGoal.status].color}18`,
                  color: GOAL_STATUSES[activeGoal.status].color,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  maxWidth: 120,
                  overflow: 'hidden',
                }}>
                  <Target style={{ width: 10, height: 10, flexShrink: 0 }} />
                  <span style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {activeGoal.name}
                  </span>
                </span>
              )}
            </div>

            {/* Title */}
            <h3 style={{
              fontWeight: 600,
              fontSize: 17,
              color: theme.colors.text,
              lineHeight: 1.3,
              margin: 0,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              transition: 'color 0.3s ease'
            }}>
              {asset.name}
            </h3>
          </div>

          {/* Delete button */}
          {onDelete && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
              }}
              disabled={isDeleting}
              title="Delete asset"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 26,
                height: 26,
                borderRadius: 6,
                border: 'none',
                backgroundColor: 'transparent',
                color: theme.colors.textMuted,
                cursor: isDeleting ? 'not-allowed' : 'pointer',
                opacity: isDeleting ? 0.5 : 1,
                transition: 'all 0.15s ease',
                flexShrink: 0,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.errorBg;
                e.currentTarget.style.color = theme.colors.error;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textMuted;
              }}
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          )}
        </div>

        {/* Description preview */}
        {asset.blurb && (
          <p style={{
            marginBottom: 14,
            fontSize: 13,
            color: theme.colors.textMuted,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            marginTop: 0,
            lineHeight: 1.5,
            transition: 'color 0.3s ease'
          }}>
            {asset.blurb}
          </p>
        )}

        {/* Meta info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: theme.colors.textMuted,
          transition: 'color 0.3s ease'
        }}>
          <User style={{ width: 13, height: 13 }} />
          <span>{creatorName}</span>
          <span style={{ margin: '0 2px' }}>·</span>
          <Clock style={{ width: 13, height: 13 }} />
          <span>{formatDate(asset.created_at)}</span>
        </div>

        {/* Click hint */}
        {onClick && (
          <div style={{
            marginTop: 12,
            paddingTop: 12,
            borderTop: `1px solid ${theme.colors.borderLight}`,
            fontSize: 12,
            color: theme.colors.textMuted,
            textAlign: 'center',
            transition: 'all 0.3s ease'
          }}>
            Click to view details
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return "Today";
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }
}
