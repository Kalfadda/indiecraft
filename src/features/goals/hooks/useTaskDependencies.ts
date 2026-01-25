import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { TaskDependency, Asset } from "@/types/database";

export type DependencyWithTask = TaskDependency & {
  dependency_task: Pick<Asset, "id" | "name" | "status" | "category"> | null;
  dependent_task: Pick<Asset, "id" | "name" | "status" | "category"> | null;
};

// Get all dependencies for a specific task (what it depends on)
export function useTaskDependencies(assetId: string | undefined) {
  return useQuery({
    queryKey: ["task_dependencies", assetId],
    queryFn: async (): Promise<DependencyWithTask[]> => {
      if (!assetId) return [];

      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          dependency_task:assets!dependency_task_id(id, name, status, category),
          dependent_task:assets!dependent_task_id(id, name, status, category)
        `)
        .eq("dependent_task_id", assetId);

      if (error) throw error;
      return (data || []) as DependencyWithTask[];
    },
    enabled: !!assetId,
  });
}

// Get what depends on this task (blockers)
export function useTaskDependents(assetId: string | undefined) {
  return useQuery({
    queryKey: ["task_dependents", assetId],
    queryFn: async (): Promise<DependencyWithTask[]> => {
      if (!assetId) return [];

      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          dependency_task:assets!dependency_task_id(id, name, status, category),
          dependent_task:assets!dependent_task_id(id, name, status, category)
        `)
        .eq("dependency_task_id", assetId);

      if (error) throw error;
      return (data || []) as DependencyWithTask[];
    },
    enabled: !!assetId,
  });
}

// Get all dependencies for a goal
export function useGoalDependencies(goalId: string | undefined) {
  return useQuery({
    queryKey: ["goal_dependencies", goalId],
    queryFn: async (): Promise<DependencyWithTask[]> => {
      if (!goalId) return [];

      const { data, error } = await supabase
        .from("task_dependencies")
        .select(`
          *,
          dependency_task:assets!dependency_task_id(id, name, status, category),
          dependent_task:assets!dependent_task_id(id, name, status, category)
        `)
        .eq("goal_id", goalId);

      if (error) throw error;
      return (data || []) as DependencyWithTask[];
    },
    enabled: !!goalId,
  });
}

// Check if all dependencies are met for a task
export function useCanStartTask(assetId: string | undefined) {
  const { data: dependencies } = useTaskDependencies(assetId);

  const allDependenciesMet = dependencies?.every(dep => {
    const status = dep.dependency_task?.status;
    return status === "completed";
  }) ?? true;

  const unmetDependencies = dependencies?.filter(dep => {
    const status = dep.dependency_task?.status;
    return status !== "completed";
  }) ?? [];

  return {
    canStart: allDependenciesMet,
    unmetDependencies,
    dependencies: dependencies ?? [],
  };
}

export function useTaskDependencyMutations() {
  const queryClient = useQueryClient();

  const addDependency = useMutation({
    mutationFn: async ({
      dependentTaskId,
      dependencyTaskId,
      goalId,
    }: {
      dependentTaskId: string;
      dependencyTaskId: string;
      goalId?: string;
    }) => {
      const { data, error } = await supabase
        .from("task_dependencies")
        .insert({
          dependent_task_id: dependentTaskId,
          dependency_task_id: dependencyTaskId,
          goal_id: goalId || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task_dependencies", variables.dependentTaskId] });
      queryClient.invalidateQueries({ queryKey: ["task_dependents", variables.dependencyTaskId] });
      if (variables.goalId) {
        queryClient.invalidateQueries({ queryKey: ["goal_dependencies", variables.goalId] });
        queryClient.invalidateQueries({ queryKey: ["goal", variables.goalId] });
      }
    },
  });

  const removeDependency = useMutation({
    mutationFn: async ({
      dependentTaskId,
      dependencyTaskId,
    }: {
      dependentTaskId: string;
      dependencyTaskId: string;
    }) => {
      const { error } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("dependent_task_id", dependentTaskId)
        .eq("dependency_task_id", dependencyTaskId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["task_dependencies", variables.dependentTaskId] });
      queryClient.invalidateQueries({ queryKey: ["task_dependents", variables.dependencyTaskId] });
      queryClient.invalidateQueries({ queryKey: ["goal_dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  const removeDependencyById = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("task_dependencies")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task_dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["task_dependents"] });
      queryClient.invalidateQueries({ queryKey: ["goal_dependencies"] });
      queryClient.invalidateQueries({ queryKey: ["goal"] });
    },
  });

  return {
    addDependency,
    removeDependency,
    removeDependencyById,
  };
}
