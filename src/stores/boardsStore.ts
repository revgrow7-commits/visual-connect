// Shared boards configuration store
// Uses Supabase as primary storage with localStorage as fallback/cache

import { supabase } from "@/integrations/supabase/client";

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
  board_type?: "main" | "micro";
  parent_board_id?: string | null;
  linked_stage_id?: string | null;
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
      { id: "aprovacao_financeira", name: "Aprovação Financeira", color: "#8B5CF6" },
      { id: "programacao", name: "Programação", color: "#06B6D4" },
      { id: "projetos", name: "Projetos", color: "#7C3AED" },
      { id: "compras", name: "Compras", color: "#F59E0B" },
      { id: "arte_final", name: "Arte Final", color: "#EC4899" },
      { id: "impressao", name: "Impressão", color: "#3B82F6" },
      { id: "acabamento", name: "Acabamento", color: "#10B981" },
      { id: "serralheria", name: "Serralheria", color: "#64748B" },
      { id: "marcenaria", name: "Marcenaria", color: "#92400E" },
      { id: "pintura", name: "Pintura", color: "#DC2626" },
      { id: "expedicao", name: "Expedição", color: "#7C3AED" },
      { id: "instalacao", name: "Instalação", color: "#059669" },
      { id: "entrega", name: "Entrega", color: "#0EA5E9" },
      { id: "faturamento", name: "Faturamento", color: "#D97706" },
      { id: "nao_gera_faturamento", name: "Não Gera Faturamento", color: "#6B7280" },
      { id: "previsto_realizado", name: "Previsto x Realizado", color: "#4B5563" },
      { id: "producao_finalizada", name: "Produção Finalizada", color: "#16A34A" },
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

// ─── localStorage helpers (fallback / cache) ───

export function loadBoards(): Board[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Board[];
      return parsed.map(b => ({ ...b, members: b.members || [] }));
    }
  } catch { /* ignore */ }
  return DEFAULT_BOARDS;
}

export function saveBoards(boards: Board[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function getActiveBoards(): Board[] {
  return loadBoards().filter((b) => b.active && b.board_type !== "micro");
}

export function getActiveMicroBoards(parentBoardId?: string): Board[] {
  const all = loadBoards().filter((b) => b.active && b.board_type === "micro");
  if (parentBoardId) return all.filter(b => b.parent_board_id === parentBoardId);
  return all;
}

export function getBoardById(id: string): Board | undefined {
  return loadBoards().find((b) => b.id === id);
}

// ─── Supabase persistence ───

function rowToBoard(row: Record<string, unknown>): Board {
  return {
    id: row.id as string,
    name: row.name as string,
    color: row.color as string,
    active: row.active as boolean,
    stages: (row.stages || []) as BoardStage[],
    flexfields: (row.flexfields || []) as FlexField[],
    members: (row.members || []) as BoardMember[],
    board_type: (row.board_type as "main" | "micro") || "main",
    parent_board_id: (row.parent_board_id as string) || null,
    linked_stage_id: (row.linked_stage_id as string) || null,
  };
}

export async function loadBoardsFromDB(): Promise<Board[]> {
  const { data, error } = await supabase
    .from("kanban_boards")
    .select("*")
    .order("created_at");

  if (error) {
    console.error("Error loading boards from DB:", error);
    return loadBoards();
  }

  if (!data || data.length === 0) {
    // Seed DB with localStorage/default boards
    const localBoards = loadBoards();
    for (const board of localBoards) {
      try { await saveBoardToDB(board); } catch { /* ignore */ }
    }
    return localBoards;
  }

  const boards = data.map(rowToBoard);
  saveBoards(boards);
  return boards;
}

export async function saveBoardToDB(board: Board): Promise<void> {
  const payload = {
    id: board.id,
    name: board.name,
    color: board.color,
    active: board.active,
    stages: JSON.parse(JSON.stringify(board.stages)),
    flexfields: JSON.parse(JSON.stringify(board.flexfields)),
    members: JSON.parse(JSON.stringify(board.members)),
  };

  // Try update first, then insert
  const { data: existing } = await supabase
    .from("kanban_boards")
    .select("id")
    .eq("id", board.id)
    .maybeSingle();

  let error;
  if (existing) {
    ({ error } = await supabase.from("kanban_boards").update(payload).eq("id", board.id));
  } else {
    ({ error } = await supabase.from("kanban_boards").insert(payload));
  }

  if (error) {
    console.error("Error saving board to DB:", error);
    throw error;
  }
}

export async function deleteBoardFromDB(id: string): Promise<void> {
  const { error } = await supabase
    .from("kanban_boards")
    .delete()
    .eq("id", id);

  if (error) {
    console.error("Error deleting board from DB:", error);
    throw error;
  }
}
