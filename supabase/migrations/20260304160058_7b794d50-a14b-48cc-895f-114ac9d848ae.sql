
-- Tabela de etiquetas personalizadas
CREATE TABLE public.etiquetas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  cor text NOT NULL DEFAULT 'blue',
  descricao text,
  ativa boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by text DEFAULT 'Sistema'
);

-- Tabela de histórico de etiquetas (para consultas e agente)
CREATE TABLE public.etiquetas_historico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  etiqueta_id uuid REFERENCES public.etiquetas(id) ON DELETE SET NULL,
  acao text NOT NULL, -- 'criada', 'editada', 'excluida', 'ativada', 'desativada'
  dados_anteriores jsonb,
  dados_novos jsonb,
  executado_por text DEFAULT 'Sistema',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.etiquetas_historico ENABLE ROW LEVEL SECURITY;

-- Policies permissivas para etiquetas
CREATE POLICY "Anyone can read etiquetas" ON public.etiquetas FOR SELECT USING (true);
CREATE POLICY "Anyone can insert etiquetas" ON public.etiquetas FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update etiquetas" ON public.etiquetas FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete etiquetas" ON public.etiquetas FOR DELETE USING (true);

-- Policies permissivas para histórico
CREATE POLICY "Anyone can read etiquetas_historico" ON public.etiquetas_historico FOR SELECT USING (true);
CREATE POLICY "Anyone can insert etiquetas_historico" ON public.etiquetas_historico FOR INSERT WITH CHECK (true);

-- Trigger para updated_at
CREATE TRIGGER update_etiquetas_updated_at
  BEFORE UPDATE ON public.etiquetas
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
