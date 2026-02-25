
-- Production flow steps per job (local persistence)
CREATE TABLE public.job_production_flows (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  name text NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  sort_order integer NOT NULL DEFAULT 0,
  responsible_name text,
  started_at timestamp with time zone,
  finished_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_production_flows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job_production_flows" ON public.job_production_flows FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job_production_flows" ON public.job_production_flows FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job_production_flows" ON public.job_production_flows FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job_production_flows" ON public.job_production_flows FOR DELETE USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_job_production_flows_updated_at
  BEFORE UPDATE ON public.job_production_flows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Flow templates (reusable across jobs)
CREATE TABLE public.production_flow_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  steps jsonb NOT NULL DEFAULT '[]',
  created_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.production_flow_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read production_flow_templates" ON public.production_flow_templates FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage production_flow_templates" ON public.production_flow_templates FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TRIGGER update_production_flow_templates_updated_at
  BEFORE UPDATE ON public.production_flow_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
