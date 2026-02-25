
-- Table to track archived jobs
CREATE TABLE public.job_archives (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_code INTEGER,
  job_title TEXT,
  customer_name TEXT,
  archived_by TEXT DEFAULT 'Sistema',
  archived_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reason TEXT
);

-- Index for fast lookup
CREATE UNIQUE INDEX idx_job_archives_job_id ON public.job_archives (job_id);

-- Enable RLS
ALTER TABLE public.job_archives ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to manage archives
CREATE POLICY "Anyone can view archived jobs" ON public.job_archives FOR SELECT USING (true);
CREATE POLICY "Anyone can archive jobs" ON public.job_archives FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unarchive jobs" ON public.job_archives FOR DELETE USING (true);
