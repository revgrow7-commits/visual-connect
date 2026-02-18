
-- Allow authenticated users to insert rag_documents (for CS ticket RAG registration)
CREATE POLICY "Authenticated can insert rag_documents"
ON public.rag_documents
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
