import type { Event } from "@/types/database";

/**
 * Formats a date for ICS file format (YYYYMMDD or YYYYMMDDTHHmmss)
 */
function formatICSDate(date: Date, includeTime: boolean = false): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  if (!includeTime) {
    return `${year}${month}${day}`;
  }

  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}

/**
 * Escapes special characters for ICS format
 */
function escapeICSText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

/**
 * Generates an ICS (iCalendar) file content from events
 */
export function generateICSFile(events: Event[], calendarName: string = "Scythe Ops Events"): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Scythe Ops//Schedule//EN",
    `X-WR-CALNAME:${escapeICSText(calendarName)}`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
  ];

  for (const event of events) {
    const eventDate = new Date(event.event_date);
    const hasTime = !!(event as any).event_time;

    if (hasTime && (event as any).event_time) {
      const [hours, minutes] = (event as any).event_time.split(":");
      eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
    }

    // Generate a unique ID for the event
    const uid = `${event.id}@scytheops`;

    // Calculate end date (1 hour after start for timed events, same day for all-day)
    const endDate = new Date(eventDate);
    if (hasTime) {
      endDate.setHours(endDate.getHours() + 1);
    } else {
      endDate.setDate(endDate.getDate() + 1);
    }

    const now = new Date();
    const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
    const description = event.description
      ? `[${typeLabel}] ${event.description}`
      : `[${typeLabel}]`;

    lines.push("BEGIN:VEVENT");
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${formatICSDate(now, true)}Z`);

    if (hasTime) {
      lines.push(`DTSTART:${formatICSDate(eventDate, true)}`);
      lines.push(`DTEND:${formatICSDate(endDate, true)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${formatICSDate(eventDate)}`);
      lines.push(`DTEND;VALUE=DATE:${formatICSDate(endDate)}`);
    }

    lines.push(`SUMMARY:${escapeICSText(event.title)}`);
    lines.push(`DESCRIPTION:${escapeICSText(description)}`);

    // Add categories based on event type
    lines.push(`CATEGORIES:${event.type.toUpperCase()}`);

    // Add visibility as a custom property
    if (event.visibility) {
      lines.push(`X-VISIBILITY:${event.visibility.toUpperCase()}`);
    }

    lines.push("END:VEVENT");
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

/**
 * Downloads an ICS file to the user's computer
 */
export function downloadICSFile(events: Event[], filename: string = "scythe-ops-events.ics"): void {
  const icsContent = generateICSFile(events);
  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Opens Google Calendar with pre-filled event details
 * Note: This only works for single events
 */
export function exportToGoogleCalendar(event: Event): void {
  const eventDate = new Date(event.event_date);
  const hasTime = !!(event as any).event_time;

  if (hasTime && (event as any).event_time) {
    const [hours, minutes] = (event as any).event_time.split(":");
    eventDate.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0);
  }

  // End date (1 hour after for timed, next day for all-day)
  const endDate = new Date(eventDate);
  if (hasTime) {
    endDate.setHours(endDate.getHours() + 1);
  } else {
    endDate.setDate(endDate.getDate() + 1);
  }

  // Format dates for Google Calendar URL
  const formatGoogleDate = (d: Date, withTime: boolean): string => {
    if (withTime) {
      return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    }
    return formatICSDate(d);
  };

  const dates = hasTime
    ? `${formatGoogleDate(eventDate, true)}/${formatGoogleDate(endDate, true)}`
    : `${formatGoogleDate(eventDate, false)}/${formatGoogleDate(endDate, false)}`;

  const typeLabel = event.type.charAt(0).toUpperCase() + event.type.slice(1);
  const description = event.description
    ? `[${typeLabel}] ${event.description}`
    : `[${typeLabel}]`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: dates,
    details: description,
  });

  const googleCalendarUrl = `https://calendar.google.com/calendar/render?${params.toString()}`;
  window.open(googleCalendarUrl, "_blank");
}
