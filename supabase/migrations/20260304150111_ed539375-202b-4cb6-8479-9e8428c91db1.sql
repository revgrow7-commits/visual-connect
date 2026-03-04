
-- Add archived column to job_stage_movements
ALTER TABLE public.job_stage_movements ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

-- Allow DELETE on job_stage_movements
CREATE POLICY "Anyone can delete movements" ON public.job_stage_movements FOR DELETE USING (true);

-- Allow UPDATE on job_stage_movements (for archiving)
CREATE POLICY "Anyone can update movements" ON public.job_stage_movements FOR UPDATE USING (true);
