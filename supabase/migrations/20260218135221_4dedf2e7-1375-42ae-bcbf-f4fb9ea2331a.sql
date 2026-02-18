
-- Add survey fields to cs_tickets
ALTER TABLE public.cs_tickets
ADD COLUMN IF NOT EXISTS survey_token text UNIQUE,
ADD COLUMN IF NOT EXISTS survey_completed_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS survey_rating integer,
ADD COLUMN IF NOT EXISTS survey_feedback text,
ADD COLUMN IF NOT EXISTS survey_would_recommend boolean;

-- Create index for fast token lookup
CREATE INDEX IF NOT EXISTS idx_cs_tickets_survey_token ON public.cs_tickets(survey_token) WHERE survey_token IS NOT NULL;
