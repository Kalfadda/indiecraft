import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Goal, GoalStatus, Profile, Asset } from "@/types/database";

export type GoalWithCreator = Goal & {
  creator: Pick<Profile, "display_name" | "email"> | null;
  task_count?: number;
  completed_task_count?: number;
};

export type GoalWithDetails = GoalWithCreator & {
  tasks: (Asset & {
    creator: Pick<Profile, "display_name" | "email"> | null;
  })[];
  task_count: number;
  completed_task_count: number;
};

export interface UseGoalsOptions {
  status?: GoalStatus;
}

export function useGoals(options?: UseGoalsOptions) {
  const { status } = options || {};

  return useQuery({
    queryKey: ["goals", status],
    queryFn: async (): Promise<GoalWithCreator[]> => {
      let query = supabase
        .from("goals")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `);

      if (status) {
        query = query.eq("status", status);
      }

      const { data: goals, error } = await query;
      if (error) throw error;
      if (!goals || goals.length === 0) return [];

      // Fetch task counts for all goals
      const goalIds = goals.map(g => g.id);
      const { data: taskCounts } = await supabase
        .from("assets")
        .select("goal_id, status")
        .in("goal_id", goalIds);

      // Calculate counts per goal
      const countsMap = new Map<string, { total: number; completed: number }>();
      goalIds.forEach(id => countsMap.set(id, { total: 0, completed: 0 }));

      (taskCounts || []).forEach(task => {
        if (task.goal_id) {
          const counts = countsMap.get(task.goal_id)!;
          counts.total++;
          if (task.status === "completed") {
            counts.completed++;
          }
        }
      });

      // Enrich goals with counts
      const enrichedGoals = goals.map(goal => ({
        ...goal,
        task_count: countsMap.get(goal.id)?.total || 0,
        completed_task_count: countsMap.get(goal.id)?.completed || 0,
      })) as GoalWithCreator[];

      // Smart sort: prioritize goals close to completion, empty goals last
      return enrichedGoals.sort((a, b) => {
        const aTotal = a.task_count || 0;
        const bTotal = b.task_count || 0;
        const aCompleted = a.completed_task_count || 0;
        const bCompleted = b.completed_task_count || 0;

        // Empty goals go to the bottom
        if (aTotal === 0 && bTotal > 0) return 1;
        if (bTotal === 0 && aTotal > 0) return -1;
        if (aTotal === 0 && bTotal === 0) {
          // Both empty: sort by created_at descending
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }

        const aPercent = aTotal > 0 ? aCompleted / aTotal : 0;
        const bPercent = bTotal > 0 ? bCompleted / bTotal : 0;

        // Goals at 100% (ready to be marked complete) float to top
        if (aPercent === 1 && bPercent < 1) return -1;
        if (bPercent === 1 && aPercent < 1) return 1;

        // Goals close to completion (80%+) get priority boost
        const aCloseToFinish = aPercent >= 0.8;
        const bCloseToFinish = bPercent >= 0.8;
        if (aCloseToFinish && !bCloseToFinish) return -1;
        if (bCloseToFinish && !aCloseToFinish) return 1;

        // Within same tier, sort by percentage descending
        if (aPercent !== bPercent) return bPercent - aPercent;

        // Same percentage: sort by total tasks (larger goals first)
        return bTotal - aTotal;
      });
    },
  });
}

export function useGoal(id: string | undefined) {
  return useQuery({
    queryKey: ["goal", id],
    queryFn: async (): Promise<GoalWithDetails | null> => {
      if (!id) return null;

      // Get the goal with creator
      const { data: goal, error: goalError } = await supabase
        .from("goals")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .eq("id", id)
        .single();

      if (goalError) throw goalError;

      // Get goal tasks with their assets
      const { data: goalTasks, error: tasksError } = await supabase
        .from("goal_tasks")
        .select(`
          asset_id,
          order_index,
          notes
        `)
        .eq("goal_id", id)
        .order("order_index", { ascending: true });

      if (tasksError) throw tasksError;

      // Get the actual assets
      const assetIds = (goalTasks || []).map(pt => pt.asset_id);
      let tasks: (Asset & { creator: Pick<Profile, "display_name" | "email"> | null })[] = [];

      if (assetIds.length > 0) {
        const { data: assets, error: assetsError } = await supabase
          .from("assets")
          .select(`
            *,
            creator:profiles!created_by(display_name, email)
          `)
          .in("id", assetIds);

        if (assetsError) throw assetsError;

        // Sort assets by order_index from goal_tasks
        const orderMap = new Map(goalTasks?.map(pt => [pt.asset_id, pt.order_index]));
        tasks = ((assets || []) as (Asset & { creator: Pick<Profile, "display_name" | "email"> | null })[])
          .sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      }

      // Count only completed tasks for goal completion
      const completedCount = tasks.filter(t => t.status === "completed").length;

      return {
        ...(goal as GoalWithCreator),
        tasks,
        task_count: tasks.length,
        completed_task_count: completedCount,
      };
    },
    enabled: !!id,
  });
}

// Get goals that a specific task belongs to
export function useGoalsForTask(assetId: string | undefined) {
  return useQuery({
    queryKey: ["goals_for_task", assetId],
    queryFn: async (): Promise<Goal[]> => {
      if (!assetId) return [];

      const { data: goalTasks, error: ptError } = await supabase
        .from("goal_tasks")
        .select("goal_id")
        .eq("asset_id", assetId);

      if (ptError) throw ptError;

      const goalIds = (goalTasks || []).map(pt => pt.goal_id);
      if (goalIds.length === 0) return [];

      const { data: goals, error } = await supabase
        .from("goals")
        .select("*")
        .in("id", goalIds);

      if (error) throw error;
      return (goals || []) as Goal[];
    },
    enabled: !!assetId,
  });
}

// Get the inbox task count (tasks without a goal, excluding completed)
export function useInboxCount() {
  return useQuery({
    queryKey: ["inbox_count"],
    queryFn: async (): Promise<number> => {
      const { count, error } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .is("goal_id", null)
        .neq("status", "completed");

      if (error) throw error;
      return count || 0;
    },
  });
}
