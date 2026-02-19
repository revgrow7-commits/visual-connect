
CREATE TABLE public.vagas_internas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  titulo TEXT NOT NULL,
  setor TEXT NOT NULL,
  unidade TEXT NOT NULL DEFAULT 'Todas',
  descricao TEXT,
  requisitos TEXT,
  tipo TEXT NOT NULL DEFAULT 'CLT',
  status TEXT NOT NULL DEFAULT 'aberta',
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vagas_internas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Vagas internas visíveis para todos" ON public.vagas_internas FOR SELECT USING (true);
CREATE POLICY "Apenas admin/rh podem inserir vagas" ON public.vagas_internas FOR INSERT WITH CHECK (true);
CREATE POLICY "Apenas admin/rh podem atualizar vagas" ON public.vagas_internas FOR UPDATE USING (true);
CREATE POLICY "Apenas admin/rh podem deletar vagas" ON public.vagas_internas FOR DELETE USING (true);
