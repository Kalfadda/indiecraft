// Asset categories for organization
export type AssetCategory =
  | "art"
  | "code"
  | "audio"
  | "design"
  | "documentation"
  | "marketing"
  | "infrastructure"
  | "other";

// Priority levels
export type AssetPriority = "low" | "medium" | "high" | "critical";

// Asset status workflow: pending -> in_progress -> completed -> implemented
export type AssetStatus = "pending" | "in_progress" | "completed" | "implemented";

// Category metadata for UI
export const ASSET_CATEGORIES: Record<AssetCategory, { label: string; color: string }> = {
  art: { label: "Art", color: "#ec4899" },
  code: { label: "Code", color: "#3b82f6" },
  audio: { label: "Audio", color: "#8b5cf6" },
  design: { label: "Design", color: "#f59e0b" },
  documentation: { label: "Docs", color: "#6b7280" },
  marketing: { label: "Marketing", color: "#10b981" },
  infrastructure: { label: "Infra", color: "#ef4444" },
  other: { label: "Other", color: "#6b7280" },
};

// Priority metadata for UI
export const ASSET_PRIORITIES: Record<AssetPriority, { label: string; color: string }> = {
  low: { label: "Low", color: "#6b7280" },
  medium: { label: "Medium", color: "#3b82f6" },
  high: { label: "High", color: "#f59e0b" },
  critical: { label: "Critical", color: "#ef4444" },
};

// Event types for scheduling
export type EventType = "milestone" | "deliverable" | "label";
export type EventVisibility = "internal" | "external";

// Model request status workflow: open -> accepted OR denied
export type ModelRequestStatus = "open" | "accepted" | "denied";

// Feature request status workflow: open -> accepted OR denied
export type FeatureRequestStatus = "open" | "accepted" | "denied";

// Event metadata for UI
export const EVENT_TYPES: Record<EventType, { label: string; color: string; icon: string }> = {
  milestone: { label: "Milestone", color: "#8b5cf6", icon: "Flag" },
  deliverable: { label: "Deliverable", color: "#f59e0b", icon: "Package" },
  label: { label: "Label", color: "#6b7280", icon: "Tag" },
};

// Model request status metadata for UI
export const MODEL_REQUEST_STATUSES: Record<ModelRequestStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "#3b82f6" },
  accepted: { label: "Accepted", color: "#16a34a" },
  denied: { label: "Denied", color: "#ef4444" },
};

// Feature request status metadata for UI
export const FEATURE_REQUEST_STATUSES: Record<FeatureRequestStatus, { label: string; color: string }> = {
  open: { label: "Open", color: "#3b82f6" },
  accepted: { label: "Accepted", color: "#16a34a" },
  denied: { label: "Denied", color: "#ef4444" },
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          display_name: string | null;
          is_blocked: boolean;
          blocked_at: string | null;
          blocked_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          display_name?: string | null;
          is_blocked?: boolean;
          blocked_at?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          display_name?: string | null;
          is_blocked?: boolean;
          blocked_at?: string | null;
          blocked_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      assets: {
        Row: {
          id: string;
          name: string;
          blurb: string | null;
          status: AssetStatus;
          category: AssetCategory | null;
          priority: AssetPriority | null;
          created_by: string | null;
          in_progress_by: string | null;
          in_progress_at: string | null;
          completed_by: string | null;
          completed_at: string | null;
          implemented_by: string | null;
          implemented_at: string | null;
          claimed_by: string | null;
          claimed_at: string | null;
          eta_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          blurb?: string | null;
          status?: AssetStatus;
          category?: AssetCategory | null;
          priority?: AssetPriority | null;
          created_by?: string | null;
          in_progress_by?: string | null;
          in_progress_at?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          implemented_by?: string | null;
          implemented_at?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          eta_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          blurb?: string | null;
          status?: AssetStatus;
          category?: AssetCategory | null;
          priority?: AssetPriority | null;
          created_by?: string | null;
          in_progress_by?: string | null;
          in_progress_at?: string | null;
          completed_by?: string | null;
          completed_at?: string | null;
          implemented_by?: string | null;
          implemented_at?: string | null;
          claimed_by?: string | null;
          claimed_at?: string | null;
          eta_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      events: {
        Row: {
          id: string;
          type: EventType;
          title: string;
          description: string | null;
          event_date: string;
          event_time: string | null;
          visibility: EventVisibility | null;
          linked_asset_id: string | null;
          auto_create_task: boolean;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          type: EventType;
          title: string;
          description?: string | null;
          event_date: string;
          event_time?: string | null;
          visibility?: EventVisibility | null;
          linked_asset_id?: string | null;
          auto_create_task?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: EventType;
          title?: string;
          description?: string | null;
          event_date?: string;
          event_time?: string | null;
          visibility?: EventVisibility | null;
          linked_asset_id?: string | null;
          auto_create_task?: boolean;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      model_requests: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          priority: AssetPriority | null;
          status: ModelRequestStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          linked_asset_id: string | null;
          denied_by: string | null;
          denied_at: string | null;
          denial_reason: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          priority?: AssetPriority | null;
          status?: ModelRequestStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          linked_asset_id?: string | null;
          denied_by?: string | null;
          denied_at?: string | null;
          denial_reason?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          priority?: AssetPriority | null;
          status?: ModelRequestStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          linked_asset_id?: string | null;
          denied_by?: string | null;
          denied_at?: string | null;
          denial_reason?: string | null;
        };
      };
      feature_requests: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          priority: AssetPriority | null;
          status: FeatureRequestStatus;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          accepted_by: string | null;
          accepted_at: string | null;
          linked_asset_id: string | null;
          denied_by: string | null;
          denied_at: string | null;
          denial_reason: string | null;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          priority?: AssetPriority | null;
          status?: FeatureRequestStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          linked_asset_id?: string | null;
          denied_by?: string | null;
          denied_at?: string | null;
          denial_reason?: string | null;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          priority?: AssetPriority | null;
          status?: FeatureRequestStatus;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
          accepted_by?: string | null;
          accepted_at?: string | null;
          linked_asset_id?: string | null;
          denied_by?: string | null;
          denied_at?: string | null;
          denial_reason?: string | null;
        };
      };
    };
  };
};

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Asset = Database["public"]["Tables"]["assets"]["Row"];
export type AssetInsert = Database["public"]["Tables"]["assets"]["Insert"];
export type AssetUpdate = Database["public"]["Tables"]["assets"]["Update"];

export type Event = Database["public"]["Tables"]["events"]["Row"];
export type EventInsert = Database["public"]["Tables"]["events"]["Insert"];
export type EventUpdate = Database["public"]["Tables"]["events"]["Update"];

export type ModelRequest = Database["public"]["Tables"]["model_requests"]["Row"];
export type ModelRequestInsert = Database["public"]["Tables"]["model_requests"]["Insert"];
export type ModelRequestUpdate = Database["public"]["Tables"]["model_requests"]["Update"];

export type FeatureRequest = Database["public"]["Tables"]["feature_requests"]["Row"];
export type FeatureRequestInsert = Database["public"]["Tables"]["feature_requests"]["Insert"];
export type FeatureRequestUpdate = Database["public"]["Tables"]["feature_requests"]["Update"];
