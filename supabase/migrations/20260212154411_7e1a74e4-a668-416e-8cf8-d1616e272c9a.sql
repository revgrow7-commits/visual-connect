-- Drop and recreate storage policy to match user_id path pattern
DROP POLICY IF EXISTS "Authenticated can upload ouvidoria anexos" ON storage.objects;

CREATE POLICY "Authenticated can upload ouvidoria anexos"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'ouvidoria-anexos' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Also allow authenticated users to read their own uploads
CREATE POLICY "Users can read own ouvidoria anexos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'ouvidoria-anexos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);