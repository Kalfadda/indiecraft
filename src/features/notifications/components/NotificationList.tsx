import { useRef, useCallback } from "react";
import { AnimatePresence } from "motion/react";
import { Bell, Loader2, AlertCircle } from "lucide-react";
import { useNotifications } from "../hooks/useNotifications";
import { NotificationCard } from "./NotificationCard";

export function NotificationList() {
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useNotifications();

  const observerRef = useRef<IntersectionObserver | null>(null);

  // Infinite scroll trigger element
  const lastElementRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (isFetchingNextPage) return;
      if (observerRef.current) observerRef.current.disconnect();

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasNextPage) {
          fetchNextPage();
        }
      });

      if (node) observerRef.current.observe(node);
    },
    [isFetchingNextPage, hasNextPage, fetchNextPage]
  );

  // Flatten pages into single array
  const notifications = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          color: "#6b7280",
        }}
      >
        <Loader2
          style={{
            width: 32,
            height: 32,
            animation: "spin 1s linear infinite",
          }}
        />
        <p style={{ marginTop: 12, fontSize: 14 }}>Loading notifications...</p>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: 16,
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          borderRadius: 10,
          border: "1px solid rgba(239, 68, 68, 0.2)",
          color: "#ef4444",
        }}
      >
        <AlertCircle style={{ width: 20, height: 20, flexShrink: 0 }} />
        <span style={{ fontSize: 14 }}>
          Failed to load notifications. Please try again.
        </span>
      </div>
    );
  }

  if (notifications.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          color: "#9ca3af",
        }}
      >
        <Bell style={{ width: 48, height: 48, opacity: 0.3 }} />
        <p style={{ marginTop: 16, fontSize: 16, fontWeight: 500 }}>
          No notifications yet
        </p>
        <p style={{ marginTop: 4, fontSize: 13 }}>
          Activity from your team will appear here
        </p>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <AnimatePresence mode="popLayout">
        {notifications.map((notification, index) => (
          <NotificationCard
            key={notification.id}
            notification={notification}
            index={index}
            ref={index === notifications.length - 1 ? lastElementRef : undefined}
          />
        ))}
      </AnimatePresence>

      {isFetchingNextPage && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            padding: 16,
            color: "#6b7280",
          }}
        >
          <Loader2
            style={{
              width: 24,
              height: 24,
              animation: "spin 1s linear infinite",
            }}
          />
        </div>
      )}

      {!hasNextPage && notifications.length > 0 && (
        <div
          style={{
            textAlign: "center",
            padding: 16,
            fontSize: 13,
            color: "#9ca3af",
          }}
        >
          You've reached the end
        </div>
      )}
    </div>
  );
}
