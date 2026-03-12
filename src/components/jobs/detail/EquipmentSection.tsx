import React, { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Wrench, Play, Square, Timer, Check } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Job } from "../types";
import { useJobAssignments } from "@/hooks/useJobBoardAssignments";
import { getActiveBoards } from "@/stores/boardsStore";
import {
  EQUIPMENT_OPTIONS,
  useJobEquipment,
  useAssignEquipment,
  useStopEquipment,
  type EquipmentAssignment,
} from "@/hooks/useJobEquipment";

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = new Date(startedAt).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="font-mono text-xs font-bold text-emerald-500 tabular-nums">
      {formatDuration(elapsed)}
    </span>
  );
}

interface Props {
  job: Job;
}

const EquipmentSection: React.FC<Props> = ({ job }) => {
  const jobId = job.id;
  const { data: assignments = [] } = useJobEquipment(jobId);
  const assignEquip = useAssignEquipment(jobId);
  const stopEquip = useStopEquipment(jobId);
  const { data: jobAssignments = [] } = useJobAssignments(jobId);
  const boards = React.useMemo(() => getActiveBoards(), []);

  // Get current board context
  const currentAssignment = jobAssignments.find(a => a.is_active && !a.item_id);
  const currentBoard = currentAssignment ? boards.find(b => b.id === currentAssignment.board_id) : null;

  const activeAssignments = assignments.filter((a) => a.is_active);
  const activeEquipNames = new Set(activeAssignments.map((a) => a.equipment));

  const handleAssign = (equipment: string) => {
    assignEquip.mutate(
      {
        equipment,
        job_code: job.code,
        job_title: job.description || job.client_name,
        customer_name: job.client_name,
        board_id: currentBoard?.id,
        board_name: currentBoard?.name,
        stage_name: currentAssignment?.stage_name || currentBoard?.stages[0]?.name,
      },
      {
        onSuccess: () =>
          toast({ title: "Equipamento atribuído", description: equipment }),
      }
    );
  };

  const handleStop = (assignment: EquipmentAssignment) => {
    stopEquip.mutate(assignment.id, {
      onSuccess: () =>
        toast({
          title: "Equipamento liberado",
          description: assignment.equipment,
        }),
    });
  };

  // Total time for completed assignments
  const totalSeconds = assignments
    .filter((a) => !a.is_active && a.duration_seconds > 0)
    .reduce((sum, a) => sum + a.duration_seconds, 0);

  return (
    <Popover>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-xs px-2.5"
            >
              <Wrench className="h-3.5 w-3.5" />
              Equipamento
              {activeAssignments.length > 0 && (
                <Badge
                  variant="secondary"
                  className="text-[9px] h-4 px-1.5 ml-0.5 bg-emerald-500/20 text-emerald-600"
                >
                  {activeAssignments.length} ativo
                  {activeAssignments.length > 1 ? "s" : ""}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p>Atribuir equipamento com cronômetro</p>
        </TooltipContent>
      </Tooltip>
      <PopoverContent className="w-80 p-3" align="start">
        <p className="text-xs font-semibold text-muted-foreground mb-2">
          Atribuir Equipamento
        </p>

        {/* Active assignments with live timers */}
        {activeAssignments.length > 0 && (
          <div className="space-y-1.5 mb-3">
            <p className="text-[10px] text-muted-foreground uppercase font-semibold">
              Em uso
            </p>
            {activeAssignments.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-2 p-2 rounded-md bg-emerald-500/10 border border-emerald-500/20"
              >
                <Timer className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{a.equipment}</p>
                  <LiveTimer startedAt={a.started_at} />
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  onClick={() => handleStop(a)}
                  disabled={stopEquip.isPending}
                >
                  <Square className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Equipment list */}
        <ScrollArea className="max-h-[220px]">
          <div className="space-y-0.5">
            {EQUIPMENT_OPTIONS.map((eq) => {
              const isActive = activeEquipNames.has(eq);
              return (
                <button
                  key={eq}
                  onClick={() => !isActive && handleAssign(eq)}
                  disabled={isActive || assignEquip.isPending}
                  className={`flex items-center gap-2 w-full px-2 py-1.5 text-xs rounded-md text-left transition-colors ${
                    isActive
                      ? "bg-emerald-500/10 text-emerald-600 cursor-default"
                      : "hover:bg-accent cursor-pointer"
                  }`}
                >
                  {isActive ? (
                    <Check className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                  ) : (
                    <Play className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                  )}
                  <span className="flex-1 truncate">{eq}</span>
                </button>
              );
            })}
          </div>
        </ScrollArea>

        {/* History summary */}
        {totalSeconds > 0 && (
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex justify-between">
            <span>Tempo total acumulado:</span>
            <span className="font-mono font-semibold">
              {formatDuration(totalSeconds)}
            </span>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default EquipmentSection;
