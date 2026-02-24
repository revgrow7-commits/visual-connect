
-- Add deadline column to job_item_assignments
ALTER TABLE public.job_item_assignments ADD COLUMN deadline timestamp with time zone DEFAULT NULL;
