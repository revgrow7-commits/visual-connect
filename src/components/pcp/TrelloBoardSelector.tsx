import React, { useState } from "react";
import { useTrelloBoards, type TrelloBoard } from "./useTrelloData";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, LayoutGrid } from "lucide-react";

interface Props {
  selectedBoardId: string | null;
  onSelectBoard: (boardId: string) => void;
}

const TrelloBoardSelector: React.FC<Props> = ({ selectedBoardId, onSelectBoard }) => {
  const { data: boards, isLoading } = useTrelloBoards();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-white/70 text-xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>Carregando boards...</span>
      </div>
    );
  }

  if (!boards || boards.length === 0) {
    return <span className="text-white/50 text-xs">Nenhum board encontrado</span>;
  }

  return (
    <Select value={selectedBoardId || ""} onValueChange={onSelectBoard}>
      <SelectTrigger className="h-7 w-52 text-xs bg-white/15 border-white/20 text-white [&>svg]:text-white/60">
        <LayoutGrid className="h-3.5 w-3.5 mr-1.5 text-white/60 flex-shrink-0" />
        <SelectValue placeholder="Selecionar board..." />
      </SelectTrigger>
      <SelectContent>
        {boards.map((b) => (
          <SelectItem key={b.id} value={b.id} className="text-xs">
            {b.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TrelloBoardSelector;
