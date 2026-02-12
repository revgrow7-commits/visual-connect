
-- Habilitar extensão pgvector
CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- Tabela principal de documentos processados (chunks RAG)
CREATE TABLE public.rag_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding extensions.vector(1536),
  metadata JSONB NOT NULL DEFAULT '{}',
  sector TEXT NOT NULL,
  source_type TEXT NOT NULL,
  original_filename TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de arquivos originais
CREATE TABLE public.rag_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  filename TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT,
  sector TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  uploaded_by UUID,
  processed BOOLEAN DEFAULT false,
  chunk_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cache de dados da API Holdprint
CREATE TABLE public.holdprint_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  endpoint TEXT NOT NULL,
  record_id TEXT NOT NULL,
  raw_data JSONB NOT NULL,
  content_text TEXT,
  embedding extensions.vector(1536),
  last_synced TIMESTAMPTZ DEFAULT now(),
  UNIQUE(endpoint, record_id)
);

-- Tabela de sugestões de melhoria do orquestrador
CREATE TABLE public.improvement_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo TEXT NOT NULL DEFAULT 'melhoria',
  setor_destino TEXT NOT NULL,
  prioridade TEXT NOT NULL DEFAULT 'media',
  titulo TEXT NOT NULL,
  contexto TEXT,
  acao_sugerida TEXT,
  dados_base TEXT[],
  kpi_meta TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  created_by UUID,
  assigned_to UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Tabela de memória dos agentes (conversas por setor)
CREATE TABLE public.agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sector TEXT NOT NULL,
  messages JSONB NOT NULL DEFAULT '[]',
  titulo TEXT NOT NULL DEFAULT 'Nova Conversa',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Índices vetoriais
CREATE INDEX ON public.rag_documents
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX ON public.holdprint_cache
  USING ivfflat (embedding extensions.vector_cosine_ops)
  WITH (lists = 50);

-- Índices de filtro
CREATE INDEX idx_rag_sector ON public.rag_documents(sector);
CREATE INDEX idx_rag_source ON public.rag_documents(source_type);
CREATE INDEX idx_holdprint_endpoint ON public.holdprint_cache(endpoint);
CREATE INDEX idx_agent_conv_user_sector ON public.agent_conversations(user_id, sector);
CREATE INDEX idx_improvement_setor ON public.improvement_suggestions(setor_destino);

-- RLS
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rag_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holdprint_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.improvement_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_conversations ENABLE ROW LEVEL SECURITY;

-- rag_documents: admins gerenciam, autenticados leem
CREATE POLICY "Admins can manage rag_documents" ON public.rag_documents
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read rag_documents" ON public.rag_documents
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- rag_files: admins gerenciam, autenticados leem e fazem upload
CREATE POLICY "Admins can manage rag_files" ON public.rag_files
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read rag_files" ON public.rag_files
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can upload rag_files" ON public.rag_files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = uploaded_by);

-- holdprint_cache: admins gerenciam, autenticados leem
CREATE POLICY "Admins can manage holdprint_cache" ON public.holdprint_cache
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read holdprint_cache" ON public.holdprint_cache
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- improvement_suggestions: admins gerenciam tudo, autenticados leem do seu setor
CREATE POLICY "Admins can manage improvements" ON public.improvement_suggestions
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated can read improvements" ON public.improvement_suggestions
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- agent_conversations: usuários gerenciam suas próprias
CREATE POLICY "Users can manage own agent conversations" ON public.agent_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can read all agent conversations" ON public.agent_conversations
  FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Função de busca vetorial RAG
CREATE OR REPLACE FUNCTION public.search_rag(
  query_embedding extensions.vector(1536),
  filter_sector TEXT DEFAULT NULL,
  filter_source TEXT DEFAULT NULL,
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE(
  id UUID,
  content TEXT,
  metadata JSONB,
  sector TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.content,
    d.metadata,
    d.sector,
    (1 - (d.embedding <=> query_embedding))::FLOAT as similarity
  FROM public.rag_documents d
  WHERE
    (filter_sector IS NULL OR d.sector = filter_sector)
    AND (filter_source IS NULL OR d.source_type = filter_source)
    AND (1 - (d.embedding <=> query_embedding)) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Trigger para updated_at
CREATE TRIGGER update_rag_documents_updated_at BEFORE UPDATE ON public.rag_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_improvement_suggestions_updated_at BEFORE UPDATE ON public.improvement_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_agent_conversations_updated_at BEFORE UPDATE ON public.agent_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket para documentos RAG
INSERT INTO storage.buckets (id, name, public) VALUES ('rag-documents', 'rag-documents', false);

CREATE POLICY "Authenticated can upload rag docs" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'rag-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can read rag docs" ON storage.objects
  FOR SELECT USING (bucket_id = 'rag-documents' AND auth.uid() IS NOT NULL);
CREATE POLICY "Admins can delete rag docs" ON storage.objects
  FOR DELETE USING (bucket_id = 'rag-documents' AND has_role(auth.uid(), 'admin'));
