
-- Table to store imported Secullum banco de horas data
CREATE TABLE public.banco_horas (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  competencia text NOT NULL, -- "YYYY-MM"
  pis text NOT NULL,
  nome text NOT NULL,
  cargo text,
  departamento text,
  unidade text,
  email text,
  normais text DEFAULT '00:00',
  carga text DEFAULT '00:00',
  faltas text DEFAULT '00:00',
  ex60 text DEFAULT '00:00',
  ex80 text DEFAULT '00:00',
  ex100 text DEFAULT '00:00',
  b_saldo text DEFAULT '00:00',
  b_total text DEFAULT '00:00',
  b_cred text DEFAULT '00:00',
  b_deb text DEFAULT '00:00',
  saldo_decimal numeric DEFAULT 0,
  raw_data jsonb DEFAULT '{}',
  imported_at timestamp with time zone NOT NULL DEFAULT now(),
  imported_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(competencia, pis)
);

-- Enable RLS
ALTER TABLE public.banco_horas ENABLE ROW LEVEL SECURITY;

-- Only admins can access
CREATE POLICY "Admins can manage banco_horas"
  ON public.banco_horas FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Index for fast lookups
CREATE INDEX idx_banco_horas_competencia ON public.banco_horas(competencia);
CREATE INDEX idx_banco_horas_pis ON public.banco_horas(pis);

-- Trigger for updated_at
CREATE TRIGGER update_banco_horas_updated_at
  BEFORE UPDATE ON public.banco_horas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
