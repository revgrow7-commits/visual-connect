
-- Tabela de usuários do gateway SSO (login unificado entre sistemas)
CREATE TABLE public.gateway_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  department TEXT,
  permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gateway_users ENABLE ROW LEVEL SECURITY;

-- Admins can manage all gateway users
CREATE POLICY "Admins can manage gateway_users"
  ON public.gateway_users
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- No direct SELECT for non-admins (auth is done via edge function)
-- Edge functions use service role key to bypass RLS

-- Trigger for updated_at
CREATE TRIGGER update_gateway_users_updated_at
  BEFORE UPDATE ON public.gateway_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create a view without password_hash for admin management
CREATE VIEW public.gateway_users_safe
WITH (security_invoker = on) AS
  SELECT id, email, name, role, department, permissions, is_active, last_login_at, created_at, updated_at
  FROM public.gateway_users;

-- Index for fast email lookups
CREATE INDEX idx_gateway_users_email ON public.gateway_users(email);
