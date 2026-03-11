export interface CRMContact {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  company_id: string | null;
  company_name?: string;
  position: string | null;
  temperature: "quente" | "morno" | "frio";
  score: number;
  unit: string;
  tags: string[];
  last_interaction: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMCompany {
  id: string;
  name: string;
  cnae: string | null;
  segment: string | null;
  address: string | null;
  phone: string | null;
  website: string | null;
  unit: string;
  tags: string[];
  contacts_count?: number;
  created_at: string;
  updated_at: string;
}

export type DealStage = "prospeccao" | "qualificacao" | "proposta" | "enviada" | "negociacao" | "fechamento";
export type DealStatus = "aberto" | "ganho" | "perdido";

export const DEAL_STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: "prospeccao", label: "Prospecção", color: "bg-blue-500" },
  { id: "qualificacao", label: "Qualificação", color: "bg-cyan-500" },
  { id: "proposta", label: "Proposta", color: "bg-yellow-500" },
  { id: "enviada", label: "Enviada", color: "bg-orange-500" },
  { id: "negociacao", label: "Negociação", color: "bg-purple-500" },
  { id: "fechamento", label: "Fechamento", color: "bg-green-500" },
];

export interface CRMDeal {
  id: string;
  title: string;
  company_id: string | null;
  company_name?: string;
  contact_id: string | null;
  contact_name?: string;
  value: number;
  weighted_value: number;
  stage: DealStage;
  probability: number;
  owner_name: string;
  close_date: string | null;
  description: string | null;
  status: DealStatus;
  tags: string[];
  created_at: string;
  updated_at: string;
}

export type ProposalStatus = "rascunho" | "enviada" | "visualizada" | "aceita" | "rejeitada";

export interface CRMProposal {
  id: string;
  deal_id: string | null;
  deal_title?: string;
  company_name?: string;
  number: string;
  value: number;
  discount_percent: number;
  final_value: number;
  status: ProposalStatus;
  sent_date: string | null;
  viewed_date: string | null;
  valid_until: string | null;
  items: { description: string; qty: number; unit_value: number; total: number }[];
  terms: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMTask {
  id: string;
  title: string;
  description: string | null;
  priority: "alta" | "media" | "baixa";
  owner_name: string;
  deal_id: string | null;
  deal_title?: string;
  contact_id: string | null;
  contact_name?: string;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CRMActivity {
  id: string;
  type: "email" | "call" | "meeting" | "note";
  subject: string;
  description: string | null;
  deal_id: string | null;
  contact_id: string | null;
  owner_name: string;
  activity_date: string;
  duration_minutes: number;
  created_at: string;
}

export interface CRMAuditLog {
  id: string;
  user_name: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  changes: Record<string, unknown>;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}
