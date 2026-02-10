
-- Table for onboarding conversations
CREATE TABLE public.onboarding_conversas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  titulo text NOT NULL DEFAULT 'Nova Conversa',
  mensagens jsonb NOT NULL DEFAULT '[]'::jsonb,
  cargo text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_conversas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own conversations"
ON public.onboarding_conversas FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations"
ON public.onboarding_conversas FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own conversations"
ON public.onboarding_conversas FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations"
ON public.onboarding_conversas FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_onboarding_conversas_updated_at
BEFORE UPDATE ON public.onboarding_conversas
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
