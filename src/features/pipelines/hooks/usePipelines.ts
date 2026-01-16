import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Pipeline, PipelineStatus, Profile, Asset } from "@/types/database";

export type PipelineWithCreator = Pipeline & {
  creator: Pick<Profile, "display_name" | "email"> | null;
};

export type PipelineWithDetails = PipelineWithCreator & {
  tasks: (Asset & {
    creator: Pick<Profile, "display_name" | "email"> | null;
  })[];
  task_count: number;
  completed_task_count: number;
};

export interface UsePipelinesOptions {
  status?: PipelineStatus;
}

export function usePipelines(options?: UsePipelinesOptions) {
  const { status } = options || {};

  return useQuery({
    queryKey: ["pipelines", status],
    queryFn: async (): Promise<PipelineWithCreator[]> => {
      let query = supabase
        .from("pipelines")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as PipelineWithCreator[];
    },
  });
}

export function usePipeline(id: string | undefined) {
  return useQuery({
    queryKey: ["pipeline", id],
    queryFn: async (): Promise<PipelineWithDetails | null> => {
      if (!id) return null;

      // Get the pipeline with creator
      const { data: pipeline, error: pipelineError } = await supabase
        .from("pipelines")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .eq("id", id)
        .single();

      if (pipelineError) throw pipelineError;

      // Get pipeline tasks with their assets
      const { data: pipelineTasks, error: tasksError } = await supabase
        .from("pipeline_tasks")
        .select(`
          asset_id,
          order_index,
          notes
        `)
        .eq("pipeline_id", id)
        .order("order_index", { ascending: true });

      if (tasksError) throw tasksError;

      // Get the actual assets
      const assetIds = (pipelineTasks || []).map(pt => pt.asset_id);
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

        // Sort assets by order_index from pipeline_tasks
        const orderMap = new Map(pipelineTasks?.map(pt => [pt.asset_id, pt.order_index]));
        tasks = ((assets || []) as (Asset & { creator: Pick<Profile, "display_name" | "email"> | null })[])
          .sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0));
      }

      const completedCount = tasks.filter(t =>
        t.status === "completed" || t.status === "implemented"
      ).length;

      return {
        ...(pipeline as PipelineWithCreator),
        tasks,
        task_count: tasks.length,
        completed_task_count: completedCount,
      };
    },
    enabled: !!id,
  });
}

// Get pipelines that a specific task belongs to
export function usePipelinesForTask(assetId: string | undefined) {
  return useQuery({
    queryKey: ["pipelines_for_task", assetId],
    queryFn: async (): Promise<Pipeline[]> => {
      if (!assetId) return [];

      const { data: pipelineTasks, error: ptError } = await supabase
        .from("pipeline_tasks")
        .select("pipeline_id")
        .eq("asset_id", assetId);

      if (ptError) throw ptError;

      const pipelineIds = (pipelineTasks || []).map(pt => pt.pipeline_id);
      if (pipelineIds.length === 0) return [];

      const { data: pipelines, error } = await supabase
        .from("pipelines")
        .select("*")
        .in("id", pipelineIds);

      if (error) throw error;
      return (pipelines || []) as Pipeline[];
    },
    enabled: !!assetId,
  });
}
