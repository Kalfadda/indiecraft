import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
  NotificationType,
} from "@/stores/notificationStore";

export function useAssetRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const channel = supabase
      .channel("assets-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "assets",
        },
        async (payload) => {
          // Always invalidate queries
          queryClient.invalidateQueries({ queryKey: ["assets"] });

          // Skip notifications if no user is logged in
          if (!user) return;

          const newRecord = payload.new as Record<string, unknown>;
          const oldRecord = payload.old as Record<string, unknown>;

          // Determine what happened and who did it
          let actorId: string | null = null;
          let notificationType: NotificationType | null = null;

          if (payload.eventType === "INSERT") {
            actorId = newRecord.created_by as string;
            notificationType = "task_created";
          } else if (payload.eventType === "UPDATE") {
            // Determine what changed
            const oldStatus = oldRecord.status;
            const newStatus = newRecord.status;

            if (oldStatus !== newStatus) {
              if (newStatus === "completed") {
                actorId = newRecord.completed_by as string;
                notificationType = "task_completed";
              } else if (newStatus === "in_progress") {
                actorId = newRecord.in_progress_by as string;
                notificationType = "task_in_progress";
              }
            } else if (oldRecord.claimed_by !== newRecord.claimed_by) {
              if (newRecord.claimed_by) {
                actorId = newRecord.claimed_by as string;
                notificationType = "task_claimed";
              } else {
                // Task was unclaimed - skip notification for unclaims from others
                return;
              }
            }
          }

          // Skip if this was the current user's action (they already got a local notification)
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

          const itemName = (newRecord.name as string) || "a task";

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
