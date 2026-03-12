import React, { useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import type { Job } from "./types";
import { formatBRL, formatDateBR, isOverdue } from "./types";
import { DEFAULT_STAGES } from "./types";
import { type Board } from "@/stores/boardsStore";
import { useActiveBoards } from "@/hooks/useBoards";
import { useAssignToBoard, useJobAssignments } from "@/hooks/useJobBoardAssignments";
import { useArchiveJob, useUnarchiveJob } from "@/hooks/useJobArchives";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { TabItens, TabInfo, TabProducao, TabFaturamento, TabEstatisticas, TabAcompanhamento } from "./detail/JobDetailTabs";
import JobSidebarActions from "./detail/JobSidebarActions";
import MicroBoardButton from "./MicroBoardButton";
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
  const { data: boards = [] } = useActiveBoards();
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

  // Multi-board: get ALL active job-level assignments
  const activeAssignments = useMemo(() => jobAssignments.filter(a => a.is_active && !a.item_id), [jobAssignments]);
  const assignedBoardIds = useMemo(() => new Set(activeAssignments.map(a => a.board_id)), [activeAssignments]);
  // Keep first for backward compat (stage confirm button etc)
  const currentAssignment = activeAssignments[0] || null;
  const currentBoard = currentAssignment ? boards.find(b => b.id === currentAssignment.board_id) : null;
  const overdue = isOverdue(job.delivery_date);

  const handleToggleBoard = async (board: Board) => {
    const isAssigned = assignedBoardIds.has(board.id);
    try {
      if (isAssigned) {
        // Deactivate only this board's assignment
        await supabase
          .from("job_board_assignments")
          .update({ is_active: false })
          .eq("job_id", job.id)
          .eq("board_id", board.id)
          .eq("is_active", true);
        await logHistory(job.id, "job_removed_from_board", `Job removido da board "${board.name}"`, { board_id: board.id, board_name: board.name });
        toast({ title: "Removido da Board", description: `Job removido de "${board.name}"` });
      } else {
        // Add new assignment without deactivating others
        const firstStage = board.stages[0];
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
        if (firstStage && onStageChange) onStageChange(job.id, firstStage.id);
        await logHistory(job.id, "job_assigned_to_board", `Job atribuído à board "${board.name}" → ${firstStage?.name || "primeira etapa"}`, {
          board_id: board.id, board_name: board.name, stage: firstStage?.id || "",
        });
        toast({ title: "Atribuído à Board", description: `Job adicionado a "${board.name}" → ${firstStage?.name || "primeira etapa"}` });
      }
      assignToBoard.reset?.();
      queryClient.invalidateQueries({ queryKey: ["job-assignments", job.id] });
      queryClient.invalidateQueries({ queryKey: ["board-assignments"] });
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
    } catch (err: any) {
      console.error("[toggle-board] error:", err);
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
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
            <h2 className="text-xl font-bold leading-tight">{job.title || job.description || job.client_name}</h2>
            <Badge className="text-white font-mono text-xs flex-shrink-0 bg-white/10 border-white/20">
              {job.job_number || `J${job.code || job.id}`}
            </Badge>
          </div>

          <div className="flex items-center gap-3 text-sm flex-wrap">
            <span className="font-semibold">{formatBRL(job.value)}</span>
            {job.order_number && <span className="text-gray-400">{job.order_number}</span>}
            <Badge className="text-[10px] bg-white/10 border-white/20 text-white">{job.production_type || job.stage}</Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-1 text-sm">
            <div><span className="text-gray-400 font-semibold">Cliente:</span> {job.client_name}</div>
            {job.contact_name && <div><span className="text-gray-400 font-semibold">Contato:</span> {job.contact_name}</div>}
            {job.responsible.length > 0 && (
              <div><span className="text-gray-400 font-semibold">Responsável:</span> {job.responsible.map(r => r.name).join(", ")}</div>
            )}
            {job.commercial_responsible && (
              <div><span className="text-gray-400 font-semibold">Resp. Comercial:</span> {job.commercial_responsible}</div>
            )}
            <div>
              <span className="text-gray-400 font-semibold">Criado:</span> {formatDateBR(job.created_at)}
              {job.created_by && <span className="text-gray-400"> por {job.created_by}</span>}
            </div>
            {job.delivery_need && (
              <div><span className="text-gray-400 font-semibold">Necessidade de entrega:</span> {formatDateBR(job.delivery_need)}</div>
            )}
            <div>
              <span className="text-gray-400 font-semibold">Entrega Prevista:</span>{" "}
              <span className={overdue ? "text-red-400 font-semibold" : ""}>
                {job.estimated_delivery ? formatDateBR(job.estimated_delivery) : "Não calculado"}
              </span>
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

            <MicroBoardButton
              job={job}
              parentBoardId={currentBoard?.id || boards[0]?.id || ""}
              parentStageId={currentAssignment?.stage_id || undefined}
              parentStageName={currentAssignment?.stage_name || undefined}
            />

            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs border-white/20 text-white hover:bg-white/10 hover:text-white"
                onClick={async () => {
                  try {
                    // Log the stage confirmation in job_history
                    await logHistory(
                      job.id,
                      "stage_confirmed",
                      `Etapa "${job.production_type || job.stage}" confirmada como OK`,
                      { stage: job.stage, production_type: job.production_type || "" }
                    );

                    // If assigned to a board, move to next stage
                    if (currentBoard && currentAssignment) {
                      const stages = currentBoard.stages;
                      const currentIdx = stages.findIndex(s => s.id === currentAssignment.stage_id);
                      if (currentIdx >= 0 && currentIdx < stages.length - 1) {
                        const nextStage = stages[currentIdx + 1];
                        await supabase
                          .from("job_board_assignments")
                          .update({ stage_id: nextStage.id, stage_name: nextStage.name })
                          .eq("id", currentAssignment.id);

                        // Record stage movement
                        await supabase.from("job_stage_movements").insert({
                          job_id: job.id,
                          job_code: job.code || null,
                          job_title: job.description || job.client_name || null,
                          customer_name: job.client_name || null,
                          board_id: currentBoard.id,
                          board_name: currentBoard.name,
                          from_stage_id: currentAssignment.stage_id || currentBoard.stages[0]?.id,
                          from_stage_name: currentAssignment.stage_name || currentBoard.stages[0]?.name,
                          to_stage_id: nextStage.id,
                          to_stage_name: nextStage.name,
                          moved_by: "Sistema",
                          movement_type: "stage_confirmed",
                        });

                        queryClient.invalidateQueries({ queryKey: ["job-assignments", job.id] });
                        queryClient.invalidateQueries({ queryKey: ["board-assignments"] });
                        queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });

                        toast({ title: "✅ Etapa confirmada", description: `Movido para "${nextStage.name}"` });
                      } else {
                        toast({ title: "✅ Etapa confirmada", description: `"${currentAssignment.stage_name}" — última etapa` });
                      }
                    } else {
                      toast({ title: "✅ Etapa confirmada", description: `"${job.production_type || job.stage}" registrado` });
                    }
                  } catch (err: any) {
                    toast({ title: "Erro", description: err.message, variant: "destructive" });
                  }
                }}
              >
                ✅ {currentAssignment?.stage_name || job.production_type || job.stage} Ok
              </Button>
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

        {/* Body: Tabs + Toolbar + Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <Tabs defaultValue="itens" className="flex-1 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-5 pt-3 bg-background border-b flex-shrink-0">
              <TabsList className="bg-transparent rounded-none h-auto justify-start gap-1 p-0">
                {[
                  { value: "itens", label: "Itens" },
                  { value: "info", label: "Informações gerais" },
                  { value: "producao", label: "Produção" },
                  { value: "faturamento_tab", label: "Faturamento" },
                  { value: "estatisticas", label: "Estatísticas" },
                  { value: "acompanhamento", label: "Acompanhamento" },
                ].map(tab => (
                  <TabsTrigger key={tab.value} value={tab.value} className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none">
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Horizontal Toolbar */}
            <JobSidebarActions job={job} />

            <ScrollArea className="flex-1">
              <TabsContent value="itens" className="mt-0"><TabItens job={job} /></TabsContent>
              <TabsContent value="info" className="mt-0"><TabInfo job={job} /></TabsContent>
              <TabsContent value="producao" className="mt-0"><TabProducao job={job} onStageChange={onStageChange} /></TabsContent>
              <TabsContent value="faturamento_tab" className="mt-0"><TabFaturamento job={job} /></TabsContent>
              <TabsContent value="estatisticas" className="mt-0"><TabEstatisticas job={job} /></TabsContent>
              <TabsContent value="acompanhamento" className="mt-0"><TabAcompanhamento job={job} /></TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailDialog;
