import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { Event, Profile, EventType, EventVisibility, Asset } from "@/types/database";

export type EventWithCreator = Event & {
  creator: Pick<Profile, "display_name" | "email"> | null;
  linked_asset: Pick<Asset, "name"> | null;
};

export interface UseEventsOptions {
  type?: EventType;
  visibility?: EventVisibility;
  startDate?: string;
  endDate?: string;
  linkedAssetId?: string;
}

export function useEvents(options: UseEventsOptions = {}) {
  const { type, visibility, startDate, endDate, linkedAssetId } = options;

  return useQuery({
    queryKey: ["events", type, visibility, startDate, endDate, linkedAssetId],
    queryFn: async (): Promise<EventWithCreator[]> => {
      let query = supabase
        .from("events")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          linked_asset:assets!linked_asset_id(name)
        `
        )
        .order("event_date", { ascending: true });

      if (type) {
        query = query.eq("type", type);
      }

      if (visibility) {
        query = query.eq("visibility", visibility);
      }

      if (startDate) {
        query = query.gte("event_date", startDate);
      }

      if (endDate) {
        query = query.lte("event_date", endDate);
      }

      if (linkedAssetId) {
        query = query.eq("linked_asset_id", linkedAssetId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []) as EventWithCreator[];
    },
  });
}

export function useEvent(id: string) {
  return useQuery({
    queryKey: ["event", id],
    queryFn: async (): Promise<EventWithCreator | null> => {
      const { data, error } = await supabase
        .from("events")
        .select(
          `
          *,
          creator:profiles!created_by(display_name, email),
          linked_asset:assets!linked_asset_id(name)
        `
        )
        .eq("id", id)
        .single();

      if (error) throw error;
      return data as EventWithCreator;
    },
    enabled: !!id,
  });
}

// Helper to get events for a specific month
export function useEventsForMonth(year: number, month: number) {
  const startDate = new Date(year, month, 1).toISOString().split("T")[0];
  const endDate = new Date(year, month + 1, 0).toISOString().split("T")[0];

  return useEvents({ startDate, endDate });
}

// Helper to check if an event is upcoming (within the next N days)
export function isEventUpcoming(eventDate: string, daysAhead: number = 7): boolean {
  const event = new Date(eventDate);
  const now = new Date();
  const future = new Date();
  future.setDate(future.getDate() + daysAhead);

  return event >= now && event <= future;
}

// Helper to check if an event is overdue
export function isEventOverdue(eventDate: string): boolean {
  const event = new Date(eventDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  return event < now;
}
