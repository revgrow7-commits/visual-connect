
-- CRM Contacts
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  company_id uuid,
  position text,
  temperature text NOT NULL DEFAULT 'frio',
  score integer NOT NULL DEFAULT 0,
  unit text DEFAULT 'POA',
  tags text[] DEFAULT '{}',
  last_interaction timestamp with time zone,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CRM Companies
CREATE TABLE public.crm_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  cnae text,
  segment text,
  address text,
  phone text,
  website text,
  unit text DEFAULT 'POA',
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add FK from contacts to companies
ALTER TABLE public.crm_contacts
  ADD CONSTRAINT crm_contacts_company_id_fkey
  FOREIGN KEY (company_id) REFERENCES public.crm_companies(id) ON DELETE SET NULL;

-- CRM Deals
CREATE TABLE public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_id uuid REFERENCES public.crm_companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  value numeric NOT NULL DEFAULT 0,
  weighted_value numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'prospeccao',
  probability integer NOT NULL DEFAULT 10,
  owner_name text NOT NULL DEFAULT 'Não atribuído',
  close_date date,
  description text,
  status text NOT NULL DEFAULT 'aberto',
  tags text[] DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CRM Proposals
CREATE TABLE public.crm_proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE CASCADE,
  number text NOT NULL DEFAULT '',
  value numeric NOT NULL DEFAULT 0,
  discount_percent numeric DEFAULT 0,
  final_value numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'rascunho',
  sent_date timestamp with time zone,
  viewed_date timestamp with time zone,
  valid_until date,
  items jsonb NOT NULL DEFAULT '[]',
  terms text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CRM Tasks
CREATE TABLE public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  priority text NOT NULL DEFAULT 'media',
  owner_name text NOT NULL DEFAULT 'Não atribuído',
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  due_date timestamp with time zone,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CRM Activities
CREATE TABLE public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL DEFAULT 'note',
  subject text NOT NULL,
  description text,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  owner_name text NOT NULL DEFAULT 'Sistema',
  activity_date timestamp with time zone NOT NULL DEFAULT now(),
  duration_minutes integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- CRM Audit Logs
CREATE TABLE public.crm_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_name text NOT NULL DEFAULT 'Sistema',
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  changes jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies (public read/write for now, will tighten later)
CREATE POLICY "Anyone can read crm_contacts" ON public.crm_contacts FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_contacts" ON public.crm_contacts FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update crm_contacts" ON public.crm_contacts FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete crm_contacts" ON public.crm_contacts FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read crm_companies" ON public.crm_companies FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_companies" ON public.crm_companies FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update crm_companies" ON public.crm_companies FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete crm_companies" ON public.crm_companies FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read crm_deals" ON public.crm_deals FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_deals" ON public.crm_deals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update crm_deals" ON public.crm_deals FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete crm_deals" ON public.crm_deals FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read crm_proposals" ON public.crm_proposals FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_proposals" ON public.crm_proposals FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update crm_proposals" ON public.crm_proposals FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete crm_proposals" ON public.crm_proposals FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read crm_tasks" ON public.crm_tasks FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_tasks" ON public.crm_tasks FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Anyone can update crm_tasks" ON public.crm_tasks FOR UPDATE TO public USING (true);
CREATE POLICY "Anyone can delete crm_tasks" ON public.crm_tasks FOR DELETE TO public USING (true);

CREATE POLICY "Anyone can read crm_activities" ON public.crm_activities FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_activities" ON public.crm_activities FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "Anyone can read crm_audit_logs" ON public.crm_audit_logs FOR SELECT TO public USING (true);
CREATE POLICY "Anyone can insert crm_audit_logs" ON public.crm_audit_logs FOR INSERT TO public WITH CHECK (true);
