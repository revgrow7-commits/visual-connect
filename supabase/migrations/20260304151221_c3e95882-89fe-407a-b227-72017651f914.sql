
-- Drop restrictive policies
DROP POLICY IF EXISTS "Anyone can archive jobs" ON public.job_archives;
DROP POLICY IF EXISTS "Anyone can unarchive jobs" ON public.job_archives;
DROP POLICY IF EXISTS "Anyone can view archived jobs" ON public.job_archives;

-- Recreate as PERMISSIVE
CREATE POLICY "Anyone can view archived jobs" ON public.job_archives FOR SELECT USING (true);
CREATE POLICY "Anyone can archive jobs" ON public.job_archives FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can unarchive jobs" ON public.job_archives FOR DELETE USING (true);
