
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can manage trilhas" ON public.onboarding_trilhas;
DROP POLICY IF EXISTS "Authenticated users can read active trilhas" ON public.onboarding_trilhas;

-- Recreate as PERMISSIVE
CREATE POLICY "Admins can manage trilhas"
ON public.onboarding_trilhas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read active trilhas"
ON public.onboarding_trilhas
FOR SELECT
USING (ativo = true);

-- Fix same issue on onboarding_etapas
DROP POLICY IF EXISTS "Admins can manage etapas" ON public.onboarding_etapas;
DROP POLICY IF EXISTS "Authenticated users can read etapas" ON public.onboarding_etapas;

CREATE POLICY "Admins can manage etapas"
ON public.onboarding_etapas
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated users can read etapas"
ON public.onboarding_etapas
FOR SELECT
USING (true);

-- Fix same issue on onboarding_progresso
DROP POLICY IF EXISTS "Admins can view all progress" ON public.onboarding_progresso;
DROP POLICY IF EXISTS "Users can insert own progress" ON public.onboarding_progresso;
DROP POLICY IF EXISTS "Users can update own progress" ON public.onboarding_progresso;
DROP POLICY IF EXISTS "Users can view own progress" ON public.onboarding_progresso;

CREATE POLICY "Admins can view all progress"
ON public.onboarding_progresso
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own progress"
ON public.onboarding_progresso
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
ON public.onboarding_progresso
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
ON public.onboarding_progresso
FOR UPDATE
USING (auth.uid() = user_id);
