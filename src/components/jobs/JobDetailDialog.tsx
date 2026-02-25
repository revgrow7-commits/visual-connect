import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Job } from "./types";
import { formatBRL, formatDateBR, isOverdue } from "./types";
import { DEFAULT_STAGES } from "./types";
import { getActiveBoards, type Board } from "@/stores/boardsStore";
import { useAssignToBoard, useJobAssignments } from "@/hooks/useJobBoardAssignments";
import { useArchiveJob, useUnarchiveJob } from "@/hooks/useJobArchives";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TabItens, TabInfo, TabProducao, TabMateriais, TabHistorico } from "./detail/JobDetailTabs";
import TabEquipe from "./detail/TabEquipe";
import TabTarefas from "./detail/TabTarefas";
import { useJobTasks } from "@/hooks/useJobTasks";
import { useJobHistory } from "@/hooks/useJobLocalData";
import { LayoutGrid, Check, Archive, ArchiveRestore, X, Bell, MessageSquare, ListChecks, AlertTriangle } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { logHistory } from "@/hooks/useJobLocalData";

interface Props {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageChange?: (jobId: string, newStage: string) => void;
  isArchived?: boolean;
}

const JobDetailDialog: React.FC<Props> = ({ job, open, onOpenChange, onStageChange, isArchived }) => {
  const boards = useMemo(() => getActiveBoards(), []);
  const [boardPopoverOpen, setBoardPopoverOpen] = useState(false);
  const queryClient = useQueryClient();
  const archiveJob = useArchiveJob();
  const unarchiveJob = useUnarchiveJob();

  const { data: jobAssignments = [] } = useJobAssignments(job?.id || null);
  const assignToBoard = useAssignToBoard(job?.id || "");
  const { data: jobTasks = [] } = useJobTasks(job?.id || null);
  const { data: jobHistoryData = [] } = useJobHistory(job?.id || null, false);

  if (!job) return null;

  const tasksDone = jobTasks.filter(t => t.status === "concluida").length;
  const commentsCount = jobHistoryData.filter(h => h.event_type === "comment").length;

  const currentAssignment = jobAssignments.find(a => a.is_active && !a.item_id);
  const currentBoard = currentAssignment ? boards.find(b => b.id === currentAssignment.board_id) : null;
  const overdue = isOverdue(job.delivery_date);

  const handleAssignBoard = async (board: Board) => {
    setBoardPopoverOpen(false);
    const firstStage = board.stages[0];
    try {
      // Deactivate ALL previous job-level assignments for this job on ANY board
      await supabase
        .from("job_board_assignments")
        .update({ is_active: false })
        .eq("job_id", job.id)
        .eq("is_active", true);

      // Insert clean job-level assignment (no item_name for job-level)
      await supabase.from("job_board_assignments").insert({
        job_id: job.id,
        job_code: job.code || null,
        job_title: job.description || job.client_name || null,
        customer_name: job.client_name || null,
        board_id: board.id,
        board_name: board.name,
        stage_id: firstStage?.id || null,
        stage_name: firstStage?.name || null,
        assigned_by: "Sistema",
        is_active: true,
      });

      // Invalidate queries
      assignToBoard.reset?.();
      queryClient.invalidateQueries({ queryKey: ["job-assignments", job.id] });
      queryClient.invalidateQueries({ queryKey: ["board-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
    } catch (err: any) {
      console.error("[assign-board] error:", err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
      return;
    }
    if (firstStage && onStageChange) onStageChange(job.id, firstStage.id);
    await logHistory(job.id, "job_assigned_to_board", `Job atribuído à board "${board.name}" → ${firstStage?.name || "primeira etapa"}`, {
      board_id: board.id, board_name: board.name, stage: firstStage?.id || "",
    });
    toast({ title: "Atribuído à Board", description: `Job movido para "${board.name}" → ${firstStage?.name || "primeira etapa"}` });
  };

  const handleArchive = () => {
    archiveJob.mutate({ job_id: job.id, job_code: job.code, job_title: job.description, customer_name: job.client_name });
    onOpenChange(false);
  };

  const handleUnarchive = () => {
    unarchiveJob.mutate(job.id);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-full h-[90vh] p-0 flex flex-col overflow-hidden gap-0">
        {/* Header */}
        <div className="bg-[#1a2332] text-white p-5 space-y-3 flex-shrink-0 relative">
          <button onClick={() => onOpenChange(false)} className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-white/10 transition-colors">
            <X className="h-5 w-5 text-white/70" />
          </button>

          <div className="flex items-start justify-between gap-4 pr-8">
            <h2 className="text-xl font-bold leading-tight">{job.description || job.client_name}</h2>
            <Badge className="text-white font-mono text-xs flex-shrink-0 bg-white/10 border-white/20">
              J{job.code || job.id}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
            <div><span className="text-gray-400 font-semibold">Cliente:</span> {job.client_name}</div>
            <div><span className="text-gray-400 font-semibold">Criado:</span> {formatDateBR(job.created_at)}</div>
            {job.responsible.length > 0 && (
              <div><span className="text-gray-400 font-semibold">Responsável:</span> {job.responsible.map(r => r.name).join(", ")}</div>
            )}
            <div>
              <span className="text-gray-400 font-semibold">Entrega:</span>{" "}
              <span className={overdue ? "text-red-400 font-semibold" : ""}>{formatDateBR(job.delivery_date)}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Progresso</span>
            <Progress value={job.progress_percent} className="flex-1 h-2 bg-[#374151]" />
            <span className="text-sm font-bold">{job.progress_percent}%</span>
            <div className="flex items-center gap-2 ml-2">
              <Badge className="text-[10px] bg-white/10 border-white/20 text-white gap-0.5">
                <ListChecks className="h-2.5 w-2.5" /> {tasksDone}/{jobTasks.length}
              </Badge>
              <Badge className="text-[10px] bg-white/10 border-white/20 text-white gap-0.5">
                <MessageSquare className="h-2.5 w-2.5" /> {commentsCount}
              </Badge>
              {overdue && (
                <Badge className="text-[10px] bg-red-500/20 border-red-400/30 text-red-300 gap-0.5">
                  <AlertTriangle className="h-2.5 w-2.5" /> ATRASADO
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1 flex-wrap">
            <Popover open={boardPopoverOpen} onOpenChange={setBoardPopoverOpen}>
              <PopoverTrigger asChild>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white">
                  <LayoutGrid className="h-3.5 w-3.5" />
                  {currentBoard ? `Board: ${currentBoard.name}` : "Atribuir a Board"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-1" align="start">
                <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Selecionar Board</p>
                {boards.map(b => (
                  <button key={b.id} onClick={() => handleAssignBoard(b)} className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-left">
                    <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                    <span className="flex-1">{b.name}</span>
                    {currentAssignment?.board_id === b.id && <Check className="h-3.5 w-3.5 text-primary" />}
                  </button>
                ))}
              </PopoverContent>
            </Popover>

            {currentBoard && currentAssignment && (
              <Badge className="text-[10px] text-white border-white/20" style={{ backgroundColor: currentBoard.color }}>
                {currentAssignment.stage_name || currentBoard.stages[0]?.name}
              </Badge>
            )}

            <div className="ml-auto">
              {isArchived ? (
                <Button size="sm" variant="outline" onClick={handleUnarchive} className="gap-1.5 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white">
                  <ArchiveRestore className="h-3.5 w-3.5" /> Desarquivar
                </Button>
              ) : (
                <Button size="sm" variant="outline" onClick={handleArchive} className="gap-1.5 text-xs border-amber-400/50 text-amber-300 hover:bg-amber-500/20 hover:text-amber-200">
                  <Archive className="h-3.5 w-3.5" /> Arquivar
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="producao" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-5 pt-3 bg-background border-b rounded-none h-auto justify-start gap-1 flex-shrink-0">
            {[
              { value: "itens", label: "Itens" },
              { value: "info", label: "Informações gerais" },
              { value: "producao", label: "Produção" },
              { value: "equipe", label: "Equipe & Distribuição" },
              { value: "tarefas", label: "Tarefas" },
              { value: "materiais", label: "Matéria Prima" },
              { value: "historico", label: "Histórico" },
            ].map(tab => (
              <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="itens" className="mt-0"><TabItens job={job} /></TabsContent>
            <TabsContent value="info" className="mt-0"><TabInfo job={job} /></TabsContent>
            <TabsContent value="producao" className="mt-0"><TabProducao job={job} onStageChange={onStageChange} /></TabsContent>
            <TabsContent value="equipe" className="mt-0"><TabEquipe job={job} /></TabsContent>
            <TabsContent value="tarefas" className="mt-0"><TabTarefas job={job} /></TabsContent>
            <TabsContent value="materiais" className="mt-0"><TabMateriais job={job} /></TabsContent>
            <TabsContent value="historico" className="mt-0"><TabHistorico job={job} /></TabsContent>
          </ScrollArea>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
