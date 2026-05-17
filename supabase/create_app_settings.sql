-- ============================================
-- Create the app_settings table for Shop Open/Close
-- 100% safe to run multiple times
-- ============================================

-- Create the table
CREATE TABLE IF NOT EXISTS public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Insert exactly one settings row (skip if already exists)
INSERT INTO public.app_settings (id, is_open)
VALUES (1, true)
ON CONFLICT (id) DO NOTHING;

-- Enable Realtime for this table
ALTER TABLE public.app_settings REPLICA IDENTITY FULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'app_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
  END IF;
END
$$;

-- Enable Row Level Security
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read settings (DROP first to make this idempotent)
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT USING (true);

-- Allow authenticated users (owner/worker) to update settings
DROP POLICY IF EXISTS "Authenticated can update app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can update app_settings"
  ON public.app_settings FOR UPDATE TO authenticated USING (true);

-- Allow authenticated users to insert (needed for upsert fallback)
DROP POLICY IF EXISTS "Authenticated can insert app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can insert app_settings"
  ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Grant table-level permissions (INSERT needed for upsert)
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
