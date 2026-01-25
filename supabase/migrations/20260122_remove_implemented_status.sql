-- Migration: Remove 'implemented' status and add auto-cleanup
-- Run this in Supabase SQL Editor

-- Step 1: Convert implemented tasks to completed
UPDATE public.assets
SET status = 'completed'
WHERE status = 'implemented';

-- Step 2: Drop old columns (one at a time)
ALTER TABLE public.assets DROP COLUMN IF EXISTS implemented_by;

ALTER TABLE public.assets DROP COLUMN IF EXISTS implemented_at;

-- Step 3: Clean up old notifications
DELETE FROM public.notifications WHERE type = 'task_implemented';

-- Step 4: Create cleanup function for orphan completed tasks
CREATE OR REPLACE FUNCTION public.cleanup_orphan_completed_tasks()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.assets
  WHERE status = 'completed'
    AND goal_id IS NULL
    AND completed_at IS NOT NULL
    AND completed_at < NOW() - INTERVAL '7 days';
END;
$$;

-- Step 5: Run cleanup immediately
SELECT public.cleanup_orphan_completed_tasks();

-- Step 6: Verify results
SELECT status, (goal_id IS NULL) as is_orphan, COUNT(*) as count
FROM public.assets
GROUP BY status, (goal_id IS NULL)
ORDER BY status;
