
-- Add parent_board_id to kanban_boards for micro board hierarchy
ALTER TABLE public.kanban_boards ADD COLUMN IF NOT EXISTS parent_board_id text DEFAULT NULL;

-- Add linked_stage_id to indicate which stage of the parent board this micro board is linked to
ALTER TABLE public.kanban_boards ADD COLUMN IF NOT EXISTS linked_stage_id text DEFAULT NULL;

-- Add board_type to distinguish main boards from micro boards
ALTER TABLE public.kanban_boards ADD COLUMN IF NOT EXISTS board_type text NOT NULL DEFAULT 'main';

-- Track micro board assignments: which job is sent to which micro board
CREATE TABLE IF NOT EXISTS public.micro_board_assignments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  job_code integer,
  job_title text,
  customer_name text,
  parent_board_id text NOT NULL,
  parent_stage_id text,
  parent_stage_name text,
  micro_board_id text NOT NULL,
  micro_stage_id text,
  micro_stage_name text,
  assigned_by text DEFAULT 'Sistema',
  assigned_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  status text NOT NULL DEFAULT 'active',
  notified_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.micro_board_assignments ENABLE ROW LEVEL SECURITY;

-- Public access policies (consistent with other job tables)
CREATE POLICY "Anyone can read micro_board_assignments" ON public.micro_board_assignments FOR SELECT USING (true);
CREATE POLICY "Anyone can insert micro_board_assignments" ON public.micro_board_assignments FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update micro_board_assignments" ON public.micro_board_assignments FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete micro_board_assignments" ON public.micro_board_assignments FOR DELETE USING (true);
