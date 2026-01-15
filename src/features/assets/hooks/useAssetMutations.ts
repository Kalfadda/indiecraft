import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { AssetCategory, AssetPriority, AssetStatus } from "@/types/database";

interface CreateAssetData {
  name: string;
  blurb: string;
  category?: AssetCategory | null;
  priority?: AssetPriority | null;
  eta_date?: string | null;
}

export function useAssetMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

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
    onSuccess: () => {
      console.log("Asset created successfully");
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
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
      return asset;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  // Move task to implemented status (from completed)
  const markAsImplemented = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "implemented",
          implemented_by: user.id,
          implemented_at: new Date().toISOString(),
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

  // Move task back to pending (from in_progress, completed or implemented)
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
          implemented_by: null,
          implemented_at: null,
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
          implemented_by: null,
          implemented_at: null,
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
    },
  });

  // Move task back to completed (from implemented)
  const moveToCompleted = useMutation({
    mutationFn: async (id: string) => {
      if (!user) throw new Error("Not authenticated");

      const { data: asset, error } = await supabase
        .from("assets")
        .update({
          status: "completed",
          implemented_by: null,
          implemented_at: null,
          // Keep completed_by and completed_at if they exist
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

      // Then delete the asset
      const { error } = await supabase.from("assets").delete().eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["events"] });
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
      queryClient.invalidateQueries({ queryKey: ["feature_requests"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["assets"] });
    },
  });

  return {
    createAsset,
    updateAsset,
    markAsInProgress,
    markAsCompleted,
    markAsImplemented,
    moveToPending,
    moveToInProgress,
    moveToCompleted,
    deleteAsset,
    claimAsset,
    unclaimAsset,
    checkLinkedEvent,
  };
}
