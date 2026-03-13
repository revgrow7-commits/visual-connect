
CREATE TABLE public.stage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_code INTEGER,
  job_title TEXT,
  customer_name TEXT,
  board_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  stage_id TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  collaborator_name TEXT DEFAULT 'Sistema',
  is_active BOOLEAN NOT NULL DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read stage_tracking" ON public.stage_tracking FOR SELECT USING (true);
CREATE POLICY "Anyone can insert stage_tracking" ON public.stage_tracking FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update stage_tracking" ON public.stage_tracking FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete stage_tracking" ON public.stage_tracking FOR DELETE USING (true);

CREATE INDEX idx_stage_tracking_job_id ON public.stage_tracking(job_id);
CREATE INDEX idx_stage_tracking_board_id ON public.stage_tracking(board_id);
CREATE INDEX idx_stage_tracking_active ON public.stage_tracking(is_active);

ALTER PUBLICATION supabase_realtime ADD TABLE public.stage_tracking;
