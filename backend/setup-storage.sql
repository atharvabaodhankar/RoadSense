-- Create storage bucket for inspection images
-- EASIEST WAY: Just create the bucket manually in Supabase Dashboard UI
-- Go to Storage → New bucket → Name: "inspections" → Public: Yes → Create

-- OR run this SQL in Supabase SQL Editor:

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('inspections', 'inspections', true)
ON CONFLICT (id) DO NOTHING;

-- Basic RLS policies (optional - public bucket already allows read/write)
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'inspections');

CREATE POLICY IF NOT EXISTS "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspections' 
  AND auth.role() = 'authenticated'
);

-- Note: For a public bucket, these policies are optional
-- The bucket being public already allows uploads and reads
