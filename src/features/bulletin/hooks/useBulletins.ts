import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Bulletin, Profile } from "@/types/database";

export type BulletinWithCreator = Bulletin & {
  creator: Pick<Profile, "display_name" | "email"> | null;
};

export function useBulletins() {
  return useQuery({
    queryKey: ["bulletins"],
    queryFn: async (): Promise<BulletinWithCreator[]> => {
      const { data, error } = await supabase
        .from("bulletins")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as BulletinWithCreator[];
    },
  });
}
