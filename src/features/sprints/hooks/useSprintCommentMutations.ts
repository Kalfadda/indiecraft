import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface CreateSprintCommentData {
  sprint_id: string;
  content: string;
}

export function useSprintCommentMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const createComment = useMutation({
    mutationFn: async (data: CreateSprintCommentData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          sprint_id: data.sprint_id,
          content: data.content,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sprint-comments", variables.sprint_id] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId, sprintId }: { commentId: string; sprintId: string }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { commentId, sprintId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["sprint-comments", variables.sprintId] });
    },
  });

  return {
    createComment,
    deleteComment,
  };
}
