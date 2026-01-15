import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Asset, Profile, AssetCategory, AssetStatus } from "@/types/database";

export type AssetWithCreator = Asset & {
  creator: Pick<Profile, "display_name" | "email"> | null;
  in_progress_user: Pick<Profile, "display_name" | "email"> | null;
  completer: Pick<Profile, "display_name" | "email"> | null;
  implementer: Pick<Profile, "display_name" | "email"> | null;
  claimer: Pick<Profile, "display_name" | "email"> | null;
};

export interface UseAssetsOptions {
  status?: AssetStatus;
  category?: AssetCategory | null;
}

export function useAssets(statusOrOptions?: AssetStatus | UseAssetsOptions) {
  // Support both legacy (status string) and new (options object) API
  const options: UseAssetsOptions = typeof statusOrOptions === 'object'
    ? statusOrOptions
    : { status: statusOrOptions };

  const { status, category } = options;

  return useQuery({
    queryKey: ["assets", status, category],
    queryFn: async (): Promise<AssetWithCreator[]> => {
      let query = supabase
        .from("assets")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          in_progress_user:profiles!in_progress_by(display_name, email),
          completer:profiles!completed_by(display_name, email),
          implementer:profiles!implemented_by(display_name, email),
          claimer:profiles!claimed_by(display_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      if (category) {
        query = query.eq("category", category);
      }

      const { data, error } = await query;

      if (error) throw error;

      let assets = (data || []) as AssetWithCreator[];

      // Filter out implemented items older than 7 days (auto-delete)
      if (status === "implemented") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        assets = assets.filter(asset => {
          if (!asset.implemented_at) return true;
          return new Date(asset.implemented_at) > sevenDaysAgo;
        });
      }

      return assets;
    },
  });
}

export function useAsset(id: string) {
  return useQuery({
    queryKey: ["asset", id],
    queryFn: async (): Promise<AssetWithCreator | null> => {
      const { data, error } = await supabase
        .from("assets")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          in_progress_user:profiles!in_progress_by(display_name, email),
          completer:profiles!completed_by(display_name, email),
          implementer:profiles!implemented_by(display_name, email),
          claimer:profiles!claimed_by(display_name, email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as AssetWithCreator;
    },
    enabled: !!id,
  });
}

// Helper to calculate days remaining before auto-delete
export function getDaysUntilDelete(implementedAt: string | null): number | null {
  if (!implementedAt) return null;
  const implementedDate = new Date(implementedAt);
  const deleteDate = new Date(implementedDate);
  deleteDate.setDate(deleteDate.getDate() + 7);
  const now = new Date();
  const diffMs = deleteDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
