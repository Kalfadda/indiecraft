import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { FeatureRequest, Profile, FeatureRequestStatus } from "@/types/database";

export type FeatureRequestWithCreator = FeatureRequest & {
  creator: Pick<Profile, "display_name" | "email"> | null;
  accepter: Pick<Profile, "display_name" | "email"> | null;
  denier: Pick<Profile, "display_name" | "email"> | null;
};

export interface UseFeatureRequestsOptions {
  status?: FeatureRequestStatus;
}

export function useFeatureRequests(options: UseFeatureRequestsOptions = {}) {
  const { status } = options;

  return useQuery({
    queryKey: ["feature_requests", status],
    queryFn: async (): Promise<FeatureRequestWithCreator[]> => {
      let query = supabase
        .from("feature_requests")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          accepter:profiles!accepted_by(display_name, email),
          denier:profiles!denied_by(display_name, email)
        `
        )
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;

      if (error) throw error;

      let requests = (data || []) as FeatureRequestWithCreator[];

      // Filter out denied items older than 7 days (auto-hide)
      if (status === "denied") {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        requests = requests.filter((req) => {
          if (!req.denied_at) return true;
          return new Date(req.denied_at) > sevenDaysAgo;
        });
      }

      return requests;
    },
  });
}

export function useFeatureRequest(id: string) {
  return useQuery({
    queryKey: ["feature_request", id],
    queryFn: async (): Promise<FeatureRequestWithCreator | null> => {
      const { data, error } = await supabase
        .from("feature_requests")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          accepter:profiles!accepted_by(display_name, email),
          denier:profiles!denied_by(display_name, email)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as FeatureRequestWithCreator;
    },
    enabled: !!id,
  });
}

// Helper to calculate days remaining before auto-hide for denied requests
export function getDaysUntilHide(deniedAt: string | null): number | null {
  if (!deniedAt) return null;
  const deniedDate = new Date(deniedAt);
  const hideDate = new Date(deniedDate);
  hideDate.setDate(hideDate.getDate() + 7);
  const now = new Date();
  const diffMs = hideDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}
