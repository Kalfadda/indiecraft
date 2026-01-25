import { Bell } from "lucide-react";

import { useTheme } from "@/stores/themeStore";

import { useNotificationRealtime } from "../hooks/useNotificationRealtime";
import { NotificationList } from "./NotificationList";

export function NotificationsView() {
  const theme = useTheme();

  // Enable real-time updates for the notifications list
  useNotificationRealtime();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, transition: "all 0.3s ease" }}>
      {/* Header */}
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 6 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              backgroundColor: theme.colors.primaryLight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
            }}
          >
            <Bell style={{ width: 22, height: 22, color: theme.colors.primary, transition: "all 0.3s ease" }} />
          </div>
          <h2
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: theme.colors.text,
              margin: 0,
              transition: "all 0.3s ease",
            }}
          >
            Notifications
          </h2>
        </div>
        <p
          style={{
            fontSize: 14,
            color: theme.colors.textMuted,
            margin: 0,
            marginLeft: 52,
            transition: "all 0.3s ease",
          }}
        >
          Activity log for the team
        </p>
      </div>

      {/* Notification List with infinite scroll */}
      <NotificationList />
    </div>
  );
}
