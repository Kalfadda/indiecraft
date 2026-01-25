-- ============================================
-- SECURITY HARDENING MIGRATION
-- ============================================
-- Run this in Supabase SQL Editor to fix security vulnerabilities
-- This addresses: RPC Function Enumeration, Function Security, and additional RLS hardening

-- ============================================
-- 1. SECURE HELPER FUNCTIONS (Fixes: RPC Function Enumeration)
-- ============================================

-- Revoke public access to helper functions - only authenticated users should call these
REVOKE EXECUTE ON FUNCTION public.is_user_blocked() FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_user_blocked() FROM public;
GRANT EXECUTE ON FUNCTION public.is_user_blocked() TO authenticated;

-- Revoke access to trigger functions (these should only be called by triggers, not directly)
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM anon;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM public;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM authenticated;

-- handle_new_user is SECURITY DEFINER and triggered by auth, but should not be callable directly
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- ============================================
-- 2. ADD SEARCH_PATH SECURITY TO FUNCTIONS
-- ============================================
-- This prevents search_path injection attacks on SECURITY DEFINER functions

-- Recreate handle_new_user with secure search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Recreate is_user_blocked with secure search_path
CREATE OR REPLACE FUNCTION public.is_user_blocked()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_blocked = TRUE
  );
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   STABLE
   SET search_path = public;

-- Re-revoke permissions after recreation
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM anon, public, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_user_blocked() FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_user_blocked() TO authenticated;

-- ============================================
-- 3. RESTRICT SCHEMA ACCESS
-- ============================================
-- Prevent enumeration of public schema objects

REVOKE ALL ON SCHEMA public FROM anon;
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 4. SECURE TABLE PERMISSIONS
-- ============================================
-- Ensure anon role cannot access any tables (RLS should handle authenticated access)

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipelines TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_dependencies TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.guides TO authenticated;

-- Grant access to feature_requests if it exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'feature_requests') THEN
    EXECUTE 'GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_requests TO authenticated';
  END IF;
END $$;

-- ============================================
-- 5. ADD RATE LIMITING HELPER (for future use)
-- ============================================
-- This function can be used to track and limit actions per user

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON public.rate_limits(user_id, action_type, window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the system can manage rate limits (no direct user access)
-- Users can only see their own rate limit data
CREATE POLICY "Users can view own rate limits"
  ON public.rate_limits FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Function to check rate limit (returns true if action is allowed)
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  p_action_type TEXT,
  p_max_actions INTEGER DEFAULT 100,
  p_window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_window_start TIMESTAMPTZ;
BEGIN
  v_window_start := NOW() - (p_window_minutes || ' minutes')::INTERVAL;

  SELECT COALESCE(SUM(action_count), 0) INTO v_count
  FROM public.rate_limits
  WHERE user_id = auth.uid()
    AND action_type = p_action_type
    AND window_start >= v_window_start;

  RETURN v_count < p_max_actions;
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- Secure the rate limit function
REVOKE EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.check_rate_limit(TEXT, INTEGER, INTEGER) TO authenticated;

-- ============================================
-- 6. PREVENT MASS DATA EXTRACTION
-- ============================================
-- Add a view that limits result sets (optional - for highly sensitive data)

-- Example: Create a secured view for profiles that limits exposure
CREATE OR REPLACE VIEW public.profiles_limited AS
SELECT
  id,
  display_name,
  -- Don't expose email to other users
  CASE
    WHEN id = auth.uid() THEN email
    ELSE NULL
  END as email,
  is_blocked,
  created_at
FROM public.profiles
WHERE NOT public.is_user_blocked();

-- Grant access to the view
GRANT SELECT ON public.profiles_limited TO authenticated;

-- ============================================
-- 7. AUDIT LOGGING TABLE (for security monitoring)
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_data JSONB,
  new_data JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_user ON public.security_audit_log(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON public.security_audit_log(action, created_at DESC);

-- Enable RLS - only admins can read audit logs
ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- No direct user access to audit logs
-- (You would create admin-only policies if you have an admin role)

-- ============================================
-- 8. CLEAN UP OLD RATE LIMIT DATA (scheduled cleanup)
-- ============================================

CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql
   SECURITY DEFINER
   SET search_path = public;

-- This should only be called by pg_cron or similar scheduler
REVOKE EXECUTE ON FUNCTION public.cleanup_old_rate_limits() FROM anon, public, authenticated;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the security settings are applied:

-- Check RLS is enabled on all tables
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Check function privileges
-- SELECT proname, proacl FROM pg_proc WHERE pronamespace = 'public'::regnamespace;

-- List all policies
-- SELECT tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public';
