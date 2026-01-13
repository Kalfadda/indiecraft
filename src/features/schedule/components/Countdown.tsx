import { useState, useEffect } from "react";

interface CountdownProps {
  targetDate: Date;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  isPast: boolean;
}

function calculateTimeRemaining(targetDate: Date): TimeRemaining {
  const now = new Date();
  const diff = targetDate.getTime() - now.getTime();

  if (diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, isPast: true };
  }

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

  return { days, hours, minutes, isPast: false };
}

export function Countdown({ targetDate }: CountdownProps) {
  const [timeRemaining, setTimeRemaining] = useState<TimeRemaining>(() =>
    calculateTimeRemaining(targetDate)
  );

  useEffect(() => {
    // Recalculate immediately when targetDate changes
    setTimeRemaining(calculateTimeRemaining(targetDate));

    // Update every minute
    const interval = setInterval(() => {
      setTimeRemaining(calculateTimeRemaining(targetDate));
    }, 60000);

    return () => clearInterval(interval);
  }, [targetDate]);

  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 4,
    fontSize: 12,
    fontWeight: 500,
  };

  const unitStyle: React.CSSProperties = {
    display: "inline-flex",
    alignItems: "center",
    gap: 2,
    padding: "2px 6px",
    borderRadius: 4,
    backgroundColor: timeRemaining.isPast ? "rgba(239, 68, 68, 0.1)" : "rgba(139, 92, 246, 0.1)",
    color: timeRemaining.isPast ? "#ef4444" : "#8b5cf6",
  };

  const separatorStyle: React.CSSProperties = {
    color: "#9ca3af",
    fontSize: 10,
  };

  if (timeRemaining.isPast) {
    return (
      <div style={containerStyle}>
        <span style={unitStyle}>Event passed</span>
      </div>
    );
  }

  // Format display based on time remaining
  const parts: string[] = [];
  if (timeRemaining.days > 0) {
    parts.push(`${timeRemaining.days}d`);
  }
  if (timeRemaining.hours > 0 || timeRemaining.days > 0) {
    parts.push(`${timeRemaining.hours}h`);
  }
  parts.push(`${timeRemaining.minutes}m`);

  return (
    <div style={containerStyle}>
      {parts.map((part, index) => (
        <span key={index}>
          <span style={unitStyle}>{part}</span>
          {index < parts.length - 1 && <span style={separatorStyle}> </span>}
        </span>
      ))}
    </div>
  );
}
