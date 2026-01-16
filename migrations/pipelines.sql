-- Migration: Create pipelines, pipeline_tasks, task_dependencies, and guides tables
-- Run this in Supabase SQL Editor

-- ============================================
-- PIPELINES TABLE
-- ============================================
CREATE TABLE public.pipelines (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'finalized')),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    completed_at TIMESTAMPTZ,
    finalized_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_pipelines_status ON public.pipelines(status);
CREATE INDEX idx_pipelines_created_by ON public.pipelines(created_by);
CREATE INDEX idx_pipelines_created_at ON public.pipelines(created_at DESC);

-- Updated_at trigger
CREATE TRIGGER update_pipelines_updated_at
    BEFORE UPDATE ON public.pipelines
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view pipelines"
    ON public.pipelines FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create pipelines"
    ON public.pipelines FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update pipelines"
    ON public.pipelines FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete pipelines"
    ON public.pipelines FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- PIPELINE_TASKS TABLE (junction table)
-- ============================================
CREATE TABLE public.pipeline_tasks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
    asset_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    order_index INTEGER NOT NULL DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(pipeline_id, asset_id)
);

-- Indexes
CREATE INDEX idx_pipeline_tasks_pipeline_id ON public.pipeline_tasks(pipeline_id);
CREATE INDEX idx_pipeline_tasks_asset_id ON public.pipeline_tasks(asset_id);
CREATE INDEX idx_pipeline_tasks_order ON public.pipeline_tasks(pipeline_id, order_index);

-- Enable RLS
ALTER TABLE public.pipeline_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view pipeline_tasks"
    ON public.pipeline_tasks FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create pipeline_tasks"
    ON public.pipeline_tasks FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update pipeline_tasks"
    ON public.pipeline_tasks FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete pipeline_tasks"
    ON public.pipeline_tasks FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- TASK_DEPENDENCIES TABLE
-- ============================================
CREATE TABLE public.task_dependencies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    dependent_task_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    dependency_task_id UUID NOT NULL REFERENCES public.assets(id) ON DELETE CASCADE,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(dependent_task_id, dependency_task_id),
    -- Prevent self-referential dependencies
    CHECK (dependent_task_id != dependency_task_id)
);

-- Indexes
CREATE INDEX idx_task_dependencies_dependent ON public.task_dependencies(dependent_task_id);
CREATE INDEX idx_task_dependencies_dependency ON public.task_dependencies(dependency_task_id);
CREATE INDEX idx_task_dependencies_pipeline ON public.task_dependencies(pipeline_id);

-- Enable RLS
ALTER TABLE public.task_dependencies ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view task_dependencies"
    ON public.task_dependencies FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can create task_dependencies"
    ON public.task_dependencies FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update task_dependencies"
    ON public.task_dependencies FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete task_dependencies"
    ON public.task_dependencies FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());

-- ============================================
-- GUIDES TABLE
-- ============================================
CREATE TABLE public.guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    pipeline_id UUID REFERENCES public.pipelines(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    content JSONB NOT NULL,
    category TEXT,
    tags TEXT[],
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    is_published BOOLEAN DEFAULT TRUE,
    view_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX idx_guides_pipeline_id ON public.guides(pipeline_id);
CREATE INDEX idx_guides_category ON public.guides(category);
CREATE INDEX idx_guides_created_at ON public.guides(created_at DESC);
CREATE INDEX idx_guides_is_published ON public.guides(is_published);
CREATE INDEX idx_guides_tags ON public.guides USING GIN(tags);

-- Updated_at trigger
CREATE TRIGGER update_guides_updated_at
    BEFORE UPDATE ON public.guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Non-blocked users can view published guides"
    ON public.guides FOR SELECT TO authenticated
    USING (NOT public.is_user_blocked() AND (is_published = TRUE OR created_by = auth.uid()));

CREATE POLICY "Non-blocked users can create guides"
    ON public.guides FOR INSERT TO authenticated
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can update guides"
    ON public.guides FOR UPDATE TO authenticated
    USING (NOT public.is_user_blocked())
    WITH CHECK (NOT public.is_user_blocked());

CREATE POLICY "Non-blocked users can delete guides"
    ON public.guides FOR DELETE TO authenticated
    USING (NOT public.is_user_blocked());
