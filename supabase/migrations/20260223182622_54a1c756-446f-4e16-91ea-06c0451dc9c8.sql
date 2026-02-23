
-- Table to track item-to-collaborator assignments
CREATE TABLE public.job_item_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id TEXT NOT NULL,
  item_id UUID REFERENCES public.job_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  collaborator_name TEXT NOT NULL,
  assigned_by TEXT DEFAULT 'Sistema',
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast lookups
CREATE INDEX idx_job_item_assignments_job ON public.job_item_assignments(job_id);
CREATE INDEX idx_job_item_assignments_item ON public.job_item_assignments(item_id);

-- Enable RLS with public access (matching project pattern)
ALTER TABLE public.job_item_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON public.job_item_assignments FOR SELECT USING (true);
CREATE POLICY "Public insert access" ON public.job_item_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update access" ON public.job_item_assignments FOR UPDATE USING (true);
CREATE POLICY "Public delete access" ON public.job_item_assignments FOR DELETE USING (true);

-- Auto-update timestamp
CREATE TRIGGER update_job_item_assignments_updated_at
  BEFORE UPDATE ON public.job_item_assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
