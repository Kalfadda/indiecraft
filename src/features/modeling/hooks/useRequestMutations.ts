import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/stores/authStore";
import {
  useNotificationStore,
  createNotificationConfig,
} from "@/stores/notificationStore";
import type { AssetPriority } from "@/types/database";

interface CreateRequestData {
  name: string;
  description?: string;
  priority?: AssetPriority | null;
}

export function useRequestMutations() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);
  const addNotification = useNotificationStore((state) => state.addNotification);

  const createRequest = useMutation({
    mutationFn: async (data: CreateRequestData) => {
      if (!user) throw new Error("Not authenticated");

      const { data: request, error } = await supabase
        .from("model_requests")
        .insert({
          name: data.name,
          description: data.description || null,
          priority: data.priority || null,
          status: "open",
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
      addNotification(
        createNotificationConfig(
          "model_request_created",
          request.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Accept request: creates a task with category "design" and same priority
  const acceptRequest = useMutation({
    mutationFn: async (requestId: string) => {
      if (!user) throw new Error("Not authenticated");

      // Fetch the request first
      const { data: request, error: fetchError } = await supabase
        .from("model_requests")
        .select("*")
        .eq("id", requestId)
        .single();

      if (fetchError) throw fetchError;
      if (!request) throw new Error("Request not found");

      // Create the task with category "design"
      const { data: asset, error: assetError } = await supabase
        .from("assets")
        .insert({
          name: request.name,
          blurb: request.description || null,
          category: "design",
          priority: request.priority,
          status: "pending",
          created_by: user.id,
        })
        .select()
        .single();

      if (assetError) throw assetError;

      // Update the request as accepted
      const { data: updatedRequest, error: updateError } = await supabase
        .from("model_requests")
        .update({
          status: "accepted",
          accepted_by: user.id,
          accepted_at: new Date().toISOString(),
          linked_asset_id: asset.id,
        })
        .eq("id", requestId)
        .select()
        .single();

      if (updateError) throw updateError;

      return { request: updatedRequest, asset };
    },
    onSuccess: ({ request }) => {
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
      queryClient.invalidateQueries({ queryKey: ["assets"] });
      addNotification(
        createNotificationConfig(
          "model_request_accepted",
          request.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  // Deny request: requires a reason
  const denyRequest = useMutation({
    mutationFn: async ({
      requestId,
      reason,
    }: {
      requestId: string;
      reason: string;
    }) => {
      if (!user) throw new Error("Not authenticated");
      if (!reason.trim()) throw new Error("Denial reason is required");

      const { data: request, error } = await supabase
        .from("model_requests")
        .update({
          status: "denied",
          denied_by: user.id,
          denied_at: new Date().toISOString(),
          denial_reason: reason.trim(),
        })
        .eq("id", requestId)
        .select()
        .single();

      if (error) throw error;
      return request;
    },
    onSuccess: (request) => {
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
      addNotification(
        createNotificationConfig(
          "model_request_denied",
          request.name,
          profile?.display_name || profile?.email || "You",
          true
        )
      );
    },
  });

  const deleteRequest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("model_requests")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["model_requests"] });
    },
  });

  return {
    createRequest,
    acceptRequest,
    denyRequest,
    deleteRequest,
  };
}
