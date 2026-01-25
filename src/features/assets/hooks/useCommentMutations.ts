import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface CreateCommentData {
  asset_id: string;
  content: string;
}

export function useCommentMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const createComment = useMutation({
    mutationFn: async (data: CreateCommentData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: comment, error } = await supabase
        .from("comments")
        .insert({
          asset_id: data.asset_id,
          content: data.content,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return comment;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.asset_id] });
    },
  });

  const deleteComment = useMutation({
    mutationFn: async ({ commentId, assetId }: { commentId: string; assetId: string }) => {
      const { error } = await supabase
        .from("comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;
      return { commentId, assetId };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["comments", variables.assetId] });
    },
  });

  return {
    createComment,
    deleteComment,
  };
}
