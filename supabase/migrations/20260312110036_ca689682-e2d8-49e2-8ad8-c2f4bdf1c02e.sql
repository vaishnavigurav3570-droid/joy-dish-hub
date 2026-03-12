
-- Add ar_model_url column to menu_items
ALTER TABLE public.menu_items ADD COLUMN IF NOT EXISTS ar_model_url text;

-- Create ar_models storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('ar_models', 'ar_models', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read ar_models
CREATE POLICY "Anyone can view AR models" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'ar_models');

-- Allow authenticated owners to upload AR models
CREATE POLICY "Owners can upload AR models" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'ar_models');

-- Allow authenticated owners to update AR models
CREATE POLICY "Owners can update AR models" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'ar_models');

-- Allow authenticated owners to delete AR models
CREATE POLICY "Owners can delete AR models" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'ar_models');
