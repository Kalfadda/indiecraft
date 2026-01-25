import { motion } from "motion/react";
import { X, CheckCircle2, Info, AlertTriangle, XCircle, User } from "lucide-react";
import type { Notification, NotificationVariant } from "@/stores/notificationStore";

interface NotificationToastProps {
  notification: Notification;
  onDismiss: () => void;
}

const VARIANT_STYLES: Record<
  NotificationVariant,
  {
    bg: string;
    border: string;
    icon: React.ReactNode;
    iconColor: string;
  }
> = {
  success: {
    bg: "rgba(22, 163, 74, 0.08)",
    border: "rgba(22, 163, 74, 0.3)",
    icon: <CheckCircle2 style={{ width: 20, height: 20 }} />,
    iconColor: "#16a34a",
  },
  info: {
    bg: "rgba(59, 130, 246, 0.08)",
    border: "rgba(59, 130, 246, 0.3)",
    icon: <Info style={{ width: 20, height: 20 }} />,
    iconColor: "#3b82f6",
  },
  warning: {
    bg: "rgba(245, 158, 11, 0.08)",
    border: "rgba(245, 158, 11, 0.3)",
    icon: <AlertTriangle style={{ width: 20, height: 20 }} />,
    iconColor: "#f59e0b",
  },
  error: {
    bg: "rgba(220, 38, 38, 0.08)",
    border: "rgba(220, 38, 38, 0.3)",
    icon: <XCircle style={{ width: 20, height: 20 }} />,
    iconColor: "#dc2626",
  },
};

export function NotificationToast({
  notification,
  onDismiss,
}: NotificationToastProps) {
  const variantStyle = VARIANT_STYLES[notification.variant];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{
        type: "spring",
        stiffness: 500,
        damping: 40,
        mass: 1,
      }}
      style={{
        pointerEvents: "auto",
        backgroundColor: "#1e1e2e",
        borderRadius: 12,
        border: `1px solid ${variantStyle.border}`,
        boxShadow:
          "0 10px 40px rgba(0, 0, 0, 0.3), 0 4px 12px rgba(0, 0, 0, 0.2)",
        padding: 16,
        minWidth: 320,
        maxWidth: 400,
        display: "flex",
        gap: 12,
        alignItems: "flex-start",
        backdropFilter: "blur(8px)",
      }}
    >
      {/* Icon */}
      <div style={{ color: variantStyle.iconColor, flexShrink: 0 }}>
        {variantStyle.icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: "#fff",
            marginBottom: 4,
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {notification.title}
          {!notification.isOwnAction && notification.actorName && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 500,
                padding: "2px 6px",
                borderRadius: 4,
                backgroundColor: "rgba(124, 58, 237, 0.2)",
                color: "#a78bfa",
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              <User style={{ width: 10, height: 10 }} />
              {notification.actorName.split("@")[0]}
            </span>
          )}
        </div>
        <p
          style={{
            fontSize: 13,
            color: "#9ca3af",
            margin: 0,
            lineHeight: 1.4,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {notification.message}
        </p>

        {/* Progress bar for auto-dismiss */}
        <motion.div
          initial={{ scaleX: 1 }}
          animate={{ scaleX: 0 }}
          transition={{
            duration: notification.duration / 1000,
            ease: "linear",
          }}
          style={{
            marginTop: 10,
            height: 2,
            backgroundColor: variantStyle.iconColor,
            borderRadius: 1,
            transformOrigin: "left",
            opacity: 0.5,
          }}
        />
      </div>

      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 24,
          height: 24,
          borderRadius: 6,
          border: "none",
          backgroundColor: "transparent",
          color: "#6b7280",
          cursor: "pointer",
          flexShrink: 0,
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
          e.currentTarget.style.color = "#fff";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#6b7280";
        }}
      >
        <X style={{ width: 14, height: 14 }} />
      </button>
    </motion.div>
  );
}
