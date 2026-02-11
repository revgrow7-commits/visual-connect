
-- Create ouvidoria manifestacoes table
CREATE TABLE public.ouvidoria_manifestacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  protocolo text NOT NULL UNIQUE,
  unidade text NOT NULL,
  setor text NOT NULL,
  categoria text NOT NULL,
  anonimo boolean NOT NULL DEFAULT true,
  nome text,
  setor_identificacao text,
  unidade_identificacao text,
  email text,
  descricao text NOT NULL,
  urgencia text NOT NULL,
  status text NOT NULL DEFAULT 'aberto',
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ouvidoria_manifestacoes ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage ouvidoria"
ON public.ouvidoria_manifestacoes FOR ALL TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Authenticated users can insert
CREATE POLICY "Authenticated can insert ouvidoria"
ON public.ouvidoria_manifestacoes FOR INSERT TO authenticated
WITH CHECK (true);

-- Users can read own non-anonymous submissions
CREATE POLICY "Users can read own submissions"
ON public.ouvidoria_manifestacoes FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- Timestamp trigger
CREATE TRIGGER update_ouvidoria_updated_at
BEFORE UPDATE ON public.ouvidoria_manifestacoes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for ouvidoria attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ouvidoria-anexos', 'ouvidoria-anexos', false);

-- Storage policies
CREATE POLICY "Authenticated can upload ouvidoria anexos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'ouvidoria-anexos');

CREATE POLICY "Admins can read ouvidoria anexos"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'ouvidoria-anexos' AND public.has_role(auth.uid(), 'admin'::app_role));

-- Sequence for protocol numbers
CREATE SEQUENCE public.ouvidoria_protocolo_seq START 1;

-- Function to generate protocol
CREATE OR REPLACE FUNCTION public.generate_ouvidoria_protocolo()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.protocolo := 'OUV-' || to_char(now(), 'YYMM') || '-' || lpad(nextval('public.ouvidoria_protocolo_seq')::text, 4, '0');
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ouvidoria_protocolo
BEFORE INSERT ON public.ouvidoria_manifestacoes
FOR EACH ROW
EXECUTE FUNCTION public.generate_ouvidoria_protocolo();
