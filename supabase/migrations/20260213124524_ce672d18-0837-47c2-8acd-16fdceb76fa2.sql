CREATE UNIQUE INDEX IF NOT EXISTS rag_documents_original_filename_key 
ON public.rag_documents (original_filename) 
WHERE original_filename IS NOT NULL;