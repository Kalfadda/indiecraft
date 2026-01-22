import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";
import type { AssetCategory, AssetPriority, AssetStatus } from "@/types/database";

interface CreateAssetData {
  name: string;
  blurb: string;
  category?: AssetCategory | null;
  priority?: AssetPriority | null;
  eta_date?: string | null;
  goal_id?: string | null;
}

export function useAssetMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const createAsset = useMutation({
    mutationFn: async (data: CreateAssetData) => {
      console.log("Creating asset...", data);
      if (!user) {
        console.error("No user found");
        throw new Error("Not authenticated");
      }

      console.log("User ID:", user.id);
      const { data: asset, error } = await supabase
        .from("assets")
        .insert({
          name: data.name,
          blurb: data.blurb,
          category: data.category || null,
          priority: data.priority || null,
          eta_date: data.eta_date || null,
          goal_id: data.goal_id || null,
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();

      console.log("Insert result:", { asset, error });
      if (error) {
        console.error("Insert error:", error);
        throw error;
      }

      // If ETA date is set, auto-create a deliverable event
      if (data.eta_date && asset) {
        const { error: eventError } = await supabase
          .from("events")
          .insert({
            type: "deliverable",
            title: data.name,
            description: data.blurb || `Task due: ${data.eta_date}`,
            event_date: data.eta_date,
            linked_asset_id: asset.id,
            auto_create_task: false,
            created_by: user.id,
          });

        if (eventError) {
          console.warn("Failed to create linked deliverable:", eventError);
        }
      }

      return asset;
    },
    onSuccess: (asset) => {
      console.log("Asset created successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_count"] });
      addNotification(
        createNotificationConfig(
          "task_created",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
    onError: (error) => {
      console.error("Mutation error:", error);
    },
  });

  const updateAsset = useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      name?: string;
      blurb?: string;
      status?: AssetStatus;
      category?: AssetCategory | null;
      priority?: AssetPriority | null;
      eta_date?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");

      // First get the current asset to check for eta_date changes
      const { data: currentAsset, error: fetchError } = await supabase
        .from("assets")
        .select("*")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      const { data: asset, error } = await supabase
        .from("assets")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Handle ETA date changes
      if (data.eta_date !== undefined) {
        // Check if there's an existing linked deliverable
        const { data: existingEvent } = await supabase
          .from("events")
          .select("*")
          .eq("linked_asset_id", id)
          .eq("type", "deliverable")
          .single();

        if (data.eta_date && !existingEvent) {
          // Create new deliverable if ETA is set and no linked event exists
          await supabase.from("events").insert({
            type: "deliverable",
            title: data.name || currentAsset.name,
            description: data.blurb || currentAsset.blurb || `Task due: ${data.eta_date}`,
            event_date: data.eta_date,
            linked_asset_id: id,
            auto_create_task: false,
            created_by: user.id,
          });
        } else if (data.eta_date && existingEvent) {
          // Update existing deliverable date
          await supabase
            .from("events")
            .update({ event_date: data.eta_date })
            .eq("id", existingEvent.id);
        } else if (!data.eta_date && existingEvent) {
          // Remove deliverable if ETA is cleared
          await supabase.from("events").delete().eq("id", existingEvent.id);
        }
      }

      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
    },
  });

  // Move task to in_progress status (auto-claims the task)
  const markAsInProgress = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "in_progress",
          in_progress_by: user.id,
          in_progress_at: new Date().toISOString(),
          // Auto-claim the task when moving to in_progress
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      addNotification(
        createNotificationConfig(
          "task_in_progress",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Move task to completed status
  const markAsCompleted = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "completed",
          completed_by: user.id,
          completed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      // Remove linked deliverable event when task is completed
      const { error: eventError } = await supabase
        .from("events")
        .delete()
        .eq("linked_asset_id", id)
        .eq("type", "deliverable");

      if (eventError) {
        console.warn("Failed to delete linked deliverable event:", eventError);
      }

      return asset;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      addNotification(
        createNotificationConfig(
          "task_completed",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Move task back to pending (from in_progress or completed)
  const moveToPending = useMutation({
    mutationFn: async (id: string) => {
      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "pending",
          in_progress_by: null,
          in_progress_at: null,
          completed_by: null,
          completed_at: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  // Move task back to in_progress (from completed)
  const moveToInProgress = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "in_progress",
          completed_by: null,
          completed_at: null,
          // Keep in_progress_by and in_progress_at if they exist
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  // Check if asset has a linked event (for warning dialog)
  const checkLinkedEvent = async (assetId: string) => {
    const { data: event } = await supabase
      .from("events")
      .select("id, title, type")
      .eq("linked_asset_id", assetId)
      .single();
    return event;
  };

  const deleteAsset = useMutation({
    mutationFn: async (id: string) => {
      // First, delete any events linked to this asset
      const { error: eventError } = await supabase
        .from("events")
        .delete()
        .eq("linked_asset_id", id);

      if (eventError) {
        console.warn("Failed to delete linked events:", eventError);
      }

      // Clear linked_asset_id from model_requests that reference this asset
      const { error: modelRequestError } = await supabase
        .from("model_requests")
        .update({ linked_asset_id: null })
        .eq("linked_asset_id", id);

      if (modelRequestError) {
        console.warn("Failed to unlink model requests:", modelRequestError);
      }

      // Clear linked_asset_id from feature_requests that reference this asset
      const { error: featureRequestError } = await supabase
        .from("feature_requests")
        .update({ linked_asset_id: null })
        .eq("linked_asset_id", id);

      if (featureRequestError) {
        console.warn("Failed to unlink feature requests:", featureRequestError);
      }

      // Remove task from goal_tasks junction table
      const { error: goalTaskError } = await supabase
        .from("goal_tasks")
        .delete()
        .eq("asset_id", id);

      if (goalTaskError) {
        console.warn("Failed to remove from goal_tasks:", goalTaskError);
      }

      // Then delete the asset
      const { error } = await supabase.from("assets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_count"] });
    },
  });

  // Claim a task
  const claimAsset = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          claimed_by: user.id,
          claimed_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "task_claimed",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Unclaim a task
  const unclaimAsset = useMutation({
    mutationFn: async (id: string) => {
      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          claimed_by: null,
          claimed_at: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "task_unclaimed",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Mark a task as blocked
  const markAsBlocked = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "blocked",
          blocked_by: user.id,
          blocked_at: new Date().toISOString(),
          blocked_reason: reason,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: (asset) => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "task_blocked",
          asset.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Unblock a task (move back to pending)
  const unblockAsset = useMutation({
    mutationFn: async (id: string) => {
      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "pending",
          blocked_by: null,
          blocked_at: null,
          blocked_reason: null,
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return {
    createAsset,
    updateAsset,
    markAsInProgress,
    markAsCompleted,
    markAsBlocked,
    moveToPending,
    moveToInProgress,
    unblockAsset,
    deleteAsset,
    claimAsset,
    unclaimAsset,
    checkLinkedEvent,
  };
}
