import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";
import type { GoalStatus } from "@/types/database";

interface CreateGoalData {
  name: string;
  description?: string;
  priority?: string;
  target_date?: string;
}

interface UpdateGoalData {
  id: string;
  name?: string;
  description?: string;
  status?: GoalStatus;
  priority?: string;
  target_date?: string;
}

export function useGoalMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const createGoal = useMutation({
    mutationFn: async (data: CreateGoalData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: goal, error } = await supabase
        .from("goals")
        .insert({
          name: data.name,
          description: data.description || null,
          priority: data.priority || null,
          target_date: data.target_date || null,
          status: "active",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return goal;
    },
    onSuccess: (goal) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      addNotification(
        createNotificationConfig(
          "goal_created",
          goal.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  const updateGoal = useMutation({
    mutationFn: async ({ id, ...data }: UpdateGoalData) => {
      if (!user) throw new Error("Not authenticated");

      const updateData: Record<string, unknown> = { ...data };
      const isCompletingGoal = data.status === "completed";

      // Set timestamps based on status changes
      if (isCompletingGoal) {
        updateData.completed_at = new Date().toISOString();

        // Delete all completed tasks associated with this goal
        const { error: deleteError } = await supabase
          .from("assets")
          .delete()
          .eq("goal_id", id)
          .eq("status", "completed");

        if (deleteError) throw deleteError;
      }

      const { data: goal, error } = await supabase
        .from("goals")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return { goal, isCompletingGoal };
    },
    onSuccess: ({ goal, isCompletingGoal }) => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });

      if (isCompletingGoal) {
        addNotification(
          createNotificationConfig(
            "goal_completed",
            goal.name,
            profile?.display_name || profile?.email || "You",
            true
          )
        );
      }
    },
  });

  const deleteGoal = useMutation({
    mutationFn: async (id: string) => {
      // First, clear goal_id from all assets that belong to this goal
      const { error: assetError } = await supabase
        .from("assets")
        .update({ goal_id: null })
        .eq("goal_id", id);

      if (assetError) throw assetError;

      // Goal_tasks and task_dependencies will cascade delete
      const { error } = await supabase
        .from("goals")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
      queryClient.invalidateQueries({ queryKey: ["goals_for_task"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["inbox_count"] });
    },
  });

  // Add a task to a goal
  const addTaskToGoal = useMutation({
    mutationFn: async ({ goalId, assetId, orderIndex }: { goalId: string; assetId: string; orderIndex?: number }) => {
      // Get current max order_index if not provided
      let order = orderIndex;
      if (order === undefined) {
        const { data: existing } = await supabase
          .from("goal_tasks")
          .select("order_index")
          .eq("goal_id", goalId)
          .order("order_index", { ascending: false })
          .limit(1);

        order = existing && existing.length > 0 ? existing[0].order_index + 1 : 0;
      }

      // Insert into goal_tasks junction table
      const { data, error } = await supabase
        .from("goal_tasks")
        .insert({
          goal_id: goalId,
          asset_id: assetId,
          order_index: order,
        })
        .select()
        .single();

      if (error) throw error;

      // Also update the asset's goal_id directly for simpler queries
      const { error: assetError } = await supabase
        .from("assets")
        .update({ goal_id: goalId })
        .eq("id", assetId);

      if (assetError) throw assetError;

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goals_for_task", variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ["inbox_count"] });
    },
  });

  // Remove a task from a goal
  const removeTaskFromGoal = useMutation({
    mutationFn: async ({ goalId, assetId }: { goalId: string; assetId: string }) => {
      const { error } = await supabase
        .from("goal_tasks")
        .delete()
        .eq("goal_id", goalId)
        .eq("asset_id", assetId);

      if (error) throw error;

      // Also clear the asset's goal_id
      const { error: assetError } = await supabase
        .from("assets")
        .update({ goal_id: null })
        .eq("id", assetId);

      if (assetError) throw assetError;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] });
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["goals_for_task", variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      queryClient.invalidateQueries({ queryKey: ["asset", variables.assetId] });
      queryClient.invalidateQueries({ queryKey: ["inbox_count"] });
    },
  });

  // Reorder tasks in a goal
  const reorderGoalTasks = useMutation({
    mutationFn: async ({ goalId, taskOrders }: { goalId: string; taskOrders: { assetId: string; orderIndex: number }[] }) => {
      // Update each task's order_index
      for (const { assetId, orderIndex } of taskOrders) {
        const { error } = await supabase
          .from("goal_tasks")
          .update({ order_index: orderIndex })
          .eq("goal_id", goalId)
          .eq("asset_id", assetId);

        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] });
    },
  });

  return {
    createGoal,
    updateGoal,
    deleteGoal,
    addTaskToGoal,
    removeTaskFromGoal,
    reorderGoalTasks,
  };
}
