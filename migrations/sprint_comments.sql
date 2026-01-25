-- Migration: Add sprint comments support to existing comments table
-- Run this in Supabase SQL Editor AFTER running sprints_rename.sql

-- Add sprint_id column to comments table
ALTER TABLE public.comments ADD COLUMN sprint_id UUID REFERENCES public.sprints(id) ON DELETE CASCADE;

-- Make asset_id nullable
ALTER TABLE public.comments ALTER COLUMN asset_id DROP NOT NULL;

-- Add check constraint to ensure exactly one of asset_id or sprint_id is set
ALTER TABLE public.comments ADD CONSTRAINT comments_target_check
    CHECK (
        (asset_id IS NOT NULL AND sprint_id IS NULL) OR
        (asset_id IS NULL AND sprint_id IS NOT NULL)
    );

-- Create index for sprint_id
CREATE INDEX idx_comments_sprint_id ON public.comments(sprint_id);

-- Enable realtime for comments (needed for notifications)
-- Note: This may fail if already added - that's OK, just ignore the error
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;

-- Update RLS policies are not needed since they already allow authenticated users
-- and the table structure change is transparent to RLS
