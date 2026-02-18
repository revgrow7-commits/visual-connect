
-- CS Tickets (Reclamações)
CREATE TABLE public.cs_tickets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL DEFAULT ('RCL-' || lpad(floor(random() * 999 + 1)::text, 3, '0')),
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  customer_name TEXT NOT NULL,
  customer_id INTEGER,
  job_code INTEGER,
  job_title TEXT,
  category TEXT NOT NULL DEFAULT 'other',
  priority TEXT NOT NULL DEFAULT 'medium',
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  responsible_name TEXT NOT NULL DEFAULT 'Não atribuído',
  resolved_date TIMESTAMPTZ,
  resolution TEXT,
  sla_response_deadline TIMESTAMPTZ,
  sla_response_actual TIMESTAMPTZ,
  sla_response_breached BOOLEAN DEFAULT false,
  sla_resolution_deadline TIMESTAMPTZ,
  sla_resolution_actual TIMESTAMPTZ,
  sla_resolution_breached BOOLEAN DEFAULT false,
  escalation_level TEXT DEFAULT 'N1',
  escalation_history JSONB DEFAULT '[]',
  unidade TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cs_tickets" ON public.cs_tickets FOR ALL USING (true) WITH CHECK (true);

-- CS Visitas Técnicas
CREATE TABLE public.cs_visitas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL DEFAULT ('VT-' || lpad(floor(random() * 999 + 1)::text, 3, '0')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_id INTEGER,
  customer_address TEXT,
  type TEXT NOT NULL DEFAULT 'preventive_maintenance',
  description TEXT NOT NULL DEFAULT '',
  technician_name TEXT NOT NULL DEFAULT 'Não atribuído',
  job_code INTEGER,
  complaint_id TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled',
  report_status TEXT DEFAULT 'pending',
  report_notes TEXT,
  duration_minutes INTEGER,
  unidade TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_visitas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cs_visitas" ON public.cs_visitas FOR ALL USING (true) WITH CHECK (true);

-- CS Oportunidades
CREATE TABLE public.cs_oportunidades (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'upsell',
  customer_name TEXT NOT NULL,
  customer_id INTEGER,
  health_score INTEGER DEFAULT 0,
  estimated_value NUMERIC DEFAULT 0,
  description TEXT NOT NULL DEFAULT '',
  context TEXT,
  next_step TEXT,
  timing TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  responsible_name TEXT NOT NULL DEFAULT 'Não atribuído',
  related_job_code INTEGER,
  unidade TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_oportunidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cs_oportunidades" ON public.cs_oportunidades FOR ALL USING (true) WITH CHECK (true);

-- CS Touchpoints (Régua de Relacionamento)
CREATE TABLE public.cs_touchpoints (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date TIMESTAMPTZ NOT NULL,
  customer_name TEXT NOT NULL,
  customer_id INTEGER,
  type TEXT NOT NULL DEFAULT 'post_delivery_follow',
  channel TEXT NOT NULL DEFAULT 'phone',
  trigger_reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  responsible_name TEXT NOT NULL DEFAULT 'Não atribuído',
  notes TEXT,
  unidade TEXT,
  created_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.cs_touchpoints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can manage cs_touchpoints" ON public.cs_touchpoints FOR ALL USING (true) WITH CHECK (true);

-- Update trigger for all tables
CREATE OR REPLACE FUNCTION public.update_cs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_cs_tickets_updated_at BEFORE UPDATE ON public.cs_tickets FOR EACH ROW EXECUTE FUNCTION public.update_cs_updated_at();
CREATE TRIGGER update_cs_visitas_updated_at BEFORE UPDATE ON public.cs_visitas FOR EACH ROW EXECUTE FUNCTION public.update_cs_updated_at();
CREATE TRIGGER update_cs_oportunidades_updated_at BEFORE UPDATE ON public.cs_oportunidades FOR EACH ROW EXECUTE FUNCTION public.update_cs_updated_at();
CREATE TRIGGER update_cs_touchpoints_updated_at BEFORE UPDATE ON public.cs_touchpoints FOR EACH ROW EXECUTE FUNCTION public.update_cs_updated_at();
