import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";

interface CreateBulletinData {
  message: string;
  position_x?: number;
  position_y?: number;
  rotation?: number;
  color?: string;
}

// Random pastel colors for bulletin notes
const BULLETIN_COLORS = [
  "#fef3c7", // Amber light
  "#dbeafe", // Blue light
  "#dcfce7", // Green light
  "#fce7f3", // Pink light
  "#f3e8ff", // Purple light
  "#fed7aa", // Orange light
  "#e0f2fe", // Cyan light
  "#fef9c3", // Yellow light
];

export function useBulletinMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);

  const createBulletin = useMutation({
    mutationFn: async (data: CreateBulletinData) => {
      if (!user) throw new Error("Not authenticated");

      // Random position if not provided
      const position_x = data.position_x ?? Math.random() * 60 + 20;
      const position_y = data.position_y ?? Math.random() * 60 + 20;
      const rotation = data.rotation ?? (Math.random() - 0.5) * 12;
      const color = data.color ?? BULLETIN_COLORS[Math.floor(Math.random() * BULLETIN_COLORS.length)];

      const { data: bulletin, error } = await supabase
        .from("bulletins")
        .insert({
          message: data.message,
          position_x,
          position_y,
          rotation,
          color,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return bulletin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
    },
  });

  const updateBulletinPosition = useMutation({
    mutationFn: async ({
      id,
      position_x,
      position_y,
    }: {
      id: string;
      position_x: number;
      position_y: number;
    }) => {
      const { data: bulletin, error } = await supabase
        .from("bulletins")
        .update({ position_x, position_y })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return bulletin;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
    },
  });

  const deleteBulletin = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("bulletins").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bulletins"] });
    },
  });

  return {
    createBulletin,
    updateBulletinPosition,
    deleteBulletin,
  };
}
