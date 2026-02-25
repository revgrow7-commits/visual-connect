
-- Allow public insert/update/delete on job_board_assignments (matching job_item_assignments pattern)
DROP POLICY IF EXISTS "Authenticated can insert board assignments" ON public.job_board_assignments;
DROP POLICY IF EXISTS "Authenticated can update board assignments" ON public.job_board_assignments;
DROP POLICY IF EXISTS "Authenticated can delete board assignments" ON public.job_board_assignments;

CREATE POLICY "Public insert board assignments" ON public.job_board_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public update board assignments" ON public.job_board_assignments FOR UPDATE USING (true);
CREATE POLICY "Public delete board assignments" ON public.job_board_assignments FOR DELETE USING (true);
