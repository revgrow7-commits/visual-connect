
-- Add section visibility permissions column to colaboradores
ALTER TABLE public.colaboradores ADD COLUMN IF NOT EXISTS secoes_visiveis text[] DEFAULT '{}';

-- Add comment for documentation
COMMENT ON COLUMN public.colaboradores.secoes_visiveis IS 'Seções que o colaborador pode visualizar no sistema';
