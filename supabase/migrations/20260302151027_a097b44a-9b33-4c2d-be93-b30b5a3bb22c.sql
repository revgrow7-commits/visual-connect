
-- Table to track sync runs
CREATE TABLE public.holdprint_sync_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  status text NOT NULL DEFAULT 'running',
  trigger_type text NOT NULL DEFAULT 'manual', -- 'manual' | 'cron'
  endpoints_synced text[] DEFAULT '{}',
  total_records integer DEFAULT 0,
  inserted integer DEFAULT 0,
  updated integer DEFAULT 0,
  errors text[] DEFAULT '{}',
  details jsonb DEFAULT '{}'
);

ALTER TABLE public.holdprint_sync_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read sync logs" ON public.holdprint_sync_log FOR SELECT USING (true);
CREATE POLICY "Service can manage sync logs" ON public.holdprint_sync_log FOR ALL USING (true) WITH CHECK (true);

-- Enable pg_cron and pg_net extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;
