// Shared boards configuration store (localStorage-backed)
// Used by both /admin/boards and /jobs Kanban

export interface FlexField {
  key: string;
  label: string;
  type: "text" | "number" | "select" | "date" | "boolean" | "textarea" | "file";
  options?: string[];
  required: boolean;
  show_on_card: boolean;
}

export interface BoardStage {
  id: string;
  name: string;
  color: string;
}

export interface BoardMember {
  id: string;
  nome: string;
  cargo: string | null;
  setor: string | null;
}

export interface Board {
  id: string;
  name: string;
  color: string;
  stages: BoardStage[];
  flexfields: FlexField[];
  members: BoardMember[];
  active: boolean;
}

const STORAGE_KEY = "kanban-boards-config";

export const DEFAULT_BOARDS: Board[] = [
  {
    id: "board-producao-completa",
    name: "Produção Completa",
    color: "#1DB899",
    active: true,
    members: [],
    stages: [
      { id: "revisao_comercial", name: "Revisão Comercial", color: "#6366F1" },
      { id: "aprovacao_financeira", name: "Aprovação Financeira", color: "#F59E0B" },
      { id: "programacao", name: "Programação", color: "#3B82F6" },
      { id: "arte_final", name: "Arte Final", color: "#8B5CF6" },
      { id: "impressao", name: "Impressão", color: "#EC4899" },
      { id: "acabamento", name: "Acabamento", color: "#14B8A6" },
      { id: "expedicao", name: "Expedição", color: "#22C55E" },
    ],
    flexfields: [
      { key: "formato", label: "Formato", type: "select", options: ["A4", "A3", "A2", "A1", "Personalizado"], required: true, show_on_card: true },
      { key: "quantidade", label: "Quantidade", type: "number", required: true, show_on_card: true },
      { key: "material", label: "Material", type: "text", required: false, show_on_card: false },
      { key: "frente_verso", label: "Frente e Verso", type: "boolean", required: false, show_on_card: false },
      { key: "acabamento", label: "Acabamento", type: "select", options: ["Nenhum", "Laminação Fosca", "Laminação Brilho", "Verniz UV", "Corte Especial"], required: false, show_on_card: true },
      { key: "obs_producao", label: "Obs. Produção", type: "textarea", required: false, show_on_card: false },
    ],
  },
  {
    id: "board-impressao-digital",
    name: "Impressão Digital",
    color: "#3B82F6",
    active: true,
    members: [],
    stages: [
      { id: "arte_final", name: "Arte Final", color: "#8B5CF6" },
      { id: "impressao", name: "Impressão", color: "#EC4899" },
      { id: "acabamento", name: "Acabamento", color: "#14B8A6" },
      { id: "expedicao", name: "Expedição", color: "#22C55E" },
    ],
    flexfields: [
      { key: "formato", label: "Formato", type: "select", options: ["A4", "A3", "Banner", "Adesivo"], required: true, show_on_card: true },
      { key: "quantidade", label: "Quantidade", type: "number", required: true, show_on_card: true },
      { key: "resolucao", label: "Resolução (DPI)", type: "number", required: false, show_on_card: false },
    ],
  },
  {
    id: "board-arte-final",
    name: "Arte Final",
    color: "#8B5CF6",
    active: true,
    members: [],
    stages: [
      { id: "revisao_comercial", name: "Revisão Comercial", color: "#6366F1" },
      { id: "arte_final", name: "Arte Final", color: "#8B5CF6" },
      { id: "expedicao", name: "Entrega", color: "#22C55E" },
    ],
    flexfields: [
      { key: "tipo_arte", label: "Tipo de Arte", type: "select", options: ["Criação", "Adaptação", "Revisão"], required: true, show_on_card: true },
      { key: "formato_arquivo", label: "Formato do Arquivo", type: "select", options: ["PDF", "AI", "PSD", "CDR", "TIFF"], required: false, show_on_card: false },
    ],
  },
];

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Board[];
  } catch { /* ignore */ }
  return DEFAULT_BOARDS;
}

export function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function getActiveBoards(): Board[] {
  return loadBoards().filter((b) => b.active);
}

export function getBoardById(id: string): Board | undefined {
  return loadBoards().find((b) => b.id === id);
}
