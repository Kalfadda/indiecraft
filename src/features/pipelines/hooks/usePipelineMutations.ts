import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";
import type { PipelineStatus } from "@/types/database";

interface CreatePipelineData {
  name: string;
  description?: string;
}

interface UpdatePipelineData {
  id: string;
  name?: string;
  description?: string;
  status?: PipelineStatus;
}

export function usePipelineMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const createPipeline = useMutation({
    mutationFn: async (data: CreatePipelineData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: pipeline, error } = await supabase
        .from("pipelines")
        .insert({
          name: data.name,
          description: data.description || null,
          status: "active",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return pipeline;
    },
    onSuccess: (pipeline) => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      addNotification(
        createNotificationConfig(
          "task_created",
          pipeline.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  const updatePipeline = useMutation({
    mutationFn: async ({ id, ...data }: UpdatePipelineData) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = { ...data };

      // Set timestamps based on status changes
      if (data.status === "completed") {
        updateData.completed_at = new Date().toISOString();
      } else if (data.status === "finalized") {
        updateData.finalized_at = new Date().toISOString();
      }

      const { data: pipeline, error } = await supabase
        .from("pipelines")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return pipeline;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
    },
  });

  const deletePipeline = useMutation({
    mutationFn: async (id: string) => {
      // Pipeline_tasks and task_dependencies will cascade delete
      const { error } = await supabase
        .from("pipelines")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["pipeline"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines_for_task"] });
    },
  });

  // Add a task to a pipeline
  const addTaskToPipeline = useMutation({
    mutationFn: async ({ pipelineId, assetId, orderIndex }: { pipelineId: string; assetId: string; orderIndex?: number }) => {
      // Get current max order_index if not provided
      let order = orderIndex;
      if (order === undefined) {
        const { data: existing } = await supabase
          .from("pipeline_tasks")
          .select("order_index")
          .eq("pipeline_id", pipelineId)
          .order("order_index", { ascending: false })
          .limit(1);

        order = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
      }

      const { data, error } = await supabase
        .from("pipeline_tasks")
        .insert({
          pipeline_id: pipelineId,
          asset_id: assetId,
          order_index: order,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines_for_task", variables.assetId] });
    },
  });

  // Remove a task from a pipeline
  const removeTaskFromPipeline = useMutation({
    mutationFn: async ({ pipelineId, assetId }: { pipelineId: string; assetId: string }) => {
      const { error } = await supabase
        .from("pipeline_tasks")
        .delete()
        .eq("pipeline_id", pipelineId)
        .eq("asset_id", assetId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", variables.pipelineId] });
      queryClient.invalidateQueries({ queryKey: ["pipelines"] });
      queryClient.invalidateQueries({ queryKey: ["pipelines_for_task", variables.assetId] });
    },
  });

  // Reorder tasks in a pipeline
  const reorderPipelineTasks = useMutation({
    mutationFn: async ({ pipelineId, taskOrders }: { pipelineId: string; taskOrders: { assetId: string; orderIndex: number }[] }) => {
      // Update each task's order_index
      for (const { assetId, orderIndex } of taskOrders) {
        const { error } = await supabase
          .from("pipeline_tasks")
          .update({ order_index: orderIndex })
          .eq("pipeline_id", pipelineId)
          .eq("asset_id", assetId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["pipeline", variables.pipelineId] });
    },
  });

  return {
    createPipeline,
    updatePipeline,
    deletePipeline,
    addTaskToPipeline,
    removeTaskFromPipeline,
    reorderPipelineTasks,
  };
}
