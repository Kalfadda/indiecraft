import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import type { GuideContent } from "@/types/database";

interface CreateGuideData {
  pipelineId?: string;
  title: string;
  description?: string;
  content: GuideContent;
  category?: string;
  tags?: string[];
}

interface UpdateGuideData {
  id: string;
  title?: string;
  description?: string;
  content?: GuideContent;
  category?: string;
  tags?: string[];
  is_published?: boolean;
}

export function useGuideMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const createGuide = useMutation({
    mutationFn: async (data: CreateGuideData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: guide, error } = await supabase
        .from("guides")
        .insert({
          pipeline_id: data.pipelineId || null,
          title: data.title,
          description: data.description || null,
          content: data.content,
          category: data.category || null,
          tags: data.tags || null,
          created_by: user.id,
          is_published: true,
        })
        .select()
        .single();

      if (error) throw error;

      // If created from a pipeline, mark pipeline as finalized
      if (data.pipelineId) {
        await supabase
          .from("pipelines")
          .update({
            status: "finalized",
            finalized_at: new Date().toISOString(),
          })
          .eq("id", data.pipelineId);
      }

      return guide;
    },
    onSuccess: (guide) => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      queryClient.invalidateQueries({ queryKey: ["guide_categories"] });
      if (guide.pipeline_id) {
        queryClient.invalidateQueries({ queryKey: ["pipeline", guide.pipeline_id] });
        queryClient.invalidateQueries({ queryKey: ["pipelines"] });
        queryClient.invalidateQueries({ queryKey: ["guide_for_pipeline", guide.pipeline_id] });
      }
    },
  });

  const updateGuide = useMutation({
    mutationFn: async ({ id, ...data }: UpdateGuideData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: guide, error } = await supabase
        .from("guides")
        .update(data)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return guide;
    },
    onSuccess: (guide) => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      queryClient.invalidateQueries({ queryKey: ["guide", guide.id] });
      queryClient.invalidateQueries({ queryKey: ["guide_categories"] });
    },
  });

  const deleteGuide = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("guides")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["guides"] });
      queryClient.invalidateQueries({ queryKey: ["guide_categories"] });
      queryClient.invalidateQueries({ queryKey: ["guide_for_pipeline"] });
    },
  });

  return {
    createGuide,
    updateGuide,
    deleteGuide,
  };
}
