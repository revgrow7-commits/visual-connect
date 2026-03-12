import { useQuery } from "@tanstack/react-query";
import { loadBoardsFromDB, saveBoards, type Board } from "@/stores/boardsStore";

export function useBoards() {
  return useQuery<Board[]>({
    queryKey: ["kanban-boards"],
    queryFn: async () => {
      const boards = await loadBoardsFromDB();
      saveBoards(boards); // keep localStorage in sync
      return boards;
    },
    staleTime: 30_000,
  });
}

export function useActiveBoards() {
  const { data = [], ...rest } = useBoards();
  const activeBoards = data.filter((b) => b.active && b.board_type !== "micro");
  return { data: activeBoards, ...rest };
}

export function useActiveMicroBoards(parentBoardId?: string) {
  const { data = [], ...rest } = useBoards();
  let microBoards = data.filter((b) => b.active && b.board_type === "micro");
  if (parentBoardId) microBoards = microBoards.filter((b) => b.parent_board_id === parentBoardId);
  return { data: microBoards, ...rest };
}
