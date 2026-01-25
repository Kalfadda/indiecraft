import { forwardRef } from "react";
import { motion } from "motion/react";
import { Clock, User, CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react";
import type { PersistentNotification, PersistentNotificationVariant } from "@/types/database";

interface NotificationCardProps {
  notification: PersistentNotification;
  index: number;
}

const VARIANT_ICONS: Record<PersistentNotificationVariant, React.ReactNode> = {
  success: <CheckCircle2 style={{ width: 18, height: 18 }} />,
  info: <Info style={{ width: 18, height: 18 }} />,
  warning: <AlertTriangle style={{ width: 18, height: 18 }} />,
  error: <XCircle style={{ width: 18, height: 18 }} />,
};

const VARIANT_COLORS: Record<PersistentNotificationVariant, string> = {
  success: "#16a34a",
  info: "#3b82f6",
  warning: "#f59e0b",
  error: "#dc2626",
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSeconds < 60) {
    return "just now";
  } else if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else if (diffDays < 7) {
    return `${diffDays}d ago`;
  } else {
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }
}

export const NotificationCard = forwardRef<HTMLDivElement, NotificationCardProps>(
  ({ notification, index }, ref) => {
    const variantColor = VARIANT_COLORS[notification.variant];

    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, delay: index * 0.03 }}
        layout
      >
        <div
          style={{
            borderRadius: 10,
            border: "1px solid #e5e5eb",
            backgroundColor: "#ffffff",
            padding: 16,
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
          }}
        >
          {/* Icon */}
          <div style={{ color: variantColor, flexShrink: 0 }}>
            {VARIANT_ICONS[notification.variant]}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: "#1e1e2e" }}>
              {notification.title}
            </div>
            <p
              style={{
                fontSize: 13,
                color: "#6b7280",
                margin: "4px 0 0 0",
                lineHeight: 1.4,
              }}
            >
              {notification.message}
            </p>

            {/* Meta */}
            <div
              style={{
                marginTop: 8,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 12,
                color: "#9ca3af",
              }}
            >
              {notification.actor_name && (
                <>
                  <User style={{ width: 12, height: 12 }} />
                  <span>{notification.actor_name}</span>
                  <span style={{ opacity: 0.5 }}>·</span>
                </>
              )}
              <Clock style={{ width: 12, height: 12 }} />
              <span>{formatRelativeTime(notification.created_at)}</span>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }
);

NotificationCard.displayName = "NotificationCard";
