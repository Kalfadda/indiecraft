import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
  NotificationType,
} from "@/stores/notificationStore";

export function useRequestRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const channel = supabase
      .channel("model-requests-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "model_requests",
        },
        async (payload) => {
          // Always invalidate queries
          queryClient.invalidateQueries({ queryKey: ["model_requests"] });

          // Skip notifications if no user is logged in
          if (!user) return;

          const newRecord = payload.new as Record<string, unknown>;
          const oldRecord = payload.old as Record<string, unknown>;

          let actorId: string | null = null;
          let notificationType: NotificationType | null = null;

          if (payload.eventType === "INSERT") {
            actorId = newRecord.created_by as string;
            notificationType = "model_request_created";
          } else if (payload.eventType === "UPDATE") {
            const oldStatus = oldRecord.status;
            const newStatus = newRecord.status;

            if (oldStatus !== newStatus) {
              if (newStatus === "accepted") {
                actorId = newRecord.accepted_by as string;
                notificationType = "model_request_accepted";
              } else if (newStatus === "denied") {
                actorId = newRecord.denied_by as string;
                notificationType = "model_request_denied";
              }
            }
          }

          // Skip if this was the current user's action
          if (!actorId || actorId === user.id || !notificationType) return;

          // Fetch actor's profile for display name
          const { data: actorProfile } = await supabase
            .from("profiles")
            .select("display_name, email")
            .eq("id", actorId)
            .single();

          const actorName =
            actorProfile?.display_name ||
            actorProfile?.email?.split("@")[0] ||
            "Someone";

          const itemName = (newRecord.name as string) || "a request";

          addNotification(
            createNotificationConfig(notificationType, itemName, actorName, false)
          );
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [queryClient, user, addNotification]);
}
