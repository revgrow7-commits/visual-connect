
-- Cache table for Secullum API responses
CREATE TABLE public.secullum_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- Index for fast lookups and expiry cleanup
CREATE INDEX idx_secullum_cache_key ON public.secullum_cache (cache_key);
CREATE INDEX idx_secullum_cache_expires ON public.secullum_cache (expires_at);

-- Enable RLS
ALTER TABLE public.secullum_cache ENABLE ROW LEVEL SECURITY;

-- Only service_role (edge functions) can read/write cache
-- No user-facing policies needed since edge functions use service_role key
CREATE POLICY "Service role full access" ON public.secullum_cache
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Allow authenticated admins to read cache (for debugging)
CREATE POLICY "Admins can read cache" ON public.secullum_cache
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
