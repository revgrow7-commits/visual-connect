
-- Job Items (local CRUD, merged with Holdprint data)
CREATE TABLE public.job_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 1,
  unit TEXT NOT NULL DEFAULT 'un',
  format TEXT,
  unit_value NUMERIC NOT NULL DEFAULT 0,
  total_value NUMERIC NOT NULL DEFAULT 0,
  checked BOOLEAN NOT NULL DEFAULT false,
  observation TEXT,
  flexfields JSONB DEFAULT '{}',
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job items" ON public.job_items FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job items" ON public.job_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job items" ON public.job_items FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job items" ON public.job_items FOR DELETE USING (auth.uid() IS NOT NULL);

-- Job Checklist
CREATE TABLE public.job_checklist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  title TEXT NOT NULL,
  checked BOOLEAN NOT NULL DEFAULT false,
  responsible_name TEXT,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_checklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job checklist" ON public.job_checklist FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job checklist" ON public.job_checklist FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job checklist" ON public.job_checklist FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job checklist" ON public.job_checklist FOR DELETE USING (auth.uid() IS NOT NULL);

-- Job Time Entries
CREATE TABLE public.job_time_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  user_name TEXT NOT NULL,
  description TEXT,
  minutes INT NOT NULL DEFAULT 0,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read time entries" ON public.job_time_entries FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert time entries" ON public.job_time_entries FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete time entries" ON public.job_time_entries FOR DELETE USING (auth.uid() IS NOT NULL);

-- Job Materials (local CRUD, merged with Holdprint feedstocks)
CREATE TABLE public.job_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity NUMERIC NOT NULL DEFAULT 0,
  unit TEXT NOT NULL DEFAULT 'un',
  unit_cost NUMERIC NOT NULL DEFAULT 0,
  total_cost NUMERIC NOT NULL DEFAULT 0,
  supplier TEXT,
  observation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job materials" ON public.job_materials FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job materials" ON public.job_materials FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job materials" ON public.job_materials FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job materials" ON public.job_materials FOR DELETE USING (auth.uid() IS NOT NULL);

-- Job History / Comments
CREATE TABLE public.job_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id TEXT NOT NULL,
  event_type TEXT NOT NULL DEFAULT 'comment',
  user_name TEXT NOT NULL DEFAULT 'Sistema',
  content TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.job_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job history" ON public.job_history FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job history" ON public.job_history FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX idx_job_items_job_id ON public.job_items(job_id);
CREATE INDEX idx_job_checklist_job_id ON public.job_checklist(job_id);
CREATE INDEX idx_job_time_entries_job_id ON public.job_time_entries(job_id);
CREATE INDEX idx_job_materials_job_id ON public.job_materials(job_id);
CREATE INDEX idx_job_history_job_id ON public.job_history(job_id);
CREATE INDEX idx_job_history_created_at ON public.job_history(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_job_items_updated_at BEFORE UPDATE ON public.job_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_checklist_updated_at BEFORE UPDATE ON public.job_checklist FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_materials_updated_at BEFORE UPDATE ON public.job_materials FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
