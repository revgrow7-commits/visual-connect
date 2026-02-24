
-- Tabela de logs WhatsApp para módulo CS
CREATE TABLE public.whatsapp_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Identificação (sem FK pois clientes vêm do ERP Holdprint)
  customer_id INTEGER,
  customer_name TEXT,
  phone TEXT NOT NULL,
  
  -- Mensagem
  direction TEXT NOT NULL DEFAULT 'outbound',
  message TEXT NOT NULL,
  
  -- Origem do disparo
  origin TEXT DEFAULT 'manual',
  origin_id TEXT,
  
  -- Status
  status TEXT DEFAULT 'pending',
  evolution_message_id TEXT,
  error_message TEXT,
  
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  sent_by TEXT DEFAULT 'Sistema',
  unidade TEXT
);

-- Índices para performance
CREATE INDEX idx_whatsapp_logs_customer_id ON public.whatsapp_logs(customer_id);
CREATE INDEX idx_whatsapp_logs_phone ON public.whatsapp_logs(phone);
CREATE INDEX idx_whatsapp_logs_created_at ON public.whatsapp_logs(created_at DESC);
CREATE INDEX idx_whatsapp_logs_origin ON public.whatsapp_logs(origin);
CREATE INDEX idx_whatsapp_logs_status ON public.whatsapp_logs(status);

-- RLS
ALTER TABLE public.whatsapp_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage whatsapp_logs"
  ON public.whatsapp_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);
