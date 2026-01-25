// Auto-generated schema SQL - embedded for reliable access
export const SCHEMA_SQL = `-- ============================================
-- INDIECRAFT - COMPLETE DATABASE SCHEMA
-- ============================================
-- Run this SQL in your Supabase SQL Editor to set up all required tables
-- Make sure to run this AFTER disabling email confirmation in Auth settings

-- ============================================
-- 1. HELPER FUNCTIONS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if current user is blocked
CREATE OR REPLACE FUNCTION public.is_user_blocked()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid()
        AND is_blocked = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

-- ============================================
-- 2. PROFILES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    is_blocked BOOLEAN DEFAULT FALSE,
    blocked_at TIMESTAMPTZ,
    blocked_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile on user signup
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Updated_at trigger
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid() AND NOT public.is_user_blocked())
    WITH CHECK (id = auth.uid() AND NOT public.is_user_blocked());

CREATE POLICY "Admins can update any profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- 3. GOALS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    target_date DATE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE TRIGGER update_goals_updated_at
    BEFORE UPDATE ON public.goals
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view goals"
    ON public.goals FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create goals"
    ON public.goals FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update goals"
    ON public.goals FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete goals"
    ON public.goals FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- 4. ASSETS (TASKS) TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    blurb TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('blocked', 'pending', 'in_progress', 'completed')),
    category TEXT CHECK (category IN ('art', 'code', 'audio', 'design', 'documentation', 'marketing', 'infrastructure', 'other')),
    priority TEXT CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id),
    in_progress_by UUID REFERENCES public.profiles(id),
    in_progress_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id),
    completed_at TIMESTAMPTZ,
    claimed_by UUID REFERENCES public.profiles(id),
    claimed_at TIMESTAMPTZ,
    blocked_by UUID REFERENCES public.profiles(id),
    blocked_at TIMESTAMPTZ,
    blocked_reason TEXT,
    eta_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_assets_updated_at
    BEFORE UPDATE ON public.assets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view assets"
    ON public.assets FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create assets"
    ON public.assets FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update assets"
    ON public.assets FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete assets"
    ON public.assets FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- Indexes
CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_category ON public.assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_goal_id ON public.assets(goal_id);
CREATE INDEX IF NOT EXISTS idx_assets_claimed_by ON public.assets(claimed_by);

-- ============================================
-- 5. EVENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('milestone', 'deliverable', 'label')),
    title TEXT NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    event_time TIME,
    visibility TEXT DEFAULT 'internal' CHECK (visibility IN ('internal', 'external')),
    linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    linked_goal_id UUID REFERENCES public.goals(id) ON DELETE SET NULL,
    auto_create_task BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view events"
    ON public.events FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create events"
    ON public.events FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update events"
    ON public.events FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete events"
    ON public.events FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

CREATE INDEX IF NOT EXISTS idx_events_date ON public.events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_type ON public.events(type);

-- ============================================
-- 6. MODEL REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.model_requests (
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
    linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    denied_by UUID REFERENCES public.profiles(id),
    denied_at TIMESTAMPTZ,
    denial_reason TEXT
);

CREATE TRIGGER update_model_requests_updated_at
    BEFORE UPDATE ON public.model_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.model_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view model_requests"
    ON public.model_requests FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create model_requests"
    ON public.model_requests FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update model_requests"
    ON public.model_requests FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete model_requests"
    ON public.model_requests FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

CREATE INDEX IF NOT EXISTS idx_model_requests_status ON public.model_requests(status);
CREATE INDEX IF NOT EXISTS idx_model_requests_created_by ON public.model_requests(created_by);

-- ============================================
-- 7. FEATURE REQUESTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.feature_requests (
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
    linked_asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    denied_by UUID REFERENCES public.profiles(id),
    denied_at TIMESTAMPTZ,
    denial_reason TEXT
);

CREATE TRIGGER update_feature_requests_updated_at
    BEFORE UPDATE ON public.feature_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view feature_requests"
    ON public.feature_requests FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create feature_requests"
    ON public.feature_requests FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update feature_requests"
    ON public.feature_requests FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete feature_requests"
    ON public.feature_requests FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

CREATE INDEX IF NOT EXISTS idx_feature_requests_status ON public.feature_requests(status);
CREATE INDEX IF NOT EXISTS idx_feature_requests_created_by ON public.feature_requests(created_by);

-- ============================================
-- 8. COMMENTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID REFERENCES public.assets(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT comments_target_check CHECK (
        (asset_id IS NOT NULL AND goal_id IS NULL) OR
        (asset_id IS NULL AND goal_id IS NOT NULL)
    )
);

CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view comments"
    ON public.comments FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create comments"
    ON public.comments FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked() AND auth.uid() = created_by);

CREATE POLICY "Users can update own comments"
    ON public.comments FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked() AND auth.uid() = created_by)
    WITH CHECK (NOT public.is_user_blocked() AND auth.uid() = created_by);

CREATE POLICY "Users can delete own comments"
    ON public.comments FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked() AND auth.uid() = created_by);

CREATE INDEX IF NOT EXISTS idx_comments_asset_id ON public.comments(asset_id);
CREATE INDEX IF NOT EXISTS idx_comments_goal_id ON public.comments(goal_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);

-- ============================================
-- 9. GOAL TASKS TABLE (linking table)
-- ============================================

CREATE TABLE IF NOT EXISTS public.goal_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    goal_id UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(goal_id, asset_id)
);

ALTER TABLE public.goal_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view goal_tasks"
    ON public.goal_tasks FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create goal_tasks"
    ON public.goal_tasks FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update goal_tasks"
    ON public.goal_tasks FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete goal_tasks"
    ON public.goal_tasks FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- 10. TASK DEPENDENCIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dependent_task_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    dependency_task_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    goal_id UUID REFERENCES public.goals(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(dependent_task_id, dependency_task_id)
);

ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view task_dependencies"
    ON public.task_dependencies FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create task_dependencies"
    ON public.task_dependencies FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete task_dependencies"
    ON public.task_dependencies FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- 11. NOTIFICATIONS TABLE
-- ============================================

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
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can insert notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- ============================================
-- 12. BULLETINS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.bulletins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    message TEXT NOT NULL,
    position_x REAL DEFAULT 50,
    position_y REAL DEFAULT 50,
    rotation REAL DEFAULT 0,
    color TEXT DEFAULT '#fef08a',
    created_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER update_bulletins_updated_at
    BEFORE UPDATE ON public.bulletins
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.bulletins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-blocked users can view bulletins"
    ON public.bulletins FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create bulletins"
    ON public.bulletins FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update bulletins"
    ON public.bulletins FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete bulletins"
    ON public.bulletins FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- 13. GRANT PERMISSIONS
-- ============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.assets TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.model_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feature_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goal_tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.task_dependencies TO authenticated;
GRANT SELECT, INSERT ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bulletins TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_blocked() TO authenticated;

-- ============================================
-- SETUP COMPLETE
-- ============================================
-- After running this SQL:
-- 1. Go to Authentication > Providers > Email
-- 2. Disable "Confirm email"
-- 3. Save settings
-- 4. Return to the app and click "Verify Setup"
`;
