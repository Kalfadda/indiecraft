import { AnimatePresence } from "motion/react";
import { useNotificationStore } from "@/stores/notificationStore";
import { useNotificationSound } from "@/hooks/useNotificationSound";
import { NotificationToast } from "./NotificationToast";

export function NotificationContainer() {
  const notifications = useNotificationStore((state) => state.notifications);
  const removeNotification = useNotificationStore(
    (state) => state.removeNotification
  );

  // Sound hook handles playing on new notifications
  useNotificationSound();

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column-reverse",
        gap: 12,
        pointerEvents: "none",
        maxHeight: "calc(100vh - 48px)",
        overflow: "hidden",
      }}
    >
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
            onDismiss={() => removeNotification(notification.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
