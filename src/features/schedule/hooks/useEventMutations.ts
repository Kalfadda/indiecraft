import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";
import type { EventType, EventVisibility, AssetCategory, AssetPriority } from "@/types/database";

interface CreateEventData {
  type: EventType;
  title: string;
  description?: string | null;
  event_date: string;
  event_time?: string | null;
  visibility?: EventVisibility | null;
  linked_asset_id?: string | null;
  auto_create_task?: boolean;
}

interface UpdateEventData {
  id: string;
  type?: EventType;
  title?: string;
  description?: string | null;
  event_date?: string;
  event_time?: string | null;
  visibility?: EventVisibility | null;
  linked_asset_id?: string | null;
  auto_create_task?: boolean;
}

interface CreateTaskFromDeliverableData {
  eventId: string;
  category?: AssetCategory | null;
  priority?: AssetPriority | null;
}

export function useEventMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const createEvent = useMutation({
    mutationFn: async (data: CreateEventData) => {
      console.log("Creating event...", data);
      if (!user) {
        console.error("No user found");
        throw new Error("Not authenticated");
      }

      console.log("User ID:", user.id);

      // If auto_create_task is true and type is deliverable, create the task first
      let linkedAssetId = data.linked_asset_id || null;

      if (data.auto_create_task && data.type === "deliverable") {
        console.log("Auto-creating task from deliverable...");
        const { data: asset, error: assetError } = await supabase
          .from("assets")
          .insert({
            name: data.title,
            blurb: data.description || `Deliverable due: ${data.event_date}`,
            status: "pending",
            category: null,
            priority: null,
            created_by: user.id,
          })
          .select()
          .single();

        if (assetError) {
          console.error("Failed to create task:", assetError);
          throw assetError;
        }

        console.log("Task created:", asset);
        linkedAssetId = asset.id;
      }

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          type: data.type,
          title: data.title,
          description: data.description || null,
          event_date: data.event_date,
          event_time: data.event_time || null,
          visibility: data.visibility || null,
          linked_asset_id: linkedAssetId,
          auto_create_task: data.auto_create_task ?? false,
          created_by: user.id,
        })
        .select()
        .single();

      console.log("Insert result:", { event, error });
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }
      return event;
    },
    onSuccess: (event) => {
      console.log("Event created successfully");
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "schedule_created",
          event.title,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  const updateEvent = useMutation({
    mutationFn: async ({ id, auto_create_task, ...data }: UpdateEventData) => {
      if (!user) throw new Error("Not authenticated");

      // First, fetch the current event to check its state
      const { data: currentEvent, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Determine the final type (use updated type or keep current)
      const finalType = data.type ?? currentEvent.type;

      // Check if we need to create a task:
      // - auto_create_task is being set to true
      // - The final type is deliverable
      // - No task is already linked
      let linkedAssetId = data.linked_asset_id;

      if (
        auto_create_task &&
        finalType === "deliverable" &&
        !currentEvent.linked_asset_id &&
        !data.linked_asset_id
      ) {
        console.log("Auto-creating task from deliverable update...");
        const { data: asset, error: assetError } = await supabase
          .from("assets")
          .insert({
            name: data.title ?? currentEvent.title,
            blurb: data.description ?? currentEvent.description ?? `Deliverable due: ${data.event_date ?? currentEvent.event_date}`,
            status: "pending",
            category: null,
            priority: null,
            created_by: user.id,
          })
          .select()
          .single();

        if (assetError) {
          console.error("Failed to create task:", assetError);
          throw assetError;
        }

        console.log("Task created:", asset);
        linkedAssetId = asset.id;
      }

      // Now update the event
      const { data: event, error } = await supabase
        .from("events")
        .update({
          ...data,
          auto_create_task: auto_create_task ?? currentEvent.auto_create_task,
          linked_asset_id: linkedAssetId ?? currentEvent.linked_asset_id,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return event;
    },
    onSuccess: (event) => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "schedule_updated",
          event.title,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Check if event has a linked task (for warning dialog)
  const checkLinkedTask = async (eventId: string) => {
    const { data: event } = await supabase
      .from("events")
      .select("linked_asset_id")
      .eq("id", eventId)
      .single();

    if (event?.linked_asset_id) {
      const { data: asset } = await supabase
        .from("assets")
        .select("id, name")
        .eq("id", event.linked_asset_id)
        .single();
      return asset;
    }
    return null;
  };

  const deleteEvent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("events").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Delete event and its linked task together
  const deleteEventWithLinkedTask = useMutation({
    mutationFn: async (eventId: string) => {
      // First get the linked asset id
      const { data: event } = await supabase
        .from("events")
        .select("linked_asset_id")
        .eq("id", eventId)
        .single();

      // Delete the event
      const { error: eventError } = await supabase
        .from("events")
        .delete()
        .eq("id", eventId);

      if (eventError) throw eventError;

      // Delete the linked task if it exists
      if (event?.linked_asset_id) {
        // First clear any other linked references
        await supabase
          .from("model_requests")
          .update({ linked_asset_id: null })
          .eq("linked_asset_id", event.linked_asset_id);

        await supabase
          .from("feature_requests")
          .update({ linked_asset_id: null })
          .eq("linked_asset_id", event.linked_asset_id);

        const { error: assetError } = await supabase
          .from("assets")
          .delete()
          .eq("id", event.linked_asset_id);

        if (assetError) throw assetError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  // Create a task in the assets table from a deliverable event
  const createTaskFromDeliverable = useMutation({
    mutationFn: async ({ eventId, category, priority }: CreateTaskFromDeliverableData) => {
      if (!user) throw new Error("Not authenticated");

      // First, fetch the event details
      const { data: event, error: fetchError } = await supabase
        .from("events")
        .select("*")
        .eq("id", eventId)
        .single();

      if (fetchError) throw fetchError;
      if (!event) throw new Error("Event not found");

      if (event.type !== "deliverable") {
        throw new Error("Can only create tasks from deliverable events");
      }

      // Create the asset/task from the deliverable
      const { data: asset, error: insertError } = await supabase
        .from("assets")
        .insert({
          name: event.title,
          blurb: event.description || `Deliverable due: ${event.event_date}`,
          status: "pending",
          category: category || null,
          priority: priority || null,
          created_by: user.id,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Optionally update the event to link to the created asset
      const { error: updateError } = await supabase
        .from("events")
        .update({ linked_asset_id: asset.id })
        .eq("id", eventId);

      if (updateError) {
        console.warn("Failed to link asset to event:", updateError);
      }

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return {
    createEvent,
    updateEvent,
    deleteEvent,
    deleteEventWithLinkedTask,
    createTaskFromDeliverable,
    checkLinkedTask,
  };
}
