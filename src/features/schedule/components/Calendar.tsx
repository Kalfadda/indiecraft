import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTheme } from "@/stores/themeStore";

interface CalendarEvent {
  id: string;
  type: "milestone" | "deliverable" | "label";
  title: string;
  event_date: string;
}

interface CalendarProps {
  events: CalendarEvent[];
  onDayClick: (date: Date) => void;
  selectedDate: Date | null;
}

const EVENT_COLORS: Record<CalendarEvent["type"], string> = {
  milestone: "#8b5cf6",
  deliverable: "#f59e0b",
  label: "#6b7280",
};

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function formatDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

export function Calendar({ events, onDayClick, selectedDate }: CalendarProps) {
  const theme = useTheme();
  const today = useMemo(() => new Date(), []);
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>();
    events.forEach((event) => {
      const dateKey = event.event_date.split("T")[0];
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(event);
    });
    return map;
  }, [events]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDayOfMonth = getFirstDayOfMonth(currentYear, currentMonth);

  // Calculate previous month days to show
  const prevMonthDays = getDaysInMonth(
    currentMonth === 0 ? currentYear - 1 : currentYear,
    currentMonth === 0 ? 11 : currentMonth - 1
  );

  // Generate calendar grid
  const calendarDays = useMemo(() => {
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      isSelected: boolean;
      events: CalendarEvent[];
    }> = [];

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
      const day = prevMonthDays - i;
      const month = currentMonth === 0 ? 11 : currentMonth - 1;
      const year = currentMonth === 0 ? currentYear - 1 : currentYear;
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);

      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateKey = formatDateKey(date);

      days.push({
        date,
        isCurrentMonth: true,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    // Next month days to fill the grid (always show 6 rows = 42 days)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const month = currentMonth === 11 ? 0 : currentMonth + 1;
      const year = currentMonth === 11 ? currentYear + 1 : currentYear;
      const date = new Date(year, month, day);
      const dateKey = formatDateKey(date);

      days.push({
        date,
        isCurrentMonth: false,
        isToday: isSameDay(date, today),
        isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
        events: eventsByDate.get(dateKey) || [],
      });
    }

    return days;
  }, [currentYear, currentMonth, firstDayOfMonth, daysInMonth, prevMonthDays, today, selectedDate, eventsByDate]);

  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const goToToday = () => {
    setCurrentMonth(today.getMonth());
    setCurrentYear(today.getFullYear());
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: theme.colors.card,
    borderRadius: 12,
    border: `1px solid ${theme.colors.border}`,
    overflow: "hidden",
    transition: "all 0.3s ease",
  };

  const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "16px 20px",
    borderBottom: `1px solid ${theme.colors.border}`,
    transition: "all 0.3s ease",
  };

  const navButtonStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 36,
    height: 36,
    borderRadius: 8,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.card,
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const todayButtonStyle: React.CSSProperties = {
    padding: "6px 12px",
    borderRadius: 6,
    border: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.card,
    fontSize: 13,
    fontWeight: 500,
    color: theme.colors.textMuted,
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  const weekdayHeaderStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    borderBottom: `1px solid ${theme.colors.border}`,
    backgroundColor: theme.colors.backgroundSecondary,
    transition: "all 0.3s ease",
  };

  const weekdayCellStyle: React.CSSProperties = {
    padding: "10px 0",
    textAlign: "center",
    fontSize: 12,
    fontWeight: 600,
    color: theme.colors.textMuted,
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  };

  const gridStyle: React.CSSProperties = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
  };

  return (
    <div style={containerStyle}>
      {/* Header */}
      <div style={headerStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, fontWeight: 600, color: theme.colors.text, transition: "all 0.3s ease" }}>
            {MONTHS[currentMonth]} {currentYear}
          </h2>
          <button
            onClick={goToToday}
            style={todayButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.cardHover;
              e.currentTarget.style.borderColor = theme.colors.textMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.card;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            Today
          </button>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={goToPreviousMonth}
            style={navButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.cardHover;
              e.currentTarget.style.borderColor = theme.colors.textMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.card;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <ChevronLeft style={{ width: 18, height: 18, color: theme.colors.textMuted }} />
          </button>
          <button
            onClick={goToNextMonth}
            style={navButtonStyle}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.cardHover;
              e.currentTarget.style.borderColor = theme.colors.textMuted;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.card;
              e.currentTarget.style.borderColor = theme.colors.border;
            }}
          >
            <ChevronRight style={{ width: 18, height: 18, color: theme.colors.textMuted }} />
          </button>
        </div>
      </div>

      {/* Weekday Headers */}
      <div style={weekdayHeaderStyle}>
        {WEEKDAYS.map((day) => (
          <div key={day} style={weekdayCellStyle}>
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div style={gridStyle}>
        {calendarDays.map((day, index) => {
          const dayCellStyle: React.CSSProperties = {
            minHeight: 80,
            padding: 8,
            borderRight: (index + 1) % 7 === 0 ? "none" : `1px solid ${theme.colors.border}`,
            borderBottom: index < 35 ? `1px solid ${theme.colors.border}` : "none",
            backgroundColor: day.isCurrentMonth ? theme.colors.card : theme.colors.backgroundSecondary,
            cursor: "pointer",
            transition: "all 0.3s ease",
            position: "relative",
            overflow: "hidden",
          };

          const dayNumberStyle: React.CSSProperties = {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 28,
            height: 28,
            borderRadius: "50%",
            fontSize: 13,
            fontWeight: day.isToday ? 600 : 400,
            color: day.isToday
              ? theme.colors.textInverse
              : day.isCurrentMonth
              ? theme.colors.text
              : theme.colors.textMuted,
            backgroundColor: day.isToday
              ? theme.colors.primary
              : day.isSelected
              ? theme.colors.primaryLight
              : "transparent",
            transition: "all 0.3s ease",
          };

          const eventsContainerStyle: React.CSSProperties = {
            marginTop: 4,
            display: "flex",
            flexDirection: "column",
            gap: 2,
            overflow: "hidden",
            width: "100%",
          };

          // Limit visible events to prevent overflow
          const visibleEvents = day.events.slice(0, 3);
          const remainingCount = day.events.length - 3;

          return (
            <div
              key={index}
              style={dayCellStyle}
              onClick={() => onDayClick(day.date)}
              onMouseEnter={(e) => {
                if (!day.isToday) {
                  e.currentTarget.style.backgroundColor = day.isCurrentMonth
                    ? theme.colors.cardHover
                    : theme.colors.borderLight;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = day.isCurrentMonth
                  ? theme.colors.card
                  : theme.colors.backgroundSecondary;
              }}
            >
              <div style={dayNumberStyle}>{day.date.getDate()}</div>
              {day.events.length > 0 && (
                <div style={eventsContainerStyle}>
                  {visibleEvents.map((event) => (
                    <div
                      key={event.id}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: "2px 6px",
                        borderRadius: 4,
                        backgroundColor: `${EVENT_COLORS[event.type]}15`,
                        overflow: "hidden",
                        minWidth: 0,
                        maxWidth: "100%",
                      }}
                      title={event.title}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          backgroundColor: EVENT_COLORS[event.type],
                          flexShrink: 0,
                        }}
                      />
                      <span
                        style={{
                          fontSize: 10,
                          fontWeight: 500,
                          color: EVENT_COLORS[event.type],
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          minWidth: 0,
                          flex: 1,
                        }}
                      >
                        {event.title}
                      </span>
                    </div>
                  ))}
                  {remainingCount > 0 && (
                    <span
                      style={{
                        fontSize: 10,
                        color: theme.colors.textMuted,
                        paddingLeft: 6,
                      }}
                    >
                      +{remainingCount} more
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
