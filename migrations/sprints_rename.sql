-- ============================================
-- Migration: Rename Pipelines to Sprints
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Rename pipelines table to sprints
ALTER TABLE public.pipelines RENAME TO sprints;

-- Step 2: Rename pipeline_tasks to sprint_tasks
ALTER TABLE public.pipeline_tasks RENAME TO sprint_tasks;

-- Step 3: Rename columns
ALTER TABLE public.sprint_tasks RENAME COLUMN pipeline_id TO sprint_id;
ALTER TABLE public.task_dependencies RENAME COLUMN pipeline_id TO sprint_id;

-- Step 4: Update any finalized sprints to completed
UPDATE public.sprints SET status = 'completed' WHERE status = 'finalized';

-- Step 5: Update status constraint (remove finalized)
ALTER TABLE public.sprints DROP CONSTRAINT IF EXISTS pipelines_status_check;
ALTER TABLE public.sprints ADD CONSTRAINT sprints_status_check CHECK (status IN ('active', 'completed'));

-- Step 6: Drop the finalized_at column
ALTER TABLE public.sprints DROP COLUMN IF EXISTS finalized_at;

-- Step 7: Drop guides table entirely
DROP TABLE IF EXISTS public.guides CASCADE;

-- ============================================
-- Update RLS policies for sprints table
-- ============================================
DROP POLICY IF EXISTS "Non-blocked users can view pipelines" ON public.sprints;
DROP POLICY IF EXISTS "Non-blocked users can create pipelines" ON public.sprints;
DROP POLICY IF EXISTS "Non-blocked users can update pipelines" ON public.sprints;
DROP POLICY IF EXISTS "Non-blocked users can delete pipelines" ON public.sprints;

CREATE POLICY "Non-blocked users can view sprints"
    ON public.sprints FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create sprints"
    ON public.sprints FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update sprints"
    ON public.sprints FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete sprints"
    ON public.sprints FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- Update RLS policies for sprint_tasks table
-- ============================================
DROP POLICY IF EXISTS "Non-blocked users can view pipeline_tasks" ON public.sprint_tasks;
DROP POLICY IF EXISTS "Non-blocked users can create pipeline_tasks" ON public.sprint_tasks;
DROP POLICY IF EXISTS "Non-blocked users can update pipeline_tasks" ON public.sprint_tasks;
DROP POLICY IF EXISTS "Non-blocked users can delete pipeline_tasks" ON public.sprint_tasks;

CREATE POLICY "Non-blocked users can view sprint_tasks"
    ON public.sprint_tasks FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create sprint_tasks"
    ON public.sprint_tasks FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update sprint_tasks"
    ON public.sprint_tasks FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete sprint_tasks"
    ON public.sprint_tasks FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- Enable realtime for comments (for notifications)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
