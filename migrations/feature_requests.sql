-- Migration: Create feature_requests table
-- Run this in Supabase SQL Editor

-- Create the feature_requests table
CREATE TABLE public.feature_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'accepted', 'denied')),
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_by UUID REFERENCES public.profiles(id),
    accepted_at TIMESTAMPTZ,
    linked_asset_id UUID REFERENCES public.assets(id),
    denied_by UUID REFERENCES public.profiles(id),
    denied_at TIMESTAMPTZ,
    denial_reason TEXT
);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.handle_feature_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_feature_requests_updated
    BEFORE UPDATE ON public.feature_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_feature_requests_updated_at();

-- Enable Row Level Security
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies (following the same pattern as model_requests)

-- SELECT: Non-blocked users can view all feature requests
CREATE POLICY "Non-blocked users can view feature_requests"
    ON public.feature_requests
    FOR SELECT
    TO authenticated
    USING (NOT public.is_user_blocked());

-- INSERT: Non-blocked users can create feature requests
CREATE POLICY "Non-blocked users can create feature_requests"
    ON public.feature_requests
    FOR INSERT
    TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

-- UPDATE: Non-blocked users can update feature requests
CREATE POLICY "Non-blocked users can update feature_requests"
    ON public.feature_requests
    FOR UPDATE
    TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

-- DELETE: Non-blocked users can delete feature requests
CREATE POLICY "Non-blocked users can delete feature_requests"
    ON public.feature_requests
    FOR DELETE
    TO authenticated
    USING (NOT public.is_user_blocked());

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feature_requests;

-- Create indexes for common queries
CREATE INDEX idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX idx_feature_requests_created_by ON public.feature_requests(created_by);
CREATE INDEX idx_feature_requests_created_at ON public.feature_requests(created_at DESC);
