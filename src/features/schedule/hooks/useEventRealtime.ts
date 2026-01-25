import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";

export function useEventRealtime() {
  const queryClient = useQueryClient();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    const channel = supabase
      .channel("events-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
        },
        async (payload) => {
          // Always invalidate queries
          queryClient.invalidateQueries({ queryKey: ["events"] });

          // Skip notifications if no user is logged in
          if (!user) return;

          const newRecord = payload.new as Record<string, unknown>;

          // Skip DELETE events
          if (payload.eventType === "DELETE") return;

          const actorId = newRecord.created_by as string;

          // Skip if this was the current user's action
          if (!actorId || actorId === user.id) return;

          const notificationType =
            payload.eventType === "INSERT" ? "schedule_created" : "schedule_updated";

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

          const itemName = (newRecord.title as string) || "an event";

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
