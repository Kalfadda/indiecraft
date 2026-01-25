import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Comment, Profile } from "@/types/database";

export type GoalCommentWithAuthor = Comment & {
  author: Pick<Profile, "display_name" | "email"> | null;
};

export function useGoalComments(goalId: string | undefined) {
  return useQuery({
    queryKey: ["goal-comments", goalId],
    queryFn: async (): Promise<GoalCommentWithAuthor[]> => {
      if (!goalId) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          author:profiles!created_by(display_name, email)
        `
        )
        .eq("goal_id", goalId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as GoalCommentWithAuthor[];
    },
    enabled: !!goalId,
  });
}
