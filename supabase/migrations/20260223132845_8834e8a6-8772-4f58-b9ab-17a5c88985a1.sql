
-- Add new columns to colaboradores for spreadsheet fields
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS matricula text,
  ADD COLUMN IF NOT EXISTS ctps text,
  ADD COLUMN IF NOT EXISTS serie_ctps text,
  ADD COLUMN IF NOT EXISTS uf_ctps text,
  ADD COLUMN IF NOT EXISTS cnh text,
  ADD COLUMN IF NOT EXISTS categoria_cnh text,
  ADD COLUMN IF NOT EXISTS titulo_eleitor text,
  ADD COLUMN IF NOT EXISTS reservista text,
  ADD COLUMN IF NOT EXISTS passaporte text,
  ADD COLUMN IF NOT EXISTS cor_raca text,
  ADD COLUMN IF NOT EXISTS escolaridade text,
  ADD COLUMN IF NOT EXISTS pcd text,
  ADD COLUMN IF NOT EXISTS cbo text,
  ADD COLUMN IF NOT EXISTS cbo_descricao text,
  ADD COLUMN IF NOT EXISTS vale_transporte boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS permissoes jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sst jsonb DEFAULT '{}';

-- Add unique constraint on CPF (only for non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_colaboradores_cpf_unique ON public.colaboradores (cpf) WHERE cpf IS NOT NULL;
