
-- =============================================
-- FIX 1: COLABORADORES - Remove anon access to sensitive PII
-- =============================================

-- Drop dangerous anon policies
DROP POLICY IF EXISTS "Anon can read own recruitment data" ON public.colaboradores;
DROP POLICY IF EXISTS "Anon can insert colaboradores via recruitment" ON public.colaboradores;

-- Allow authenticated users to read their own recruitment data
CREATE POLICY "Authenticated can read own recruitment data"
ON public.colaboradores FOR SELECT
TO authenticated
USING (
  recruitment_link_id IS NOT NULL
  AND recruitment_link_id IN (
    SELECT id FROM public.recruitment_links 
    WHERE candidato_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to insert via recruitment
CREATE POLICY "Authenticated can insert via recruitment"
ON public.colaboradores FOR INSERT
TO authenticated
WITH CHECK (
  recruitment_link_id IS NOT NULL
  AND recruitment_link_id IN (
    SELECT id FROM public.recruitment_links 
    WHERE candidato_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow authenticated users to update their own recruitment data
CREATE POLICY "Authenticated can update own recruitment data"
ON public.colaboradores FOR UPDATE
TO authenticated
USING (
  recruitment_link_id IS NOT NULL
  AND recruitment_link_id IN (
    SELECT id FROM public.recruitment_links 
    WHERE candidato_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- =============================================
-- FIX 2: RECRUITMENT_LINKS - Remove open anon read
-- =============================================

-- Drop dangerous open anon SELECT
DROP POLICY IF EXISTS "Anon can read recruitment by token" ON public.recruitment_links;

-- Allow authenticated users to read only their own recruitment link
CREATE POLICY "Authenticated can read own recruitment link"
ON public.recruitment_links FOR SELECT
TO authenticated
USING (
  candidato_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  AND status = 'ativo'
  AND expira_em > now()
);

-- =============================================
-- FIX 3: PROFILES - Restrict to own profile + admin access
-- =============================================

-- Drop existing SELECT policy and recreate with explicit role
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
