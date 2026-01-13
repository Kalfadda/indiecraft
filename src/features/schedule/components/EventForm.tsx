import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Flag, Package, Tag, ChevronDown, Check, Loader2 } from "lucide-react";
import { useAssets } from "@/features/assets/hooks/useAssets";
import {
  EVENT_TYPES,
  type Event,
  type EventInsert,
  type EventType,
  type EventVisibility,
} from "@/types/database";

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventInsert) => void;
  initialDate?: Date;
  editingEvent?: Event | null;
  isLoading?: boolean;
}

const EVENT_ICONS: Record<EventType, React.ReactNode> = {
  milestone: <Flag style={{ width: 16, height: 16 }} />,
  deliverable: <Package style={{ width: 16, height: 16 }} />,
  label: <Tag style={{ width: 16, height: 16 }} />,
};

function formatDateForInput(date: Date): string {
  return date.toISOString().split("T")[0];
}

export function EventForm({
  isOpen,
  onClose,
  onSave,
  initialDate,
  editingEvent,
  isLoading = false,
}: EventFormProps) {
  const { data: assets } = useAssets();

  // Form state
  const [eventType, setEventType] = useState<EventType>("milestone");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState(formatDateForInput(new Date()));
  const [eventTime, setEventTime] = useState("");
  const [visibility, setVisibility] = useState<EventVisibility>("internal");
  const [linkedAssetId, setLinkedAssetId] = useState("");
  const [autoCreateTask, setAutoCreateTask] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Reset form when opening/closing or when editing event changes
  useEffect(() => {
    if (isOpen) {
      if (editingEvent) {
        setEventType(editingEvent.type);
        setTitle(editingEvent.title);
        setDescription(editingEvent.description || "");
        setEventDate(editingEvent.event_date);
        setEventTime(editingEvent.event_time || "");
        setVisibility(editingEvent.visibility || "internal");
        setLinkedAssetId(editingEvent.linked_asset_id || "");
        setAutoCreateTask(editingEvent.auto_create_task || false);
      } else {
        setEventType("milestone");
        setTitle("");
        setDescription("");
        setEventDate(initialDate ? formatDateForInput(initialDate) : formatDateForInput(new Date()));
        setEventTime("");
        setVisibility("internal");
        setLinkedAssetId("");
        setAutoCreateTask(false);
      }
      setShowSuccess(false);
    }
  }, [isOpen, editingEvent, initialDate]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const eventData: EventInsert = {
      type: eventType,
      title: title.trim(),
      description: description.trim() || null,
      event_date: eventDate,
      event_time: eventType !== "label" && eventTime ? eventTime : null,
      visibility: eventType !== "label" ? visibility : null,
      linked_asset_id: eventType === "deliverable" && linkedAssetId ? linkedAssetId : null,
      auto_create_task: eventType === "deliverable" ? autoCreateTask : false,
    };

    onSave(eventData);

    if (!editingEvent) {
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        onClose();
      }, 1200);
    }
  }

  function handleClose() {
    setShowSuccess(false);
    onClose();
  }

  // Show time and visibility for milestone and deliverable only
  const showTimeAndVisibility = eventType !== "label";
  const showAssetLink = eventType === "deliverable";
  const showAutoCreateTask = eventType === "deliverable";

  // Styles
  const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    padding: 20,
  };

  const modalStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: 16,
    width: "100%",
    maxWidth: 480,
    maxHeight: "90vh",
    overflow: "hidden",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "20px 24px",
    borderBottom: "1px solid #e5e5eb",
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: "#1e1e2e",
    margin: 0,
  };

  const closeButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 32,
    height: 32,
    borderRadius: 8,
    border: "none",
    backgroundColor: "transparent",
    color: "#9ca3af",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  const contentStyle: React.CSSProperties = {
    padding: "24px",
    overflowY: "auto",
    maxHeight: "calc(90vh - 140px)",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: 13,
    fontWeight: 500,
    color: "#4b5563",
    marginBottom: 8,
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 8,
    border: "1px solid #e5e5eb",
    backgroundColor: "#f9fafb",
    color: "#1e1e2e",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s ease",
  };

  const textareaStyle: React.CSSProperties = {
    ...inputStyle,
    resize: "vertical",
    minHeight: 80,
    fontFamily: "inherit",
  };

  const selectWrapperStyle: React.CSSProperties = {
    position: "relative",
  };

  const selectStyle: React.CSSProperties = {
    ...inputStyle,
    appearance: "none",
    paddingRight: 36,
    cursor: "pointer",
  };

  const selectIconStyle: React.CSSProperties = {
    position: "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    color: "#9ca3af",
    pointerEvents: "none",
  };

  const rowStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    marginBottom: 20,
  };

  const fieldStyle: React.CSSProperties = {
    flex: 1,
    marginBottom: 20,
  };

  const checkboxWrapperStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 10,
    padding: "12px 14px",
    borderRadius: 8,
    border: "1px solid #e5e5eb",
    backgroundColor: "#f9fafb",
    cursor: "pointer",
    transition: "all 0.15s ease",
  };

  const checkboxStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    borderRadius: 4,
    border: "2px solid #d1d5db",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    transition: "all 0.15s ease",
    flexShrink: 0,
  };

  const footerStyle: React.CSSProperties = {
    display: "flex",
    gap: 12,
    padding: "16px 24px",
    borderTop: "1px solid #e5e5eb",
    backgroundColor: "#fafafa",
  };

  const buttonBaseStyle: React.CSSProperties = {
    flex: 1,
    padding: "12px 20px",
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.15s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  };

  const cancelButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    border: "1px solid #e5e5eb",
    backgroundColor: "transparent",
    color: "#6b7280",
  };

  const saveButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    border: "none",
    backgroundColor: "#7c3aed",
    color: "#fff",
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          style={overlayStyle}
          onClick={handleClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            style={modalStyle}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div style={headerStyle}>
              <h2 style={titleStyle}>
                {editingEvent ? "Edit Event" : "New Event"}
              </h2>
              <button
                onClick={handleClose}
                style={closeButtonStyle}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = "#f3f4f6";
                  e.currentTarget.style.color = "#4b5563";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#9ca3af";
                }}
              >
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Content */}
            <div style={contentStyle}>
              <AnimatePresence mode="wait">
                {showSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "48px 0",
                    }}
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 300 }}
                      style={{
                        marginBottom: 16,
                        display: "flex",
                        width: 64,
                        height: 64,
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        backgroundColor: "rgba(22, 163, 74, 0.15)",
                      }}
                    >
                      <Check style={{ width: 32, height: 32, color: "#16a34a" }} />
                    </motion.div>
                    <p style={{ fontWeight: 500, color: "#1e1e2e", margin: 0 }}>
                      Event created!
                    </p>
                  </motion.div>
                ) : (
                  <motion.form
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onSubmit={handleSubmit}
                  >
                    {/* Event Type Selector */}
                    <div style={{ ...fieldStyle, marginBottom: 24 }}>
                      <label style={labelStyle}>Event Type</label>
                      <div style={{ display: "flex", gap: 8 }}>
                        {(Object.keys(EVENT_TYPES) as EventType[]).map((type) => {
                          const meta = EVENT_TYPES[type];
                          const isSelected = eventType === type;
                          return (
                            <button
                              key={type}
                              type="button"
                              onClick={() => setEventType(type)}
                              style={{
                                flex: 1,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: 8,
                                padding: "10px 14px",
                                borderRadius: 8,
                                border: `2px solid ${isSelected ? meta.color : "#e5e5eb"}`,
                                backgroundColor: isSelected ? `${meta.color}10` : "transparent",
                                color: isSelected ? meta.color : "#6b7280",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer",
                                transition: "all 0.15s ease",
                              }}
                              onMouseOver={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = meta.color;
                                  e.currentTarget.style.backgroundColor = `${meta.color}08`;
                                }
                              }}
                              onMouseOut={(e) => {
                                if (!isSelected) {
                                  e.currentTarget.style.borderColor = "#e5e5eb";
                                  e.currentTarget.style.backgroundColor = "transparent";
                                }
                              }}
                            >
                              {EVENT_ICONS[type]}
                              {meta.label}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Title */}
                    <div style={fieldStyle}>
                      <label htmlFor="title" style={labelStyle}>
                        Title <span style={{ color: "#ef4444" }}>*</span>
                      </label>
                      <input
                        id="title"
                        type="text"
                        placeholder="Enter event title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                        autoFocus
                        style={inputStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5eb")}
                      />
                    </div>

                    {/* Description */}
                    <div style={fieldStyle}>
                      <label htmlFor="description" style={labelStyle}>
                        Description
                      </label>
                      <textarea
                        id="description"
                        placeholder="Add details or notes..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        rows={3}
                        style={textareaStyle}
                        onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                        onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5eb")}
                      />
                    </div>

                    {/* Date and Time Row */}
                    <div style={rowStyle}>
                      <div style={{ flex: 1 }}>
                        <label htmlFor="eventDate" style={labelStyle}>
                          Date <span style={{ color: "#ef4444" }}>*</span>
                        </label>
                        <input
                          id="eventDate"
                          type="date"
                          value={eventDate}
                          onChange={(e) => setEventDate(e.target.value)}
                          required
                          style={inputStyle}
                          onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                          onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5eb")}
                        />
                      </div>

                      {showTimeAndVisibility && (
                        <div style={{ flex: 1 }}>
                          <label htmlFor="eventTime" style={labelStyle}>
                            Time
                          </label>
                          <input
                            id="eventTime"
                            type="time"
                            value={eventTime}
                            onChange={(e) => setEventTime(e.target.value)}
                            style={inputStyle}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5eb")}
                          />
                        </div>
                      )}
                    </div>

                    {/* Visibility Toggle - only for milestone and deliverable */}
                    {showTimeAndVisibility && (
                      <div style={fieldStyle}>
                        <label style={labelStyle}>Visibility</label>
                        <div style={{ display: "flex", gap: 8 }}>
                          {(["internal", "external"] as EventVisibility[]).map((vis) => {
                            const isSelected = visibility === vis;
                            const color = vis === "external" ? "#10b981" : "#6b7280";
                            return (
                              <button
                                key={vis}
                                type="button"
                                onClick={() => setVisibility(vis)}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  padding: "10px 14px",
                                  borderRadius: 8,
                                  border: `2px solid ${isSelected ? color : "#e5e5eb"}`,
                                  backgroundColor: isSelected ? `${color}10` : "transparent",
                                  color: isSelected ? color : "#6b7280",
                                  fontSize: 13,
                                  fontWeight: 500,
                                  cursor: "pointer",
                                  transition: "all 0.15s ease",
                                  textTransform: "capitalize",
                                }}
                                onMouseOver={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = color;
                                  }
                                }}
                                onMouseOut={(e) => {
                                  if (!isSelected) {
                                    e.currentTarget.style.borderColor = "#e5e5eb";
                                  }
                                }}
                              >
                                {vis}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Asset Link - only for deliverable */}
                    {showAssetLink && (
                      <div style={fieldStyle}>
                        <label htmlFor="linkedAsset" style={labelStyle}>
                          Link to Task
                        </label>
                        <div style={selectWrapperStyle}>
                          <select
                            id="linkedAsset"
                            value={linkedAssetId}
                            onChange={(e) => setLinkedAssetId(e.target.value)}
                            style={{
                              ...selectStyle,
                              color: linkedAssetId ? "#1e1e2e" : "#9ca3af",
                            }}
                            onFocus={(e) => (e.currentTarget.style.borderColor = "#7c3aed")}
                            onBlur={(e) => (e.currentTarget.style.borderColor = "#e5e5eb")}
                          >
                            <option value="">No linked task</option>
                            {assets?.map((asset) => (
                              <option key={asset.id} value={asset.id}>
                                {asset.name}
                              </option>
                            ))}
                          </select>
                          <ChevronDown style={{ ...selectIconStyle, width: 16, height: 16 }} />
                        </div>
                      </div>
                    )}

                    {/* Auto-create task checkbox - only for deliverable */}
                    {showAutoCreateTask && (
                      <div style={{ marginBottom: 20 }}>
                        <label
                          style={{
                            ...checkboxWrapperStyle,
                            borderColor: autoCreateTask ? "#f59e0b" : "#e5e5eb",
                            backgroundColor: autoCreateTask ? "rgba(245, 158, 11, 0.05)" : "#f9fafb",
                          }}
                          onMouseOver={(e) => {
                            if (!autoCreateTask) {
                              e.currentTarget.style.borderColor = "#d1d5db";
                            }
                          }}
                          onMouseOut={(e) => {
                            if (!autoCreateTask) {
                              e.currentTarget.style.borderColor = "#e5e5eb";
                            }
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={autoCreateTask}
                            onChange={(e) => setAutoCreateTask(e.target.checked)}
                            style={{ display: "none" }}
                          />
                          <span
                            style={{
                              ...checkboxStyle,
                              borderColor: autoCreateTask ? "#f59e0b" : "#d1d5db",
                              backgroundColor: autoCreateTask ? "#f59e0b" : "transparent",
                            }}
                          >
                            {autoCreateTask && (
                              <Check style={{ width: 12, height: 12, color: "#fff" }} />
                            )}
                          </span>
                          <span style={{ fontSize: 14, color: "#4b5563" }}>
                            Auto-create a task for this deliverable
                          </span>
                        </label>
                      </div>
                    )}
                  </motion.form>
                )}
              </AnimatePresence>
            </div>

            {/* Footer */}
            {!showSuccess && (
              <div style={footerStyle}>
                <button
                  type="button"
                  onClick={handleClose}
                  style={cancelButtonStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = "#f3f4f6";
                    e.currentTarget.style.borderColor = "#d1d5db";
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "transparent";
                    e.currentTarget.style.borderColor = "#e5e5eb";
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  onClick={handleSubmit}
                  disabled={!title.trim() || isLoading}
                  style={{
                    ...saveButtonStyle,
                    opacity: !title.trim() || isLoading ? 0.6 : 1,
                    cursor: !title.trim() || isLoading ? "not-allowed" : "pointer",
                  }}
                  onMouseOver={(e) => {
                    if (title.trim() && !isLoading) {
                      e.currentTarget.style.backgroundColor = "#6d28d9";
                    }
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = "#7c3aed";
                  }}
                >
                  {isLoading ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: "spin 1s linear infinite" }} />
                      Saving...
                    </>
                  ) : (
                    <>{editingEvent ? "Save Changes" : "Create Event"}</>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
