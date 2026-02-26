-- Fix storage policies for job-files bucket to allow public uploads/deletes
DROP POLICY IF EXISTS "Authenticated can upload job files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated can delete job files" ON storage.objects;

CREATE POLICY "Anyone can upload job files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'job-files');

CREATE POLICY "Anyone can delete job files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'job-files');