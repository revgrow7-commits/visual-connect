
-- Onboarding Trails
CREATE TABLE public.onboarding_trilhas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  descricao text,
  cargo text NOT NULL,
  unidade text DEFAULT 'Todas',
  ativo boolean NOT NULL DEFAULT true,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_trilhas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage trilhas"
ON public.onboarding_trilhas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read active trilhas"
ON public.onboarding_trilhas FOR SELECT
USING (ativo = true);

CREATE TRIGGER update_onboarding_trilhas_updated_at
BEFORE UPDATE ON public.onboarding_trilhas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trail Steps
CREATE TABLE public.onboarding_etapas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trilha_id uuid NOT NULL REFERENCES public.onboarding_trilhas(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  descricao text,
  tipo text NOT NULL DEFAULT 'checklist', -- checklist, video, documento
  conteudo_url text, -- URL for video or document
  obrigatoria boolean NOT NULL DEFAULT true,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.onboarding_etapas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage etapas"
ON public.onboarding_etapas FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read etapas"
ON public.onboarding_etapas FOR SELECT
USING (true);

CREATE TRIGGER update_onboarding_etapas_updated_at
BEFORE UPDATE ON public.onboarding_etapas
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- User Progress
CREATE TABLE public.onboarding_progresso (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  etapa_id uuid NOT NULL REFERENCES public.onboarding_etapas(id) ON DELETE CASCADE,
  concluida boolean NOT NULL DEFAULT false,
  concluida_em timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, etapa_id)
);

ALTER TABLE public.onboarding_progresso ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress"
ON public.onboarding_progresso FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.onboarding_progresso FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.onboarding_progresso FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all progress"
ON public.onboarding_progresso FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_onboarding_progresso_updated_at
BEFORE UPDATE ON public.onboarding_progresso
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
