
-- Comunicados table
CREATE TABLE public.comunicados (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  conteudo TEXT,
  categoria TEXT NOT NULL DEFAULT 'Geral',
  unidade TEXT NOT NULL DEFAULT 'Todas',
  fixado BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'ativo',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.comunicados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage comunicados"
  ON public.comunicados FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated users can read comunicados"
  ON public.comunicados FOR SELECT TO authenticated
  USING (status = 'ativo');

-- Trigger for updated_at
CREATE TRIGGER update_comunicados_updated_at
  BEFORE UPDATE ON public.comunicados
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
