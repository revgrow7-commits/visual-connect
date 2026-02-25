
-- Create jobs_cache table for Holdprint sync
CREATE TABLE IF NOT EXISTS public.jobs_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holdprint_id TEXT NOT NULL UNIQUE,
  job_number TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  stage TEXT NOT NULL DEFAULT 'revisao_comercial',
  previous_stage TEXT,
  last_synced TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_jobs_cache_stage ON public.jobs_cache(stage);
CREATE INDEX idx_jobs_cache_synced ON public.jobs_cache(last_synced);
CREATE INDEX idx_jobs_cache_job_number ON public.jobs_cache(job_number);

-- Enable RLS
ALTER TABLE public.jobs_cache ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can read jobs_cache"
  ON public.jobs_cache FOR SELECT USING (true);

CREATE POLICY "Service can manage jobs_cache"
  ON public.jobs_cache FOR ALL USING (true) WITH CHECK (true);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.jobs_cache;

-- Add updated_at trigger
CREATE TRIGGER update_jobs_cache_updated_at
  BEFORE UPDATE ON public.jobs_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
