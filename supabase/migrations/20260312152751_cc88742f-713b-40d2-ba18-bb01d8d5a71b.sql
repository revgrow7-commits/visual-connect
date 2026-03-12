
ALTER TABLE public.job_equipment_assignments
  ADD COLUMN IF NOT EXISTS board_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS board_name text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stage_name text DEFAULT NULL;
