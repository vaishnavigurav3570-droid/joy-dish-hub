-- ============================================
-- COMPLETE FIX: Run ALL of this in Supabase SQL Editor
-- Safe to run multiple times
-- ============================================

-- 1. Add missing columns
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS customer_name text DEFAULT '';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_type text NOT NULL DEFAULT 'dine-in';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS pickup_pin text;

-- 2. Fix status constraint
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
CHECK (status IN ('pending','confirmed','preparing','ready','completed','rejected','cancelled','no_show'));

-- 3. Grant table permissions
GRANT SELECT, INSERT ON public.orders TO anon;
GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT SELECT, INSERT ON public.order_items TO anon;
GRANT SELECT, INSERT ON public.order_items TO authenticated;
GRANT SELECT ON public.menu_items TO anon;
GRANT SELECT, UPDATE ON public.menu_items TO authenticated;
GRANT SELECT, INSERT ON storage.objects TO authenticated;
GRANT SELECT ON storage.objects TO anon;
GRANT SELECT ON storage.buckets TO authenticated;
GRANT SELECT ON storage.buckets TO anon;

-- 4. Fix menu RLS & Realtime
DROP POLICY IF EXISTS "Anyone can view menu" ON public.menu_items;
CREATE POLICY "Anyone can view menu" ON public.menu_items FOR SELECT TO public USING (true);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'menu_items'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.menu_items;
  END IF;
END
$$;

-- 5. Fix orders RLS
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;
CREATE POLICY "Anyone can create orders" ON public.orders FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Customers can view own orders" ON public.orders;
CREATE POLICY "Customers can view own orders" ON public.orders FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Staff can update orders" ON public.orders;
CREATE POLICY "Staff can update orders" ON public.orders FOR UPDATE TO public USING (true);

-- 6. Fix order_items RLS
DROP POLICY IF EXISTS "View order items" ON public.order_items;
CREATE POLICY "View order items" ON public.order_items FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Insert order items" ON public.order_items;
CREATE POLICY "Insert order items" ON public.order_items FOR INSERT TO public WITH CHECK (true);

-- 7. Fix storage RLS for bills
DROP POLICY IF EXISTS "Authenticated users can upload bills" ON storage.objects;
CREATE POLICY "Authenticated users can upload bills" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bills');

DROP POLICY IF EXISTS "Public read access on bills" ON storage.objects;
CREATE POLICY "Public read access on bills" ON storage.objects FOR SELECT USING (bucket_id = 'bills');

-- 8. Clean up old stuck orders
UPDATE public.orders SET status = 'completed' WHERE bill_sent = true AND status != 'completed';

-- 9. Create app_settings table for Shop Availability
CREATE TABLE IF NOT EXISTS public.app_settings (
  id integer PRIMARY KEY DEFAULT 1,
  is_open boolean NOT NULL DEFAULT true,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure only one row exists
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

-- Setup RLS for app_settings
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;
CREATE POLICY "Anyone can read app_settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can update app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can update app_settings" ON public.app_settings FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated can insert app_settings" ON public.app_settings;
CREATE POLICY "Authenticated can insert app_settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (true);

-- Grant permissions for app_settings
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;

