
-- Add salary/benefits columns
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS salario_base text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS adicionais text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS beneficios jsonb DEFAULT '{}';

-- Add conditional documents (AVSEC, antecedentes, etc.)
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS documentos_extras jsonb DEFAULT '{}';

-- Add compliance versioning
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS compliance_versao text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS compliance_hash text;

-- Add escala for profissionais
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS escala text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS horario text;
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS jornada text;
