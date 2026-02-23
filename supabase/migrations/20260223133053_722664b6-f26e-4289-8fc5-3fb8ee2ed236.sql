
-- Table to track job/item assignments to boards with full audit trail
CREATE TABLE public.job_board_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_code INTEGER,
  job_title TEXT,
  customer_name TEXT,
  item_id UUID REFERENCES public.job_items(id) ON DELETE SET NULL,
  item_name TEXT,
  board_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  stage_id TEXT,
  stage_name TEXT,
  assigned_by TEXT DEFAULT 'Sistema',
  assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Enable RLS
ALTER TABLE public.job_board_assignments ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can read board assignments"
  ON public.job_board_assignments FOR SELECT USING (true);

CREATE POLICY "Authenticated can insert board assignments"
  ON public.job_board_assignments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update board assignments"
  ON public.job_board_assignments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete board assignments"
  ON public.job_board_assignments FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Indexes for fast lookups
CREATE INDEX idx_job_board_assignments_job_id ON public.job_board_assignments(job_id);
CREATE INDEX idx_job_board_assignments_board_id ON public.job_board_assignments(board_id);
CREATE INDEX idx_job_board_assignments_item_id ON public.job_board_assignments(item_id);
CREATE INDEX idx_job_board_assignments_active ON public.job_board_assignments(is_active) WHERE is_active = true;

-- Trigger for updated_at
CREATE TRIGGER update_job_board_assignments_updated_at
  BEFORE UPDATE ON public.job_board_assignments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for live tracking
ALTER PUBLICATION supabase_realtime ADD TABLE public.job_board_assignments;
