
-- ─────────────────────────────────────────────
-- EXTENSÃO DE JOB (dados extras não existentes no Holdprint)
-- ─────────────────────────────────────────────
CREATE TABLE public.job_extensions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holdprint_job_id TEXT NOT NULL UNIQUE,
  prioridade TEXT NOT NULL DEFAULT 'normal',
  tags TEXT[] DEFAULT '{}',
  notas_internas TEXT,
  times_envolvidos TEXT[] DEFAULT '{}',
  arquivado_localmente BOOLEAN DEFAULT false,
  arquivado_em TIMESTAMPTZ,
  arquivado_por TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_extensions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job_extensions" ON public.job_extensions FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job_extensions" ON public.job_extensions FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job_extensions" ON public.job_extensions FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job_extensions" ON public.job_extensions FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_job_extensions_updated_at
  BEFORE UPDATE ON public.job_extensions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─────────────────────────────────────────────
-- COMENTÁRIOS HUMANOS (separados do log API do Holdprint)
-- ─────────────────────────────────────────────
CREATE TABLE public.job_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holdprint_job_id TEXT NOT NULL,
  autor_nome TEXT NOT NULL DEFAULT 'Usuário',
  autor_tipo TEXT NOT NULL DEFAULT 'humano',
  mensagem TEXT NOT NULL,
  mencoes TEXT[] DEFAULT '{}',
  anexos JSONB DEFAULT '[]',
  editado BOOLEAN DEFAULT false,
  editado_em TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.job_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job_comments" ON public.job_comments FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job_comments" ON public.job_comments FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update job_comments" ON public.job_comments FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job_comments" ON public.job_comments FOR DELETE USING (auth.uid() IS NOT NULL);

-- ─────────────────────────────────────────────
-- STATUS DA ESTEIRA INTERNA (por item, por etapa)
-- ─────────────────────────────────────────────
CREATE TABLE public.team_pipeline_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  holdprint_job_id TEXT NOT NULL,
  holdprint_item_id TEXT NOT NULL,
  etapa TEXT NOT NULL,
  sub_status TEXT NOT NULL DEFAULT 'a_fazer',
  responsavel_nome TEXT,
  iniciado_em TIMESTAMPTZ,
  concluido_em TIMESTAMPTZ,
  pendencia_descricao TEXT,
  updated_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (holdprint_job_id, holdprint_item_id, etapa)
);

ALTER TABLE public.team_pipeline_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read team_pipeline_status" ON public.team_pipeline_status FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert team_pipeline_status" ON public.team_pipeline_status FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can update team_pipeline_status" ON public.team_pipeline_status FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete team_pipeline_status" ON public.team_pipeline_status FOR DELETE USING (auth.uid() IS NOT NULL);

CREATE TRIGGER update_team_pipeline_status_updated_at
  BEFORE UPDATE ON public.team_pipeline_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Index para performance
CREATE INDEX idx_job_extensions_holdprint_id ON public.job_extensions(holdprint_job_id);
CREATE INDEX idx_job_comments_holdprint_id ON public.job_comments(holdprint_job_id);
CREATE INDEX idx_team_pipeline_holdprint_id ON public.team_pipeline_status(holdprint_job_id);
CREATE INDEX idx_team_pipeline_item ON public.team_pipeline_status(holdprint_job_id, holdprint_item_id);
