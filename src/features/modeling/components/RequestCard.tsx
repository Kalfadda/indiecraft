import { motion } from "motion/react";
import { Clock, User, X, Flag, MessageSquare } from "lucide-react";
import type { RequestWithCreator } from "../hooks/useRequests";
import { getDaysUntilHide } from "../hooks/useRequests";
import { ASSET_PRIORITIES, MODEL_REQUEST_STATUSES } from "@/types/database";
import { useTheme } from "@/stores/themeStore";

interface RequestCardProps {
  request: RequestWithCreator;
  index: number;
  onClick?: () => void;
  onDelete?: (id: string) => void;
  isDeleting?: boolean;
}

export function RequestCard({
  request,
  index,
  onClick,
  onDelete,
  isDeleting,
}: RequestCardProps) {
  const theme = useTheme();
  const creatorName =
    request.creator?.display_name || request.creator?.email || "Unknown";
  const priority = request.priority ? ASSET_PRIORITIES[request.priority] : null;
  const statusStyle = MODEL_REQUEST_STATUSES[request.status];
  const daysLeft = request.status === "denied" ? getDaysUntilHide(request.denied_at) : null;
  const isDenied = request.status === "denied";

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
          border: isDenied
            ? `1px solid ${theme.colors.error}4d`
            : `1px solid ${theme.colors.cardBorder}`,
          backgroundColor: isDenied
            ? `${theme.colors.error}0a`
            : theme.colors.card,
          padding: 20,
          transition: 'all 0.3s ease',
          boxSizing: 'border-box',
          boxShadow: theme.isDark
            ? '0 1px 3px rgba(0,0,0,0.3)'
            : '0 1px 3px rgba(0,0,0,0.06)',
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
                backgroundColor: `${statusStyle.color}18`,
                color: statusStyle.color
              }}>
                {statusStyle.label}
              </span>

              {/* Days until auto-hide badge for denied */}
              {daysLeft !== null && (
                <span style={{
                  borderRadius: 999,
                  padding: '3px 8px',
                  fontSize: 11,
                  fontWeight: 500,
                  backgroundColor: daysLeft <= 2 ? theme.colors.errorBg : `${theme.colors.textMuted}26`,
                  color: daysLeft <= 2 ? theme.colors.error : theme.colors.textMuted,
                  transition: 'all 0.3s ease',
                }}>
                  {daysLeft === 0 ? 'Hiding soon' : `${daysLeft}d left`}
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
              transition: 'all 0.3s ease',
            }}>
              {request.name}
            </h3>
          </div>

          {/* Delete button */}
          {onDelete && request.status === "open" && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(request.id);
              }}
              disabled={isDeleting}
              title="Delete request"
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
                transition: 'all 0.3s ease',
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
        {request.description && (
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
            transition: 'all 0.3s ease',
          }}>
            {request.description}
          </p>
        )}

        {/* Denial reason */}
        {isDenied && request.denial_reason && (
          <div style={{
            marginBottom: 14,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: theme.colors.errorBg,
            border: `1px solid ${theme.colors.error}26`,
            transition: 'all 0.3s ease',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              marginBottom: 4,
              fontSize: 11,
              fontWeight: 500,
              color: theme.colors.error,
              transition: 'all 0.3s ease',
            }}>
              <MessageSquare style={{ width: 12, height: 12 }} />
              Denial Reason
            </div>
            <p style={{
              fontSize: 13,
              color: theme.colors.textMuted,
              margin: 0,
              lineHeight: 1.4,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              transition: 'all 0.3s ease',
            }}>
              {request.denial_reason}
            </p>
          </div>
        )}

        {/* Meta info */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 12,
          color: theme.colors.textMuted,
          transition: 'all 0.3s ease',
        }}>
          <User style={{ width: 13, height: 13 }} />
          <span>{creatorName}</span>
          <span style={{ margin: '0 2px' }}>·</span>
          <Clock style={{ width: 13, height: 13 }} />
          <span>{formatDate(request.created_at)}</span>
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
            transition: 'all 0.3s ease',
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
