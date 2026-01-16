import { Flag, Package, Tag, Edit2, Trash2, Eye, EyeOff, Link } from "lucide-react";
import { motion } from "motion/react";
import { Countdown } from "./Countdown";
import { EVENT_TYPES, type Event, type EventType } from "@/types/database";
import { useNavigationStore } from "@/stores/navigationStore";

interface EventCardProps {
  event: Event;
  linkedAssetName?: string | null;
  onEdit: (event: Event) => void;
  onDelete: (eventId: string) => void;
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  milestone: <Flag style={{ width: 14, height: 14 }} />,
  deliverable: <Package style={{ width: 14, height: 14 }} />,
  label: <Tag style={{ width: 14, height: 14 }} />,
};

function formatDate(dateString: string, timeString: string | null): string {
  const date = new Date(dateString + "T00:00:00");
  const options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
  };

  let formatted = date.toLocaleDateString("en-US", options);

  if (timeString) {
    // Parse time string (HH:mm or HH:mm:ss format)
    const [hours, minutes] = timeString.split(":").map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes);
    const timeFormatted = timeDate.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
    formatted += ` at ${timeFormatted}`;
  }

  return formatted;
}

function getEventDateTime(dateString: string, timeString: string | null): Date {
  if (timeString) {
    return new Date(`${dateString}T${timeString}`);
  }
  // If no time, set to end of day
  return new Date(`${dateString}T23:59:59`);
}

export function EventCard({ event, linkedAssetName, onEdit, onDelete }: EventCardProps) {
  const eventMeta = EVENT_TYPES[event.type];
  const isLabel = event.type === "label";
  const setPendingTaskId = useNavigationStore((state) => state.setPendingTaskId);

  const handleAssetClick = () => {
    if (event.linked_asset_id) {
      setPendingTaskId(event.linked_asset_id);
    }
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e5eb",
    padding: isLabel ? "12px 16px" : "16px 20px",
    transition: "all 0.2s ease",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
    overflow: "hidden",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
    marginBottom: event.description || !isLabel ? 8 : 0,
  };

  const badgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    padding: "4px 10px",
    borderRadius: 6,
    backgroundColor: `${eventMeta.color}15`,
    color: eventMeta.color,
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: "nowrap",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: isLabel ? 14 : 16,
    fontWeight: 600,
    color: "#1e1e2e",
    margin: 0,
    lineHeight: 1.4,
  };

  const descriptionStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#6b7280",
    margin: "8px 0 0 0",
    lineHeight: 1.5,
    wordBreak: "break-word",
    overflowWrap: "break-word",
  };

  const metaRowStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 12,
  };

  const dateStyle: React.CSSProperties = {
    fontSize: 13,
    color: "#4b5563",
    fontWeight: 500,
  };

  const visibilityBadgeStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 4,
    backgroundColor: event.visibility === "external" ? "rgba(16, 185, 129, 0.1)" : "rgba(107, 114, 128, 0.1)",
    color: event.visibility === "external" ? "#10b981" : "#6b7280",
    fontSize: 11,
    fontWeight: 500,
  };

  const assetLinkStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 4,
    padding: "3px 8px",
    borderRadius: 4,
    backgroundColor: "rgba(59, 130, 246, 0.1)",
    color: "#3b82f6",
    fontSize: 11,
    fontWeight: 500,
  };

  const actionsStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
  };

  const iconButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
    borderRadius: 6,
    border: "none",
    backgroundColor: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      style={cardStyle}
      onMouseOver={(e) => {
        e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.08)";
        e.currentTarget.style.borderColor = "#d1d5db";
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.05)";
        e.currentTarget.style.borderColor = "#e5e5eb";
      }}
    >
      <div style={headerStyle}>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
            <span style={badgeStyle}>
              {EVENT_ICONS[event.type]}
              {eventMeta.label}
            </span>
            {event.visibility && !isLabel && (
              <span style={visibilityBadgeStyle}>
                {event.visibility === "external" ? (
                  <Eye style={{ width: 12, height: 12 }} />
                ) : (
                  <EyeOff style={{ width: 12, height: 12 }} />
                )}
                {event.visibility === "external" ? "External" : "Internal"}
              </span>
            )}
          </div>
          <h4 style={titleStyle}>{event.title}</h4>
        </div>

        <div style={actionsStyle}>
          <button
            onClick={() => onEdit(event)}
            style={iconButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(124, 58, 237, 0.1)";
              e.currentTarget.style.color = "#7c3aed";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#9ca3af";
            }}
            title="Edit event"
          >
            <Edit2 style={{ width: 14, height: 14 }} />
          </button>
          <button
            onClick={() => onDelete(event.id)}
            style={iconButtonStyle}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(239, 68, 68, 0.1)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "transparent";
              e.currentTarget.style.color = "#9ca3af";
            }}
            title="Delete event"
          >
            <Trash2 style={{ width: 14, height: 14 }} />
          </button>
        </div>
      </div>

      {event.description && (
        <p style={descriptionStyle}>{event.description}</p>
      )}

      <div style={metaRowStyle}>
        <span style={dateStyle}>
          {formatDate(event.event_date, event.event_time)}
        </span>

        {event.type === "milestone" && (
          <Countdown targetDate={getEventDateTime(event.event_date, event.event_time)} />
        )}

        {event.type === "deliverable" && linkedAssetName && event.linked_asset_id && (
          <button
            onClick={handleAssetClick}
            style={{
              ...assetLinkStyle,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.2)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "rgba(59, 130, 246, 0.1)";
            }}
          >
            <Link style={{ width: 12, height: 12 }} />
            {linkedAssetName}
          </button>
        )}
      </div>
    </motion.div>
  );
}
