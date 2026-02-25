
-- Notificações in-app
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  destinatario_id text NOT NULL,
  remetente_tipo text NOT NULL DEFAULT 'sistema',
  mensagem text NOT NULL,
  prioridade text NOT NULL DEFAULT 'info',
  job_id text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read notifications" ON public.notifications FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert notifications" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notifications" ON public.notifications FOR UPDATE USING (true);

-- Log de ações do agente IA
CREATE TABLE public.agent_actions_log (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tipo_rotina text NOT NULL DEFAULT 'manual',
  job_id text,
  acao_tomada text NOT NULL,
  resultado text,
  tokens_usados integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.agent_actions_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read agent_actions_log" ON public.agent_actions_log FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert agent_actions_log" ON public.agent_actions_log FOR INSERT WITH CHECK (true);

-- Regras de automação
CREATE TABLE public.automation_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  gatilho text NOT NULL,
  condicoes jsonb NOT NULL DEFAULT '{}',
  acoes jsonb NOT NULL DEFAULT '{}',
  ativo boolean NOT NULL DEFAULT true,
  criado_por text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.automation_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read automation_rules" ON public.automation_rules FOR SELECT USING (true);
CREATE POLICY "Authenticated can manage automation_rules" ON public.automation_rules FOR ALL USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Tarefas dos jobs (hierárquicas)
CREATE TABLE public.job_tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id text NOT NULL,
  titulo text NOT NULL,
  descricao text,
  responsavel_id text,
  prioridade text NOT NULL DEFAULT 'media',
  status text NOT NULL DEFAULT 'pendente',
  prazo timestamptz,
  parent_task_id uuid REFERENCES public.job_tasks(id) ON DELETE CASCADE,
  template_origem text,
  created_at timestamptz NOT NULL DEFAULT now(),
  concluido_em timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.job_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read job_tasks" ON public.job_tasks FOR SELECT USING (true);
CREATE POLICY "Authenticated can insert job_tasks" ON public.job_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated can update job_tasks" ON public.job_tasks FOR UPDATE USING (true);
CREATE POLICY "Authenticated can delete job_tasks" ON public.job_tasks FOR DELETE USING (true);

-- Índices
CREATE INDEX idx_notifications_job ON public.notifications(job_id);
CREATE INDEX idx_notifications_dest ON public.notifications(destinatario_id);
CREATE INDEX idx_agent_actions_job ON public.agent_actions_log(job_id);
CREATE INDEX idx_job_tasks_job ON public.job_tasks(job_id);
CREATE INDEX idx_job_tasks_parent ON public.job_tasks(parent_task_id);
CREATE INDEX idx_automation_rules_active ON public.automation_rules(ativo);

-- Trigger updated_at
CREATE TRIGGER update_automation_rules_updated_at BEFORE UPDATE ON public.automation_rules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_job_tasks_updated_at BEFORE UPDATE ON public.job_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
