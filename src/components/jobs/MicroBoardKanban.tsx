import React, { useMemo, useState, useCallback } from "react";
import type { Board } from "@/stores/boardsStore";
import { saveBoardToDB } from "@/stores/boardsStore";
import { useMicroBoardCards, useUpdateMicroStage, useCompleteMicroAssignment, type MicroBoardAssignment } from "@/hooks/useMicroBoardAssignments";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2, Pencil, Check } from "lucide-react";
import { useRecordMovement } from "@/hooks/useJobStageMovements";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

interface Props {
  board: Board;
  onBoardUpdate?: (updated: Board) => void;
}

const MicroBoardKanban: React.FC<Props> = ({ board, onBoardUpdate }) => {
  const { data: cards = [], isLoading } = useMicroBoardCards(board.id);
  const updateStage = useUpdateMicroStage();
  const completeAssignment = useCompleteMicroAssignment();
  const recordMovement = useRecordMovement();
  const queryClient = useQueryClient();
  const [editingStageId, setEditingStageId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  // Group cards by stage
  const byStage = useMemo(() => {
    return board.stages.map(stage => ({
      stage,
      cards: cards.filter(c => c.micro_stage_id === stage.id),
    }));
  }, [board.stages, cards]);

  const lastStageId = board.stages[board.stages.length - 1]?.id;

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination || (source.droppableId === destination.droppableId && source.index === destination.index)) return;

    const srcStage = board.stages.find(s => s.id === source.droppableId);
    const dstStage = board.stages.find(s => s.id === destination.droppableId);
    if (!dstStage) return;

    const card = cards.find(c => c.id === draggableId);

    // 1. Update micro_board_assignments stage
    updateStage.mutate({
      assignmentId: draggableId,
      micro_stage_id: dstStage.id,
      micro_stage_name: dstStage.name,
    });

    // 2. Record in job_stage_movements for Produção Completa visibility
    if (card) {
      recordMovement.mutate({
        job_id: card.job_id,
        job_code: card.job_code ?? undefined,
        job_title: card.job_title ?? undefined,
        customer_name: card.customer_name ?? undefined,
        board_id: board.id,
        board_name: board.name,
        from_stage_id: srcStage?.id,
        from_stage_name: srcStage?.name,
        to_stage_id: dstStage.id,
        to_stage_name: dstStage.name,
        moved_by: "Operador",
        movement_type: "drag_drop",
        metadata: { micro_board: true, micro_board_id: board.id, micro_board_name: board.name },
      });

      // 3. Log in job_history for agent context
      supabase.from("job_history").insert({
        job_id: card.job_id,
        event_type: "micro_board_move",
        content: `Movido de "${srcStage?.name || '—'}" para "${dstStage.name}" no board "${board.name}"`,
        user_name: "Operador",
        metadata: {
          micro_board_id: board.id,
          micro_board_name: board.name,
          from_stage: srcStage?.name,
          to_stage: dstStage.name,
        },
      }).then(() => {});

      // 4. Update job_board_assignments stage_name so parent board reflects micro board position
      supabase.from("job_board_assignments")
        .update({ stage_name: `${board.name}: ${dstStage.name}` } as any)
        .eq("job_id", card.job_id)
        .eq("board_id", board.id)
        .eq("is_active", true)
        .then(() => {
          queryClient.invalidateQueries({ queryKey: ["all-board-assignments-badges"] });
          queryClient.invalidateQueries({ queryKey: ["board-assignments"] });
        });
    }

    toast({ title: "Card movido", description: `→ ${dstStage.name}` });
  }, [board, cards, updateStage, recordMovement, queryClient]);

  const handleComplete = (card: MicroBoardAssignment) => {
    completeAssignment.mutate({
      assignmentId: card.id,
      job_id: card.job_id,
      micro_board_id: card.micro_board_id,
    });
  };

  if (isLoading) {
    return (
      <div className="flex gap-3 p-4">
        {board.stages.map(s => <Skeleton key={s.id} className="h-40 w-48 rounded-lg" />)}
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-3 p-4 overflow-x-auto min-h-[300px]">
        {byStage.map(col => (
          <div key={col.stage.id} className="min-w-[200px] flex-1 max-w-[260px] flex flex-col">
            <div
              className="rounded-t-lg p-2.5 border border-b-0 group/header"
              style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}
            >
              {editingStageId === col.stage.id ? (
                <form
                  className="flex items-center gap-1"
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const trimmed = editingName.trim();
                    if (!trimmed || trimmed === col.stage.name) {
                      setEditingStageId(null);
                      return;
                    }
                    const updatedBoard = {
                      ...board,
                      stages: board.stages.map(s =>
                        s.id === col.stage.id ? { ...s, name: trimmed } : s
                      ),
                    };
                    try {
                      await saveBoardToDB(updatedBoard);
                      onBoardUpdate?.(updatedBoard);
                      queryClient.invalidateQueries({ queryKey: ["kanban-boards"] });
                      toast({ title: "Etapa renomeada", description: `→ ${trimmed}` });
                    } catch {
                      toast({ title: "Erro ao salvar", variant: "destructive" });
                    }
                    setEditingStageId(null);
                  }}
                >
                  <Input
                    autoFocus
                    className="h-6 text-[13px] font-bold px-1.5"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onBlur={() => setEditingStageId(null)}
                    onKeyDown={e => e.key === "Escape" && setEditingStageId(null)}
                  />
                  <Button type="submit" size="sm" variant="ghost" className="h-6 w-6 p-0" onMouseDown={e => e.preventDefault()}>
                    <Check className="h-3.5 w-3.5 text-emerald-500" />
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-1">
                  <p className="font-bold text-[13px]">{col.stage.name}</p>
                  <button
                    className="opacity-0 group-hover/header:opacity-100 transition-opacity p-0.5 rounded hover:bg-muted"
                    onClick={() => { setEditingStageId(col.stage.id); setEditingName(col.stage.name); }}
                  >
                    <Pencil className="h-3 w-3 text-muted-foreground" />
                  </button>
                </div>
              )}
              <p className="text-[11px] text-muted-foreground">{col.cards.length} cards</p>
            </div>
            <Droppable droppableId={col.stage.id}>
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex-1 bg-muted/50 border border-t-0 rounded-b-lg p-1.5 space-y-1.5 transition-colors ${snapshot.isDraggingOver ? "bg-emerald-100/50" : ""}`}
                >
                  {col.cards.map((card, idx) => (
                    <Draggable key={card.id} draggableId={card.id} index={idx}>
                      {(prov, snap) => (
                        <div
                          ref={prov.innerRef}
                          {...prov.draggableProps}
                          {...prov.dragHandleProps}
                          className={`bg-card rounded-lg border p-2.5 shadow-sm ${snap.isDragging ? "shadow-lg ring-2 ring-primary/30" : ""}`}
                        >
                          <div className="flex items-start justify-between gap-1">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold truncate">{card.job_title || `Job ${card.job_code}`}</p>
                              <p className="text-[11px] text-muted-foreground truncate">{card.customer_name}</p>
                            </div>
                            {card.job_code && (
                              <Badge variant="secondary" className="text-[9px] h-4 px-1 flex-shrink-0">
                                J{card.job_code}
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-1.5">
                            <span className="text-[10px] text-muted-foreground">
                              {new Date(card.assigned_at).toLocaleDateString("pt-BR")}
                            </span>
                            {col.stage.id === lastStageId && (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 gap-1 text-[10px] text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-1.5"
                                onClick={() => handleComplete(card)}
                                disabled={completeAssignment.isPending}
                              >
                                {completeAssignment.isPending ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                                ) : (
                                  <CheckCircle className="h-3 w-3" />
                                )}
                                Concluir
                              </Button>
                            )}
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                  {col.cards.length === 0 && (
                    <div className="text-center py-6 text-muted-foreground text-xs">Vazio</div>
                  )}
                </div>
              )}
            </Droppable>
          </div>
        ))}
      </div>
    </DragDropContext>
  );
};

export default MicroBoardKanban;
