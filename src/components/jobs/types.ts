export interface JobResponsible {
  id: string;
  name: string;
  avatar?: string | null;
}

export interface JobItem {
  id: string;
  name: string;
  description?: string;
  quantity?: number;
  unit?: string;
  unitPrice?: number;
  subtotal?: number;
  done?: boolean;
  materials?: JobMaterial[];
}

export interface JobMaterial {
  name: string;
  process?: string;
  expectedQuantity?: number;
  usedQuantity?: number;
  stockCenter?: string;
  usedAmount?: number;
  attributes?: Record<string, string>;
}

export interface JobComment {
  id: string;
  content: string;
  user: string;
  timestamp: string;
}

export type Stage =
  | "revisao_comercial"
  | "aprovacao_financeira"
  | "programacao"
  | "projetos"
  | "compras"
  | "arte_final"
  | "impressao"
  | "acabamento"
  | "serralheria"
  | "marcenaria"
  | "pintura"
  | "expedicao"
  | "instalacao"
  | "entrega"
  | "faturamento"
  | "nao_gera_faturamento"
  | "previsto_realizado"
  | "producao_finalizada";

export type JobStatus = "aberto" | "fechado" | "cancelado";

export interface StageConfig {
  id: Stage;
  name: string;
  order: number;
  color: string;
}

export const DEFAULT_STAGES: StageConfig[] = [
  { id: "revisao_comercial", name: "Revisão Comercial", order: 1, color: "#6366F1" },
  { id: "aprovacao_financeira", name: "Aprovação Financeira", order: 2, color: "#8B5CF6" },
  { id: "programacao", name: "Programação", order: 3, color: "#06B6D4" },
  { id: "projetos", name: "Projetos", order: 4, color: "#7C3AED" },
  { id: "compras", name: "Compras", order: 5, color: "#F59E0B" },
  { id: "arte_final", name: "Arte Final", order: 6, color: "#EC4899" },
  { id: "impressao", name: "Impressão", order: 7, color: "#3B82F6" },
  { id: "acabamento", name: "Acabamento", order: 8, color: "#10B981" },
  { id: "serralheria", name: "Serralheria", order: 9, color: "#64748B" },
  { id: "marcenaria", name: "Marcenaria", order: 10, color: "#92400E" },
  { id: "pintura", name: "Pintura", order: 11, color: "#DC2626" },
  { id: "expedicao", name: "Expedição", order: 12, color: "#7C3AED" },
  { id: "instalacao", name: "Instalação", order: 13, color: "#059669" },
  { id: "entrega", name: "Entrega", order: 14, color: "#0EA5E9" },
  { id: "faturamento", name: "Faturamento", order: 15, color: "#D97706" },
  { id: "nao_gera_faturamento", name: "Não Gera Faturamento", order: 16, color: "#6B7280" },
  { id: "previsto_realizado", name: "Previsto x Realizado", order: 17, color: "#4B5563" },
  { id: "producao_finalizada", name: "Produção Finalizada", order: 18, color: "#16A34A" },
];

export interface Job {
  id: string;
  code?: number;
  job_number?: string;
  client_name: string;
  client_id?: string | number;
  description: string;
  title?: string;
  stage: Stage;
  production_type: string;
  status: JobStatus;
  responsible: JobResponsible[];
  commercial_responsible?: string;
  contact_name?: string;
  value: number;
  order_number?: string;
  delivery_date: string;
  delivery_need?: string;
  estimated_delivery?: string | null;
  created_at: string;
  created_by?: string;
  updated_at?: string;
  urgent: boolean;
  progress_percent: number;
  time_spent_minutes: number;
  time_tracked?: string;
  items_count: number;
  items_done: number;
  current_item_tag?: string;
  has_alert?: boolean;
  items?: JobItem[];
  materials?: JobMaterial[];
  comments?: JobComment[];
  flexfields?: Record<string, unknown>;
  total_m2?: number;
  _unit_key?: string;
  _raw?: Record<string, unknown>;
  // ── Local extension fields (from job_extensions table) ──
  prioridade?: string;
  tags?: string[];
  notas_internas?: string | null;
  times_envolvidos?: string[];
}

export interface JobsFilters {
  search: string;
  status: "aberto" | "fechado" | "todos" | "cancelado";
  productionType: string;
  dateFrom: string;
  dateTo: string;
}

export interface JobsByStage {
  stage: StageConfig;
  jobs: Job[];
  totalValue: number;
}

// Format helpers
export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }) +
    " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function formatTimeMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}min`;
}

export function isOverdue(dateStr: string): boolean {
  if (!dateStr) return false;
  return new Date(dateStr) < new Date();
}
