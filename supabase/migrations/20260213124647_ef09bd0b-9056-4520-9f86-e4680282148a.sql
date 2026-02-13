-- Drop both partial indexes (they are indexes, not constraints)
DROP INDEX IF EXISTS public.rag_documents_original_filename_key;
DROP INDEX IF EXISTS public.rag_documents_original_filename_unique;

-- Fill NULLs
UPDATE public.rag_documents SET original_filename = 'legacy_' || id::text WHERE original_filename IS NULL;

-- Create proper non-partial unique index
CREATE UNIQUE INDEX rag_documents_original_filename_unique ON public.rag_documents (original_filename);