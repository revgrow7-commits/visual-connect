
-- Table to store recruitment links
CREATE TABLE public.recruitment_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_nome TEXT NOT NULL,
  candidato_email TEXT NOT NULL,
  cargo TEXT NOT NULL,
  unidade TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  expira_em TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'expirado', 'preenchido')),
  campos_extras JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.recruitment_links ENABLE ROW LEVEL SECURITY;

-- RH users can manage links (for now allow authenticated users)
CREATE POLICY "Authenticated users can view links"
  ON public.recruitment_links FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert links"
  ON public.recruitment_links FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update links"
  ON public.recruitment_links FOR UPDATE TO authenticated
  USING (true);

-- Allow anonymous access to validate tokens (candidates accessing the form)
CREATE POLICY "Anyone can read by token"
  ON public.recruitment_links FOR SELECT TO anon
  USING (true);

-- Table to store collaborator data from the admission form
CREATE TABLE public.colaboradores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recruitment_link_id UUID REFERENCES public.recruitment_links(id),
  
  -- Dados Pessoais
  nome TEXT NOT NULL,
  sobrenome TEXT,
  data_nascimento DATE,
  sexo TEXT,
  estado_civil TEXT,
  nacionalidade TEXT,
  naturalidade_cidade TEXT,
  naturalidade_uf TEXT,
  nome_mae TEXT,
  nome_pai TEXT,
  
  -- Documentos
  cpf TEXT,
  rg TEXT,
  rg_orgao TEXT,
  rg_uf TEXT,
  pis_pasep TEXT,
  
  -- Endereço
  cep TEXT,
  endereco TEXT,
  numero TEXT,
  complemento TEXT,
  bairro TEXT,
  cidade TEXT,
  estado TEXT,
  telefone_celular TEXT,
  email_pessoal TEXT,
  
  -- Dados Profissionais
  cargo TEXT,
  setor TEXT,
  unidade TEXT,
  tipo_contratacao TEXT,
  data_admissao DATE,
  
  -- Dados Bancários
  banco TEXT,
  agencia TEXT,
  conta TEXT,
  conta_tipo TEXT,
  pix TEXT,
  
  -- Dependentes & Saúde (JSON)
  dependentes JSONB DEFAULT '[]',
  saude JSONB DEFAULT '{}',
  
  -- Compliance
  compliance_aceito BOOLEAN DEFAULT false,
  compliance_ip TEXT,
  compliance_user_agent TEXT,
  compliance_timestamp TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'ativo', 'inativo')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.colaboradores ENABLE ROW LEVEL SECURITY;

-- Authenticated users (RH) can view all collaborators
CREATE POLICY "Authenticated users can view colaboradores"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (true);

-- Anyone can insert (candidate filling the form via token)
CREATE POLICY "Anyone can insert colaborador"
  ON public.colaboradores FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Authenticated can insert colaborador"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (true);

-- Authenticated users can update
CREATE POLICY "Authenticated users can update colaboradores"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_colaboradores_updated_at
  BEFORE UPDATE ON public.colaboradores
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
