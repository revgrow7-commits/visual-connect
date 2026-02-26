
-- Drop restrictive INSERT policy
DROP POLICY IF EXISTS "Authenticated can insert job files records" ON public.job_files;

-- Create public INSERT policy
CREATE POLICY "Anyone can insert job files records"
ON public.job_files
FOR INSERT
WITH CHECK (true);

-- Also fix job_links INSERT policy for consistency
DROP POLICY IF EXISTS "Authenticated can insert job links" ON public.job_links;
CREATE POLICY "Anyone can insert job links"
ON public.job_links
FOR INSERT
WITH CHECK (true);

-- Fix job_links DELETE policy
DROP POLICY IF EXISTS "Authenticated can delete job links" ON public.job_links;
CREATE POLICY "Anyone can delete job links"
ON public.job_links
FOR DELETE
USING (true);

-- Fix job_files DELETE policy
DROP POLICY IF EXISTS "Authenticated can delete job files records" ON public.job_files;
CREATE POLICY "Anyone can delete job files records"
ON public.job_files
FOR DELETE
USING (true);
