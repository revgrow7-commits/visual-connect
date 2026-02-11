
-- Add hiring/contratação fields to recruitment_links
ALTER TABLE public.recruitment_links
  ADD COLUMN IF NOT EXISTS setor text,
  ADD COLUMN IF NOT EXISTS tipo_contratacao text,
  ADD COLUMN IF NOT EXISTS data_admissao date,
  ADD COLUMN IF NOT EXISTS jornada text,
  ADD COLUMN IF NOT EXISTS horario text,
  ADD COLUMN IF NOT EXISTS escala text,
  ADD COLUMN IF NOT EXISTS salario_base text,
  ADD COLUMN IF NOT EXISTS adicionais text;
