import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Comment, Profile } from "@/types/database";

export type SprintCommentWithAuthor = Comment & {
  author: Pick<Profile, "display_name" | "email"> | null;
};

export function useSprintComments(sprintId: string | undefined) {
  return useQuery({
    queryKey: ["sprint-comments", sprintId],
    queryFn: async (): Promise<SprintCommentWithAuthor[]> => {
      if (!sprintId) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          author:profiles!created_by(display_name, email)
        `
        )
        .eq("sprint_id", sprintId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as SprintCommentWithAuthor[];
    },
    enabled: !!sprintId,
  });
}
