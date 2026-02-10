
-- 1. Enum de roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  email TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Auto-criar perfil no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. Tabela de roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 5. Função has_role (ANTES das policies que a usam)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role
  )
$$;

-- 6. Policies em user_roles
CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 7. Atualizar RLS colaboradores
DROP POLICY IF EXISTS "Anyone can insert colaborador" ON public.colaboradores;
DROP POLICY IF EXISTS "Authenticated can insert colaborador" ON public.colaboradores;
DROP POLICY IF EXISTS "Authenticated users can update colaboradores" ON public.colaboradores;
DROP POLICY IF EXISTS "Authenticated users can view colaboradores" ON public.colaboradores;

CREATE POLICY "Admins can read colaboradores"
  ON public.colaboradores FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert colaboradores"
  ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update colaboradores"
  ON public.colaboradores FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete colaboradores"
  ON public.colaboradores FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can insert colaboradores via recruitment"
  ON public.colaboradores FOR INSERT TO anon
  WITH CHECK (recruitment_link_id IS NOT NULL);

CREATE POLICY "Anon can read own recruitment data"
  ON public.colaboradores FOR SELECT TO anon
  USING (recruitment_link_id IS NOT NULL);

-- 8. Atualizar RLS recruitment_links
DROP POLICY IF EXISTS "Anyone can read by token" ON public.recruitment_links;
DROP POLICY IF EXISTS "Authenticated users can insert links" ON public.recruitment_links;
DROP POLICY IF EXISTS "Authenticated users can update links" ON public.recruitment_links;
DROP POLICY IF EXISTS "Authenticated users can view links" ON public.recruitment_links;

CREATE POLICY "Admins can manage recruitment_links"
  ON public.recruitment_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anon can read recruitment by token"
  ON public.recruitment_links FOR SELECT TO anon
  USING (true);
