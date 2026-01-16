import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Comment, Profile } from "@/types/database";

export type CommentWithAuthor = Comment & {
  author: Pick<Profile, "display_name" | "email"> | null;
};

export function useComments(assetId: string | undefined) {
  return useQuery({
    queryKey: ["comments", assetId],
    queryFn: async (): Promise<CommentWithAuthor[]> => {
      if (!assetId) return [];

      const { data, error } = await supabase
        .from("comments")
        .select(
          `
          *,
          author:profiles!created_by(display_name, email)
        `
        )
        .eq("asset_id", assetId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return (data || []) as CommentWithAuthor[];
    },
    enabled: !!assetId,
  });
}
