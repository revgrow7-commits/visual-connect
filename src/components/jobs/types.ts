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
  | "arte_final"
  | "impressao"
  | "acabamento"
  | "expedicao";

export type JobStatus = "aberto" | "fechado" | "cancelado";

export interface StageConfig {
  id: Stage;
  name: string;
  order: number;
  color: string;
}

export const DEFAULT_STAGES: StageConfig[] = [
  { id: "revisao_comercial", name: "Revisão Comercial", order: 1, color: "#6366F1" },
  { id: "aprovacao_financeira", name: "Aprovação Financeira", order: 2, color: "#F59E0B" },
  { id: "programacao", name: "Programação", order: 3, color: "#3B82F6" },
  { id: "arte_final", name: "Arte Final", order: 4, color: "#8B5CF6" },
  { id: "impressao", name: "Impressão", order: 5, color: "#EC4899" },
  { id: "acabamento", name: "Acabamento", order: 6, color: "#14B8A6" },
  { id: "expedicao", name: "Expedição", order: 7, color: "#22C55E" },
];

export interface Job {
  id: string;
  code?: number;
  client_name: string;
  client_id?: string | number;
  description: string;
  stage: Stage;
  production_type: string;
  status: JobStatus;
  responsible: JobResponsible[];
  value: number;
  delivery_date: string;
  created_at: string;
  updated_at?: string;
  urgent: boolean;
  progress_percent: number;
  time_spent_minutes: number;
  items_count: number;
  items_done: number;
  items?: JobItem[];
  materials?: JobMaterial[];
  comments?: JobComment[];
  flexfields?: Record<string, unknown>;
  _unit_key?: string;
  _raw?: Record<string, unknown>;
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
