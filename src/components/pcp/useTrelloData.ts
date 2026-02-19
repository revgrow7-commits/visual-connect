import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface TrelloLabel {
  id: string;
  idBoard: string;
  name: string;
  color: string | null;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  labels: TrelloLabel[];
  due: string | null;
  dueComplete: boolean;
  badges: { comments: number; attachments: number; checkItems: number; checkItemsChecked: number };
  pos: number;
}

export interface TrelloList {
  id: string;
  name: string;
  pos: number;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc: string;
  url: string;
  prefs: { backgroundColor?: string; backgroundImage?: string };
}

async function trelloAction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("trello-api", { body });
  if (error) throw error;
  if (!data?.success) throw new Error(data?.error || "Erro Trello");
  return data;
}

export function useTrelloBoards() {
  return useQuery({
    queryKey: ["trello-boards"],
    queryFn: async () => {
      const data = await trelloAction({ action: "get_boards" });
      return data.boards as TrelloBoard[];
    },
    staleTime: 10 * 60 * 1000,
  });
}

export function useTrelloBoardData(boardId: string | null) {
  return useQuery({
    queryKey: ["trello-board-data", boardId],
    queryFn: async () => {
      if (!boardId) throw new Error("No board selected");
      const data = await trelloAction({ action: "get_board_data", boardId });
      return {
        lists: (data.lists as TrelloList[]).sort((a, b) => a.pos - b.pos),
        cards: (data.cards as TrelloCard[]).sort((a, b) => a.pos - b.pos),
        labels: data.labels as TrelloLabel[],
      };
    },
    enabled: !!boardId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useTrelloLabels(boardId: string | null) {
  return useQuery({
    queryKey: ["trello-labels", boardId],
    queryFn: async () => {
      if (!boardId) throw new Error("No board");
      const data = await trelloAction({ action: "get_labels", boardId });
      return data.labels as TrelloLabel[];
    },
    enabled: !!boardId,
    staleTime: 2 * 60 * 1000,
  });
}

export function useCreateTrelloLabel(boardId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (labelData: { name: string; color: string }) => {
      const data = await trelloAction({ action: "create_label", boardId, labelData });
      return data.label as TrelloLabel;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trello-labels", boardId] });
      qc.invalidateQueries({ queryKey: ["trello-board-data", boardId] });
    },
  });
}

export function useUpdateTrelloLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ labelId, labelData }: { labelId: string; labelData: Partial<TrelloLabel> }) => {
      const data = await trelloAction({ action: "update_label", labelId, labelData });
      return data.label as TrelloLabel;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trello-labels"] }),
  });
}

export function useDeleteTrelloLabel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (labelId: string) => {
      await trelloAction({ action: "delete_label", labelId });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["trello-labels"] }),
  });
}

export function useToggleCardLabel(boardId: string | null) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cardId, labelId, hasLabel }: { cardId: string; labelId: string; hasLabel: boolean }) => {
      if (hasLabel) {
        await trelloAction({ action: "remove_label_from_card", cardId, labelId });
      } else {
        await trelloAction({ action: "add_label_to_card", cardId, labelId });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trello-board-data", boardId] });
    },
  });
}

// Trello color name → Tailwind bg class
export const TRELLO_COLOR_MAP: Record<string, string> = {
  green: "bg-green-500",
  yellow: "bg-yellow-400",
  orange: "bg-orange-400",
  red: "bg-red-500",
  purple: "bg-purple-500",
  blue: "bg-blue-500",
  sky: "bg-sky-400",
  lime: "bg-lime-400",
  pink: "bg-pink-400",
  black: "bg-gray-800",
  green_dark: "bg-green-700",
  yellow_dark: "bg-yellow-600",
  orange_dark: "bg-orange-600",
  red_dark: "bg-red-700",
  purple_dark: "bg-purple-700",
  blue_dark: "bg-blue-700",
};

export function trelloColorToTw(color: string | null): string {
  if (!color) return "bg-gray-300";
  return TRELLO_COLOR_MAP[color] || "bg-gray-400";
}
