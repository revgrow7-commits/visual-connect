
-- Table to track every Kanban movement for KPI reporting
CREATE TABLE public.job_stage_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_code INTEGER,
  job_title TEXT,
  customer_name TEXT,
  board_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  from_stage_id TEXT,
  from_stage_name TEXT,
  to_stage_id TEXT NOT NULL,
  to_stage_name TEXT NOT NULL,
  moved_by TEXT DEFAULT 'Sistema',
  movement_type TEXT NOT NULL DEFAULT 'drag_drop', -- drag_drop, assignment, stage_change
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_stage_movements ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read movements" ON public.job_stage_movements FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert movements" ON public.job_stage_movements FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes for KPI queries
CREATE INDEX idx_job_stage_movements_job ON public.job_stage_movements (job_id);
CREATE INDEX idx_job_stage_movements_board ON public.job_stage_movements (board_id);
CREATE INDEX idx_job_stage_movements_created ON public.job_stage_movements (created_at DESC);
CREATE INDEX idx_job_stage_movements_stages ON public.job_stage_movements (from_stage_id, to_stage_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_stage_movements;
