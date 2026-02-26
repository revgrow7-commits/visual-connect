
-- Add date management and link attachment fields to job_extensions
ALTER TABLE public.job_extensions
  ADD COLUMN IF NOT EXISTS data_inicio timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS data_entrega timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS lembrete text DEFAULT 'nenhum',
  ADD COLUMN IF NOT EXISTS recorrente text DEFAULT 'nunca';

-- Add link attachments table for jobs
CREATE TABLE IF NOT EXISTS public.job_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  url text NOT NULL,
  display_text text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.job_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read job links" ON public.job_links FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job links" ON public.job_links FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated can delete job links" ON public.job_links FOR DELETE USING (auth.uid() IS NOT NULL);
