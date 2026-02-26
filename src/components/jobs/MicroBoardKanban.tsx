import React, { useMemo, useState, useCallback } from "react";
import type { Board } from "@/stores/boardsStore";
import { useMicroBoardCards, useUpdateMicroStage, useCompleteMicroAssignment, type MicroBoardAssignment } from "@/hooks/useMicroBoardAssignments";
import { DragDropContext, Droppable, Draggable, type DropResult } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";
import { CheckCircle, Loader2 } from "lucide-react";

interface Props {
  board: Board;
}

const MicroBoardKanban: React.FC<Props> = ({ board }) => {
  const { data: cards = [], isLoading } = useMicroBoardCards(board.id);
  const updateStage = useUpdateMicroStage();
  const completeAssignment = useCompleteMicroAssignment();

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

    const dstStage = board.stages.find(s => s.id === destination.droppableId);
    if (!dstStage) return;

    updateStage.mutate({
      assignmentId: draggableId,
      micro_stage_id: dstStage.id,
      micro_stage_name: dstStage.name,
    });

    toast({ title: "Card movido", description: `→ ${dstStage.name}` });
  }, [board.stages, updateStage]);

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
              className="rounded-t-lg p-2.5 border border-b-0"
              style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}
            >
              <p className="font-bold text-[13px]">{col.stage.name}</p>
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
