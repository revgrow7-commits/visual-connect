import type { Json } from "@/integrations/supabase/types";

export type StatusColaborador = "ativo" | "pendente" | "inativo";

export interface Colaborador {
  id: string;
  nome: string;
  email_pessoal: string | null;
  telefone_celular: string | null;
  cargo: string | null;
  setor: string | null;
  unidade: string | null;
  data_admissao: string | null;
  tipo_contratacao: string | null;
  status: StatusColaborador;
  compliance_aceito: boolean | null;
  cpf: string | null;
  created_at: string;
  matricula: string | null;
  rg: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  estado_civil: string | null;
  salario_base: string | null;
  jornada: string | null;
  horario: string | null;
  escala: string | null;
  pis_pasep: string | null;
  ctps: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string | null;
  estado: string | null;
  banco: string | null;
  agencia: string | null;
  conta: string | null;
  pix: string | null;
  escolaridade: string | null;
  sst: Json;
  secoes_visiveis: string[] | null;
}

export const statusColabBadge: Record<StatusColaborador, { label: string; className: string }> = {
  ativo: { label: "Ativo", className: "bg-success/10 text-success border-success/20" },
  pendente: { label: "Pendente", className: "bg-info/10 text-info border-info/20" },
  inativo: { label: "Inativo", className: "bg-destructive/10 text-destructive border-destructive/20" },
};
