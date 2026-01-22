import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { PersistentNotificationType, PersistentNotificationVariant } from "@/types/database";

export type NotificationType =
  | "task_created"
  | "task_completed"
  | "task_in_progress"
  | "task_blocked"
  | "task_claimed"
  | "task_unclaimed"
  | "schedule_created"
  | "schedule_updated"
  | "model_request_created"
  | "model_request_accepted"
  | "model_request_denied"
  | "feature_request_created"
  | "feature_request_accepted"
  | "feature_request_denied"
  | "comment_created";

export type NotificationVariant = "success" | "info" | "warning" | "error";

export interface Notification {
  id: string;
  type: NotificationType;
  variant: NotificationVariant;
  title: string;
  message: string;
  timestamp: number;
  isOwnAction: boolean;
  actorName?: string;
  itemName?: string;
  duration: number;
}

interface NotificationState {
  notifications: Notification[];
  maxNotifications: number;
  soundEnabled: boolean;
  addNotification: (
    notification: Omit<Notification, "id" | "timestamp">
  ) => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setSoundEnabled: (enabled: boolean) => void;
}

// Persist notification to database (fire and forget)
async function persistNotification(notification: Omit<Notification, "id" | "timestamp">) {
  try {
    await supabase.from("notifications").insert({
      type: notification.type as PersistentNotificationType,
      variant: notification.variant as PersistentNotificationVariant,
      title: notification.title,
      message: notification.message,
      actor_name: notification.actorName || null,
      item_name: notification.itemName || null,
    });
  } catch (error) {
    console.error("Failed to persist notification:", error);
  }
}

export const useNotificationStore = create<NotificationState>()((set, get) => ({
  notifications: [],
  maxNotifications: 5,
  soundEnabled: true,

  addNotification: (notification) => {
    const id = crypto.randomUUID();
    const newNotification: Notification = {
      ...notification,
      id,
      timestamp: Date.now(),
    };

    // Persist to database (fire and forget - don't block the UI)
    persistNotification(notification);

    set((state) => ({
      notifications: [
        newNotification,
        ...state.notifications.slice(0, state.maxNotifications - 1),
      ],
    }));

    // Auto-remove after duration
    setTimeout(() => {
      get().removeNotification(id);
    }, newNotification.duration);
  },

  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearAll: () => set({ notifications: [] }),

  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
}));

// Notification configuration helper
const notificationConfigs: Record<
  NotificationType,
  {
    title: string;
    messageOwn: (name: string) => string;
    messageOther: (actor: string, name: string) => string;
    variant: NotificationVariant;
  }
> = {
  task_created: {
    title: "Task Created",
    messageOwn: (name) => `You created "${name}"`,
    messageOther: (actor, name) => `${actor} created "${name}"`,
    variant: "success",
  },
  task_completed: {
    title: "Task Completed",
    messageOwn: (name) => `You completed "${name}"`,
    messageOther: (actor, name) => `${actor} completed "${name}"`,
    variant: "success",
  },
  task_in_progress: {
    title: "Task Started",
    messageOwn: (name) => `You started "${name}"`,
    messageOther: (actor, name) => `${actor} started "${name}"`,
    variant: "info",
  },
  task_blocked: {
    title: "Task Blocked",
    messageOwn: (name) => `You blocked "${name}"`,
    messageOther: (actor, name) => `${actor} blocked "${name}"`,
    variant: "warning",
  },
  task_claimed: {
    title: "Task Claimed",
    messageOwn: (name) => `You claimed "${name}"`,
    messageOther: (actor, name) => `${actor} claimed "${name}"`,
    variant: "info",
  },
  task_unclaimed: {
    title: "Task Unclaimed",
    messageOwn: (name) => `You unclaimed "${name}"`,
    messageOther: (actor, name) => `${actor} unclaimed "${name}"`,
    variant: "info",
  },
  schedule_created: {
    title: "Event Added",
    messageOwn: (name) => `You added "${name}" to schedule`,
    messageOther: (actor, name) => `${actor} added "${name}" to schedule`,
    variant: "success",
  },
  schedule_updated: {
    title: "Event Updated",
    messageOwn: (name) => `You updated "${name}"`,
    messageOther: (actor, name) => `${actor} updated "${name}"`,
    variant: "info",
  },
  model_request_created: {
    title: "Model Request",
    messageOwn: (name) => `You submitted "${name}"`,
    messageOther: (actor, name) => `${actor} submitted "${name}"`,
    variant: "info",
  },
  model_request_accepted: {
    title: "Request Accepted",
    messageOwn: (name) => `You accepted "${name}"`,
    messageOther: (actor, name) => `${actor} accepted "${name}"`,
    variant: "success",
  },
  model_request_denied: {
    title: "Request Denied",
    messageOwn: (name) => `You denied "${name}"`,
    messageOther: (actor, name) => `${actor} denied "${name}"`,
    variant: "warning",
  },
  feature_request_created: {
    title: "Feature Request",
    messageOwn: (name) => `You submitted "${name}"`,
    messageOther: (actor, name) => `${actor} submitted "${name}"`,
    variant: "info",
  },
  feature_request_accepted: {
    title: "Request Accepted",
    messageOwn: (name) => `You accepted "${name}"`,
    messageOther: (actor, name) => `${actor} accepted "${name}"`,
    variant: "success",
  },
  feature_request_denied: {
    title: "Request Denied",
    messageOwn: (name) => `You denied "${name}"`,
    messageOther: (actor, name) => `${actor} denied "${name}"`,
    variant: "warning",
  },
  comment_created: {
    title: "New Comment",
    messageOwn: (name) => `You commented on "${name}"`,
    messageOther: (actor, name) => `${actor} commented on "${name}"`,
    variant: "info",
  },
};

export function createNotificationConfig(
  type: NotificationType,
  itemName: string,
  actorName: string,
  isOwnAction: boolean
): Omit<Notification, "id" | "timestamp"> {
  const config = notificationConfigs[type];
  return {
    type,
    variant: config.variant,
    title: config.title,
    message: isOwnAction
      ? config.messageOwn(itemName)
      : config.messageOther(actorName, itemName),
    isOwnAction,
    actorName,
    itemName,
    duration: 8000,
  };
}
