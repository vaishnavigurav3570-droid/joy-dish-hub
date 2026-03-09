
-- Create the 'bills' storage bucket (public so WhatsApp can access the image)
INSERT INTO storage.buckets (id, name, public)
VALUES ('bills', 'bills', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read from the bills bucket
CREATE POLICY "Public read access on bills" ON storage.objects
FOR SELECT USING (bucket_id = 'bills');

-- Allow authenticated users to upload to the bills bucket
CREATE POLICY "Authenticated users can upload bills" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bills');
