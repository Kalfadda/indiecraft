-- Create notifications table for persistent activity log
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  variant TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  actor_id UUID REFERENCES public.profiles(id),
  actor_name TEXT,
  item_name TEXT,
  item_id UUID,
  item_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Index for efficient pagination (newest first)
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view notifications"
  ON public.notifications FOR SELECT TO authenticated
  USING (NOT public.is_user_blocked());

CREATE POLICY "Authenticated users can insert notifications"
  ON public.notifications FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_blocked());
