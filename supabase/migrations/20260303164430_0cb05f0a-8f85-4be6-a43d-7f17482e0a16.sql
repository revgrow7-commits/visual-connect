
CREATE TABLE public.job_equipment_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  job_code INTEGER,
  job_title TEXT,
  customer_name TEXT,
  equipment TEXT NOT NULL,
  assigned_by TEXT DEFAULT 'Sistema',
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.job_equipment_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read equipment assignments" ON public.job_equipment_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert equipment assignments" ON public.job_equipment_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update equipment assignments" ON public.job_equipment_assignments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete equipment assignments" ON public.job_equipment_assignments FOR DELETE USING (true);

CREATE INDEX idx_job_equipment_job_id ON public.job_equipment_assignments(job_id);
CREATE INDEX idx_job_equipment_active ON public.job_equipment_assignments(is_active);
