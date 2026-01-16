import { useState, useMemo } from "react";
import { Calendar } from "./Calendar";
import { EventForm } from "./EventForm";
import { EventCard } from "./EventCard";
import { useEvents } from "../hooks/useEvents";
import { useEventMutations } from "../hooks/useEventMutations";
import { useEventRealtime } from "../hooks/useEventRealtime";
import {
  Plus,
  Filter,
  Flag,
  Package,
  Tag,
  X,
  CalendarDays,
  List,
} from "lucide-react";
import type { Event, EventInsert, EventType } from "@/types/database";

type ViewMode = "calendar" | "list";

export function ScheduleView() {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");
  const [typeFilter, setTypeFilter] = useState<EventType | null>(null);

  const { data: events, isLoading } = useEvents({});
  const { createEvent, updateEvent, deleteEvent, deleteEventWithLinkedTask, checkLinkedTask } = useEventMutations();
  useEventRealtime();

  // Filter events based on selected type
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    if (!typeFilter) return events;
    return events.filter((e) => e.type === typeFilter);
  }, [events, typeFilter]);

  // Get events for the selected date
  const selectedDateEvents = useMemo(() => {
    if (!selectedDate || !filteredEvents) return [];
    const dateStr = selectedDate.toISOString().split("T")[0];
    return filteredEvents.filter((e) => e.event_date === dateStr);
  }, [selectedDate, filteredEvents]);

  // Get upcoming events (next 30 days)
  const upcomingEvents = useMemo(() => {
    if (!filteredEvents) return [];
    const now = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(now.getDate() + 30);

    return filteredEvents
      .filter((e) => {
        const eventDate = new Date(e.event_date);
        return eventDate >= now && eventDate <= thirtyDaysFromNow;
      })
      .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());
  }, [filteredEvents]);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
  };

  const handleAddEvent = () => {
    setEditingEvent(null);
    setIsFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setEditingEvent(event);
    setIsFormOpen(true);
  };

  const handleDeleteEvent = async (eventId: string) => {
    // Check if event has a linked task
    const linkedTask = await checkLinkedTask(eventId);

    if (linkedTask) {
      const deleteLinked = confirm(
        `⚠️ This event is linked to task "${linkedTask.name}".\n\n` +
        `Do you want to delete BOTH the event and the linked task?\n\n` +
        `Click OK to delete both, or Cancel to keep both.`
      );

      if (deleteLinked) {
        await deleteEventWithLinkedTask.mutateAsync(eventId);
      }
    } else {
      if (confirm("Are you sure you want to delete this event?")) {
        await deleteEvent.mutateAsync(eventId);
      }
    }
  };

  const handleSaveEvent = async (eventData: EventInsert) => {
    if (editingEvent) {
      await updateEvent.mutateAsync({ id: editingEvent.id, ...eventData });
    } else {
      await createEvent.mutateAsync(eventData);
    }
    setIsFormOpen(false);
    setEditingEvent(null);
  };

  const filterButtons: { type: EventType | null; label: string; icon: React.ReactNode; color: string }[] = [
    { type: null, label: "All", icon: null, color: "#7c3aed" },
    { type: "milestone", label: "Milestones", icon: <Flag style={{ width: 14, height: 14 }} />, color: "#8b5cf6" },
    { type: "deliverable", label: "Deliverables", icon: <Package style={{ width: 14, height: 14 }} />, color: "#f59e0b" },
    { type: "label", label: "Labels", icon: <Tag style={{ width: 14, height: 14 }} />, color: "#6b7280" },
  ];

  const cardStyle: React.CSSProperties = {
    backgroundColor: "#fff",
    borderRadius: 12,
    border: "1px solid #e5e5eb",
    overflow: "hidden",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Header Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        {/* Left: Add Event + View Toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <button
            onClick={handleAddEvent}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 16px",
              borderRadius: 8,
              border: "none",
              backgroundColor: "#7c3aed",
              color: "#fff",
              fontSize: 14,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#6d28d9")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#7c3aed")}
          >
            <Plus style={{ width: 18, height: 18 }} />
            Add Event
          </button>

          {/* View Toggle */}
          <div
            style={{
              display: "flex",
              backgroundColor: "#e8e8ed",
              borderRadius: 8,
              padding: 4,
            }}
          >
            <button
              onClick={() => setViewMode("calendar")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: viewMode === "calendar" ? "#fff" : "transparent",
                color: viewMode === "calendar" ? "#1e1e2e" : "#6b7280",
                boxShadow: viewMode === "calendar" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <CalendarDays style={{ width: 16, height: 16 }} />
              Calendar
            </button>
            <button
              onClick={() => setViewMode("list")}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "8px 12px",
                borderRadius: 6,
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 500,
                backgroundColor: viewMode === "list" ? "#fff" : "transparent",
                color: viewMode === "list" ? "#1e1e2e" : "#6b7280",
                boxShadow: viewMode === "list" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <List style={{ width: 16, height: 16 }} />
              List
            </button>
          </div>
        </div>

        {/* Right: Filter */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Filter style={{ width: 14, height: 14, color: "#6b7280" }} />
          {filterButtons.map((btn) => (
            <button
              key={btn.type ?? "all"}
              onClick={() => setTypeFilter(btn.type)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "6px 12px",
                borderRadius: 999,
                border: "none",
                cursor: "pointer",
                fontSize: 12,
                fontWeight: 500,
                backgroundColor:
                  typeFilter === btn.type
                    ? btn.type
                      ? `${btn.color}20`
                      : "rgba(124, 58, 237, 0.15)"
                    : "#e8e8ed",
                color: typeFilter === btn.type ? btn.color : "#6b7280",
                transition: "all 0.15s ease",
              }}
            >
              {btn.icon}
              {btn.label}
            </button>
          ))}
          {typeFilter && (
            <button
              onClick={() => setTypeFilter(null)}
              title="Clear filter"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 24,
                height: 24,
                borderRadius: "50%",
                border: "none",
                cursor: "pointer",
                backgroundColor: "rgba(107, 114, 128, 0.15)",
                color: "#6b7280",
                transition: "all 0.15s ease",
              }}
            >
              <X style={{ width: 14, height: 14 }} />
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      {isLoading ? (
        <div
          style={{
            ...cardStyle,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 400,
          }}
        >
          <p style={{ color: "#6b7280" }}>Loading events...</p>
        </div>
      ) : viewMode === "calendar" ? (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 24 }}>
          {/* Calendar */}
          <Calendar
            events={filteredEvents || []}
            selectedDate={selectedDate}
            onDayClick={handleDayClick}
          />

          {/* Sidebar: Selected Date Events or Upcoming */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {selectedDate ? (
              <>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>
                    {selectedDate.toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                  </h3>
                  <button
                    onClick={() => setSelectedDate(null)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      border: "none",
                      backgroundColor: "rgba(107, 114, 128, 0.1)",
                      color: "#6b7280",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <X style={{ width: 14, height: 14 }} />
                  </button>
                </div>

                {selectedDateEvents.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {selectedDateEvents.map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        linkedAssetName={event.linked_asset?.name}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                  </div>
                ) : (
                  <div
                    style={{
                      ...cardStyle,
                      padding: 24,
                      textAlign: "center",
                    }}
                  >
                    <p style={{ color: "#6b7280", margin: "0 0 12px" }}>No events on this day</p>
                    <button
                      onClick={() => {
                        setEditingEvent(null);
                        setIsFormOpen(true);
                      }}
                      style={{
                        padding: "8px 16px",
                        borderRadius: 6,
                        border: "1px solid #e5e5eb",
                        backgroundColor: "#fff",
                        color: "#7c3aed",
                        fontSize: 13,
                        fontWeight: 500,
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Add Event
                    </button>
                  </div>
                )}

                {/* Always show upcoming events below */}
                {upcomingEvents.length > 0 && (
                  <>
                    <h3 style={{ fontSize: 14, fontWeight: 600, color: "#6b7280", margin: "8px 0 0" }}>
                      Upcoming
                    </h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                      {upcomingEvents.slice(0, 5).map((event) => (
                        <EventCard
                          key={event.id}
                          event={event}
                          linkedAssetName={event.linked_asset?.name}
                          onEdit={handleEditEvent}
                          onDelete={handleDeleteEvent}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                <h3 style={{ fontSize: 16, fontWeight: 600, color: "#1e1e2e", margin: 0 }}>
                  Upcoming Events
                </h3>
                {upcomingEvents.length === 0 ? (
                  <div
                    style={{
                      ...cardStyle,
                      padding: 32,
                      textAlign: "center",
                    }}
                  >
                    <CalendarDays
                      style={{ width: 40, height: 40, color: "#d1d5db", margin: "0 auto 12px" }}
                    />
                    <p style={{ color: "#6b7280", margin: 0 }}>No upcoming events</p>
                  </div>
                ) : (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                      maxHeight: "calc(100vh - 300px)",
                      overflowY: "auto",
                    }}
                  >
                    {upcomingEvents.slice(0, 10).map((event) => (
                      <EventCard
                        key={event.id}
                        event={event}
                        linkedAssetName={event.linked_asset?.name}
                        onEdit={handleEditEvent}
                        onDelete={handleDeleteEvent}
                      />
                    ))}
                    {upcomingEvents.length > 10 && (
                      <p
                        style={{
                          fontSize: 13,
                          color: "#6b7280",
                          textAlign: "center",
                          margin: "8px 0",
                        }}
                      >
                        +{upcomingEvents.length - 10} more events
                      </p>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      ) : (
        /* List View */
        <div style={cardStyle}>
          {filteredEvents && filteredEvents.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column" }}>
              {filteredEvents
                .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
                .map((event, index) => (
                  <div
                    key={event.id}
                    style={{
                      padding: 16,
                      borderBottom:
                        index < filteredEvents.length - 1 ? "1px solid #e5e5eb" : "none",
                    }}
                  >
                    <EventCard
                      event={event}
                      linkedAssetName={event.linked_asset?.name}
                      onEdit={handleEditEvent}
                      onDelete={handleDeleteEvent}
                    />
                  </div>
                ))}
            </div>
          ) : (
            <div
              style={{
                padding: 48,
                textAlign: "center",
              }}
            >
              <CalendarDays
                style={{ width: 48, height: 48, color: "#d1d5db", margin: "0 auto 16px" }}
              />
              <h3 style={{ fontSize: 18, fontWeight: 600, color: "#1e1e2e", margin: "0 0 8px" }}>
                No Events Yet
              </h3>
              <p style={{ color: "#6b7280", margin: "0 0 20px" }}>
                Create your first event to get started
              </p>
              <button
                onClick={handleAddEvent}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  backgroundColor: "#7c3aed",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                <Plus style={{ width: 18, height: 18 }} />
                Add Event
              </button>
            </div>
          )}
        </div>
      )}

      {/* Event Form Modal */}
      <EventForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        initialDate={selectedDate || undefined}
        editingEvent={editingEvent}
      />
    </div>
  );
}
