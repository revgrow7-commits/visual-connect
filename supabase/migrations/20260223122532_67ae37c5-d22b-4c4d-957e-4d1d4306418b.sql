
-- Create storage bucket for job files
INSERT INTO storage.buckets (id, name, public) VALUES ('job-files', 'job-files', true);

-- Storage policies
CREATE POLICY "Anyone can read job files"
ON storage.objects FOR SELECT
USING (bucket_id = 'job-files');

CREATE POLICY "Authenticated can upload job files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'job-files' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete job files"
ON storage.objects FOR DELETE
USING (bucket_id = 'job-files' AND auth.uid() IS NOT NULL);

-- Create job_files table to track uploads
CREATE TABLE public.job_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT DEFAULT 0,
  file_type TEXT DEFAULT '',
  uploaded_by TEXT DEFAULT 'Usuário',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job files records"
ON public.job_files FOR SELECT
USING (true);

CREATE POLICY "Authenticated can insert job files records"
ON public.job_files FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete job files records"
ON public.job_files FOR DELETE
USING (auth.uid() IS NOT NULL);
