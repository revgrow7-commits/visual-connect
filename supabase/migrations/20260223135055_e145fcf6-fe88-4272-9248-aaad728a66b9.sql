
-- Replace partial unique index with a proper unique constraint for upsert support
DROP INDEX IF EXISTS idx_colaboradores_cpf_unique;
ALTER TABLE public.colaboradores ADD CONSTRAINT colaboradores_cpf_unique UNIQUE (cpf);
