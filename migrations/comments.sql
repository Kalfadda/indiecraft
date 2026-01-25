-- Migration: Create comments table for task progress updates
-- Run this in Supabase SQL Editor

-- Create the comments table
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create updated_at trigger
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- SELECT: Non-blocked users can view all comments
CREATE POLICY "Non-blocked users can view comments"
    ON public.comments
    FOR SELECT
    TO authenticated
    USING (NOT public.is_user_blocked());

-- INSERT: Non-blocked users can create comments (must be the creator)
CREATE POLICY "Non-blocked users can create comments"
    ON public.comments
    FOR INSERT
    TO authenticated
    WITH CHECK (NOT public.is_user_blocked() AND auth.uid() = created_by);

-- UPDATE: Users can only update their own comments
CREATE POLICY "Users can update own comments"
    ON public.comments
    FOR UPDATE
    TO authenticated
    USING (NOT public.is_user_blocked() AND auth.uid() = created_by)
    WITH CHECK (NOT public.is_user_blocked() AND auth.uid() = created_by);

-- DELETE: Users can only delete their own comments
CREATE POLICY "Users can delete own comments"
    ON public.comments
    FOR DELETE
    TO authenticated
    USING (NOT public.is_user_blocked() AND auth.uid() = created_by);

-- Create indexes for common queries
CREATE INDEX idx_comments_asset_id ON public.comments(asset_id);
CREATE INDEX idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX idx_comments_created_by ON public.comments(created_by);
