import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface CreateGoalCommentData {
  goal_id: string;
  content: string;
}

export function useGoalCommentMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const createComment = useMutation({
    mutationFn: async (data: CreateGoalCommentData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          goal_id: data.goal_id,
          content: data.content,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal-comments", variables.goal_id] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId, goalId }: { commentId: string; goalId: string }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { commentId, goalId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["goal-comments", variables.goalId] });
    },
  });

  return {
    createComment,
    deleteComment,
  };
}
