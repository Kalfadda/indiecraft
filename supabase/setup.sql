CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
  blocked_at TIMESTAMP WITH TIME ZONE,
  blocked_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_is_blocked ON public.profiles(is_blocked);

CREATE TABLE IF NOT EXISTS public.assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  blurb TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'implemented')),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  implemented_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  implemented_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_assets_status ON public.assets(status);
CREATE INDEX IF NOT EXISTS idx_assets_created_by ON public.assets(created_by);
CREATE INDEX IF NOT EXISTS idx_assets_created_at ON public.assets(created_at DESC);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assets_updated_at ON public.assets;
CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON public.assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_user_blocked()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND is_blocked = TRUE
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
CREATE POLICY "Users can view all profiles"
  ON public.profiles FOR SELECT TO authenticated
  USING (NOT public.is_user_blocked());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id AND NOT public.is_user_blocked())
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Non-blocked users can view assets" ON public.assets;
CREATE POLICY "Non-blocked users can view assets"
  ON public.assets FOR SELECT TO authenticated
  USING (NOT public.is_user_blocked());

DROP POLICY IF EXISTS "Non-blocked users can create assets" ON public.assets;
CREATE POLICY "Non-blocked users can create assets"
  ON public.assets FOR INSERT TO authenticated
  WITH CHECK (NOT public.is_user_blocked() AND auth.uid() = created_by);

DROP POLICY IF EXISTS "Non-blocked users can update assets" ON public.assets;
CREATE POLICY "Non-blocked users can update assets"
  ON public.assets FOR UPDATE TO authenticated
  USING (NOT public.is_user_blocked())
  WITH CHECK (NOT public.is_user_blocked());

DROP POLICY IF EXISTS "Non-blocked users can delete assets" ON public.assets;
CREATE POLICY "Non-blocked users can delete assets"
  ON public.assets FOR DELETE TO authenticated
  USING (NOT public.is_user_blocked());
