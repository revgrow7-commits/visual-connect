import React, { useMemo, useState } from "react";
import type { Job } from "./types";
import { getActiveMicroBoards, type Board } from "@/stores/boardsStore";
import { useJobMicroAssignments, useSendToMicroBoard } from "@/hooks/useMicroBoardAssignments";
import { logHistory } from "@/hooks/useJobLocalData";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "@/hooks/use-toast";
import { Layers, Check, Loader2 } from "lucide-react";

interface Props {
  job: Job;
  parentBoardId: string;
  parentStageId?: string;
  parentStageName?: string;
}

const MicroBoardButton: React.FC<Props> = ({ job, parentBoardId, parentStageId, parentStageName }) => {
  const [open, setOpen] = useState(false);
  const microBoards = useMemo(() => getActiveMicroBoards(parentBoardId), [parentBoardId]);
  const { data: assignments = [] } = useJobMicroAssignments(job.id);
  const sendTo = useSendToMicroBoard();

  if (microBoards.length === 0) return null;

  const activeAssignments = assignments.filter(a => a.status === "active");
  const assignedBoardIds = new Set(activeAssignments.map(a => a.micro_board_id));

  const handleSend = async (board: Board) => {
    if (assignedBoardIds.has(board.id)) {
      toast({ title: "Já atribuído", description: `Job já está no micro board "${board.name}"` });
      return;
    }

    const firstStage = board.stages[0];
    try {
      await sendTo.mutateAsync({
        job_id: job.id,
        job_code: job.code,
        job_title: job.description || job.client_name,
        customer_name: job.client_name,
        parent_board_id: parentBoardId,
        parent_stage_id: parentStageId,
        parent_stage_name: parentStageName,
        micro_board_id: board.id,
        micro_stage_id: firstStage?.id,
        micro_stage_name: firstStage?.name,
      });

      await logHistory(
        job.id,
        "sent_to_micro_board",
        `Job enviado ao micro board "${board.name}" → ${firstStage?.name || "primeira etapa"}`,
        { micro_board_id: board.id, micro_board_name: board.name, stage: firstStage?.id || "" }
      );

      toast({ title: "📋 Enviado ao Micro Board", description: `"${board.name}" → ${firstStage?.name || "primeira etapa"}` });
      setOpen(false);
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button size="sm" variant="outline" className="gap-1.5 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white">
          <Layers className="h-3.5 w-3.5" />
          Micro Board
          {activeAssignments.length > 0 && (
            <Badge className="text-[9px] bg-white/20 border-white/30 text-white ml-0.5">
              {activeAssignments.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-60 p-1" align="start">
        <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Enviar ao Micro Board</p>
        {microBoards.map(b => {
          const isAssigned = assignedBoardIds.has(b.id);
          const assignment = activeAssignments.find(a => a.micro_board_id === b.id);
          return (
            <button
              key={b.id}
              onClick={() => handleSend(b)}
              disabled={sendTo.isPending}
              className="flex items-center gap-2 w-full px-2 py-2 text-sm rounded-sm hover:bg-accent text-left disabled:opacity-50"
            >
              <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
              <span className="flex-1">{b.name}</span>
              {isAssigned && (
                <Badge variant="secondary" className="text-[9px] h-4 px-1.5">
                  {assignment?.micro_stage_name || "Ativo"}
                </Badge>
              )}
              {isAssigned && <Check className="h-3.5 w-3.5 text-primary" />}
              {sendTo.isPending && <Loader2 className="h-3 w-3 animate-spin" />}
            </button>
          );
        })}
        {activeAssignments.length > 0 && (
          <div className="px-2 pt-1.5 pb-1 border-t mt-1">
            <p className="text-[10px] text-muted-foreground font-semibold uppercase mb-1">Ativos</p>
            {activeAssignments.map(a => (
              <div key={a.id} className="flex items-center gap-1.5 text-[11px] py-0.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <span className="flex-1 truncate">{microBoards.find(b => b.id === a.micro_board_id)?.name || a.micro_board_id}</span>
                <span className="text-muted-foreground">{a.micro_stage_name}</span>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default MicroBoardButton;
