import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Guide, Profile } from "@/types/database";

export type GuideWithCreator = Guide & {
  creator: Pick<Profile, "display_name" | "email"> | null;
};

export interface UseGuidesOptions {
  category?: string;
  searchQuery?: string;
}

export function useGuides(options?: UseGuidesOptions) {
  const { category, searchQuery } = options || {};

  return useQuery({
    queryKey: ["guides", category, searchQuery],
    queryFn: async (): Promise<GuideWithCreator[]> => {
      let query = supabase
        .from("guides")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .eq("is_published", true)
        .order("created_at", { ascending: false });

      if (category) {
        query = query.eq("category", category);
      }

      if (searchQuery) {
        query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as GuideWithCreator[];
    },
  });
}

export function useGuide(id: string | undefined) {
  return useQuery({
    queryKey: ["guide", id],
    queryFn: async (): Promise<GuideWithCreator | null> => {
      if (!id) return null;

      const { data, error } = await supabase
        .from("guides")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .eq("id", id)
        .single();

      if (error) throw error;

      // Increment view count (fire and forget)
      supabase
        .from("guides")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id)
        .then(() => {});

      return data as GuideWithCreator;
    },
    enabled: !!id,
  });
}

// Get all unique categories from guides
export function useGuideCategories() {
  return useQuery({
    queryKey: ["guide_categories"],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from("guides")
        .select("category")
        .eq("is_published", true)
        .not("category", "is", null);

      if (error) throw error;

      // Get unique categories
      const categories = [...new Set((data || []).map(g => g.category).filter(Boolean))] as string[];
      return categories.sort();
    },
  });
}

// Get guide by pipeline ID
export function useGuideForPipeline(pipelineId: string | undefined) {
  return useQuery({
    queryKey: ["guide_for_pipeline", pipelineId],
    queryFn: async (): Promise<GuideWithCreator | null> => {
      if (!pipelineId) return null;

      const { data, error } = await supabase
        .from("guides")
        .select(`
          *,
          creator:profiles!created_by(display_name, email)
        `)
        .eq("pipeline_id", pipelineId)
        .single();

      if (error) {
        if (error.code === "PGRST116") return null; // Not found
        throw error;
      }
      return data as GuideWithCreator;
    },
    enabled: !!pipelineId,
  });
}
