-- Create releases bucket for Tauri app updates
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('releases', 'releases', false, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to read releases (download updates)
CREATE POLICY "Authenticated users can read releases"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'releases');

-- Allow service role to manage releases (workflow uploads)
CREATE POLICY "Service role can manage releases"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'releases');
