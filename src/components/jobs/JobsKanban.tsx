import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useJobsData } from "./useJobsData";
import { supabase } from "@/integrations/supabase/client";
import type { Job, JobsFilters, JobsByStage } from "./types";
import { formatBRL, DEFAULT_STAGES } from "./types";
import { getActiveBoards, type Board } from "@/stores/boardsStore";
import JobCard from "./JobCard";
import JobDetailDrawer from "./JobDetailDrawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DragDropContext, Droppable, Draggable, type DropResult,
} from "@hello-pangea/dnd";
import {
  Search, RefreshCw, Loader2, Plus, LayoutGrid, List,
  Calendar, Settings2, Users, ChevronLeft, ChevronRight,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { useRecordMovement } from "@/hooks/useJobStageMovements";
import { useQueryClient } from "@tanstack/react-query";

const JobsKanban: React.FC = () => {
  const boards = useMemo(() => getActiveBoards(), []);
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id || "");
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0] || null, [boards, activeBoardId]);
  const recordMovement = useRecordMovement();
  const queryClient = useQueryClient();

  /** Persist stage change to job_board_assignments and notify */
  const persistStageChange = useCallback(async (job: Job, boardId: string, boardName: string, stageId: string, stageName: string, fromStageName?: string) => {
    try {
      // Deactivate old assignment for this job+board
      await supabase
        .from("job_board_assignments")
        .update({ is_active: false })
        .eq("job_id", job.id)
        .eq("board_id", boardId);

      // Insert new assignment
      const { error: insertError } = await supabase
        .from("job_board_assignments")
        .insert({
          job_id: job.id,
          job_code: job.code || null,
          job_title: job.description || null,
          customer_name: job.client_name || null,
          board_id: boardId,
          board_name: boardName,
          stage_id: stageId,
          stage_name: stageName,
          assigned_by: "Sistema",
          is_active: true,
        });

      if (insertError) {
        console.error("Erro ao inserir assignment:", insertError);
        return;
      }

      // Invalidate query cache so next refetch uses the saved position
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });

      // Send email notification to board members (fire-and-forget)
      supabase.functions.invoke("job-movement-notify", {
        body: {
          job_id: job.id,
          job_code: job.code,
          job_title: job.description,
          customer_name: job.client_name,
          board_id: boardId,
          board_name: boardName,
          from_stage_name: fromStageName || "—",
          to_stage_name: stageName,
          moved_by: "Sistema",
        },
      }).then(({ data }) => {
        if (data?.notified > 0) {
          toast({
            title: "📧 Notificação enviada",
            description: `${data.notified} membro(s) do board "${boardName}" notificado(s)`,
          });
        }
      }).catch(err => console.warn("Erro ao notificar:", err));

    } catch (err) {
      console.error("Erro ao persistir movimentação:", err);
    }
  }, [queryClient]);

  const visibleFlexfields = useMemo(
    () => activeBoard?.flexfields.filter(f => f.show_on_card) || [],
    [activeBoard]
  );

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("aberto");
  const [productionType, setProductionType] = useState("todos");
  const [filterResponsavel, setFilterResponsavel] = useState("todos");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, []);

  

  const scrollKanban = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    const amount = 280;
    el.scrollBy({ left: direction === "right" ? amount : -amount, behavior: "smooth" });
  }, []);

  // Fetch colaboradores for filter
  const [colaboradores, setColaboradores] = useState<string[]>([]);
  React.useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColaboradores(data.map(c => c.nome));
    });
  }, []);

  const now = new Date();
  const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const filters: JobsFilters = { search, status: status as JobsFilters["status"], productionType, dateFrom, dateTo: "" };
  const { data, isLoading, isFetching, refetch, isError } = useJobsData(filters, activeBoard);

  const [localByStage, setLocalByStage] = useState<JobsByStage[] | null>(null);

  // Apply colaborador filter on top of data
  const filteredData = useMemo(() => {
    if (!data) return data;
    if (filterResponsavel === "todos") return data;
    const filterJobs = (jobs: Job[]) => jobs.filter(j =>
      j.responsible.some(r => r.name === filterResponsavel)
    );
    return {
      ...data,
      jobs: filterJobs(data.jobs),
      byStage: data.byStage.map(col => {
        const filtered = filterJobs(col.jobs);
        return { ...col, jobs: filtered, totalValue: filtered.reduce((s, j) => s + j.value, 0) };
      }),
    };
  }, [data, filterResponsavel]);

  const byStage = localByStage || filteredData?.byStage || [];

  React.useEffect(() => { if (data?.byStage) setLocalByStage(null); }, [data?.byStage]);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollButtons();
    el.addEventListener("scroll", updateScrollButtons, { passive: true });
    const ro = new ResizeObserver(updateScrollButtons);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollButtons); ro.disconnect(); };
  }, [updateScrollButtons, byStage]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !data) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStage = source.droppableId;
    const dstStage = destination.droppableId;
    const srcStageObj = byStage.find(c => c.stage.id === srcStage)?.stage;
    const dstStageObj = byStage.find(c => c.stage.id === dstStage)?.stage;
    const dstStageName = dstStageObj?.name || dstStage;

    let movedJob: Job | undefined;

    setLocalByStage(prev => {
      const current = prev || data.byStage;
      const next = current.map(col => ({ ...col, jobs: [...col.jobs] }));
      const srcCol = next.find(c => c.stage.id === srcStage);
      const dstCol = next.find(c => c.stage.id === dstStage);
      if (!srcCol || !dstCol) return prev;

      const [moved] = srcCol.jobs.splice(source.index, 1);
      movedJob = moved;
      moved.stage = dstStage as Job["stage"];
      dstCol.jobs.splice(destination.index, 0, moved);
      srcCol.totalValue = srcCol.jobs.reduce((s, j) => s + j.value, 0);
      dstCol.totalValue = dstCol.jobs.reduce((s, j) => s + j.value, 0);
      return next;
    });

    // Record movement in database for KPI
    if (activeBoard) {
      const job = movedJob || byStage.find(c => c.stage.id === srcStage)?.jobs[source.index];
      recordMovement.mutate({
        job_id: job?.id || result.draggableId,
        job_code: job?.code,
        job_title: job?.description,
        customer_name: job?.client_name,
        board_id: activeBoard.id,
        board_name: activeBoard.name,
        from_stage_id: srcStage,
        from_stage_name: srcStageObj?.name || srcStage,
        to_stage_id: dstStage,
        to_stage_name: dstStageName,
        movement_type: "drag_drop",
        metadata: { value: job?.value, progress: job?.progress_percent },
      });
    }

    // Persist to DB
    if (activeBoard && movedJob) {
      persistStageChange(movedJob, activeBoard.id, activeBoard.name, dstStage, dstStageName, srcStageObj?.name);
    }

    toast({ title: "Job movido", description: `Job movido para ${dstStageName}` });
  }, [data, byStage, activeBoard, recordMovement, persistStageChange]);

  const stageConfigs = activeBoard?.stages || DEFAULT_STAGES;

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      {/* Page Header */}
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1a2332]">Jobs</h1>
          <p className="text-sm text-[#6b7280]">Home / Jobs</p>
        </div>
        <Link to="/admin/boards">
          <Button variant="outline" size="sm" className="gap-1.5 text-xs">
            <Settings2 className="h-3.5 w-3.5" /> Configurar Boards
          </Button>
        </Link>
      </div>

      {/* Board Selector + Filters */}
      <div className="px-6 pb-4 flex flex-wrap items-center gap-3">
        {/* Board tabs */}
        {boards.length > 1 && (
          <div className="flex border rounded-md overflow-hidden mr-2">
            {boards.map(b => (
              <button
                key={b.id}
                onClick={() => { setActiveBoardId(b.id); setLocalByStage(null); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  activeBoardId === b.id
                    ? "text-white"
                    : "bg-white text-[#6b7280] hover:bg-gray-50"
                }`}
                style={activeBoardId === b.id ? { backgroundColor: b.color } : undefined}
              >
                {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-[180px] max-w-[250px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6b7280]" />
          <Input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-9 border-[#e5e7eb]" />
        </div>

        <div className="flex border rounded-md overflow-hidden">
          <button onClick={() => setViewMode("kanban")} className={`p-2 ${viewMode === "kanban" ? "bg-[#1a2332] text-white" : "bg-white text-[#6b7280] hover:bg-gray-50"}`}><LayoutGrid className="h-4 w-4" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-[#1a2332] text-white" : "bg-white text-[#6b7280] hover:bg-gray-50"}`}><List className="h-4 w-4" /></button>
        </div>

        <Select value={productionType} onValueChange={setProductionType}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue placeholder="Tipo de Produção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Produção Completa</SelectItem>
            <SelectItem value="arte">Arte Final</SelectItem>
            <SelectItem value="impressão">Impressão</SelectItem>
            <SelectItem value="acabamento">Acabamento</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[130px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
          <SelectTrigger className="w-[200px] h-9"><Users className="h-4 w-4 mr-1 text-[#6b7280]" /><SelectValue placeholder="Colaborador" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos colaboradores</SelectItem>
            {colaboradores.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 text-sm text-[#6b7280] border rounded-md px-3 h-9">
          <Calendar className="h-4 w-4" />
          <span>De {new Date(dateFrom).toLocaleDateString("pt-BR")} até {now.toLocaleDateString("pt-BR")}</span>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-9">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          </Button>
          <Button className="bg-[#1DB899] hover:bg-[#17a085] text-white h-9 gap-1.5"><Plus className="h-4 w-4" /> Novo Job</Button>
        </div>
      </div>

      {/* Board */}
      {isLoading ? (
        <BoardSkeleton count={stageConfigs.length} />
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-500 font-medium">Erro ao carregar jobs</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex-1 flex items-stretch relative">
            {/* Left scroll button */}
            <button
              onClick={() => scrollKanban("left")}
              className={`flex-shrink-0 w-10 flex items-center justify-center z-20 transition-opacity duration-200 ${
                canScrollLeft ? "opacity-100 cursor-pointer" : "opacity-30 pointer-events-none"
              }`}
              aria-label="Rolar para esquerda"
            >
              <div className="bg-[#1a2332] hover:bg-[#243044] text-white shadow-xl rounded-full p-2 hover:scale-110 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </button>

            {/* Scrollable kanban area */}
            <div
              ref={scrollRef}
              className="overflow-x-auto flex-1 pb-4 scroll-smooth scrollbar-thin"
            >
              <div className="flex gap-3 min-h-[calc(100vh-300px)]">
                {byStage.map(col => (
                  <div key={col.stage.id} className="min-w-[210px] flex-1 max-w-[260px] flex flex-col">
                    <div className="bg-white rounded-t-lg p-3 border border-[#e5e7eb] border-b-0" style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}>
                      <p className="font-bold text-sm text-[#1a2332]">{col.stage.name}</p>
                      <p className="text-xs text-[#6b7280]">{formatBRL(col.totalValue)}</p>
                      <p className="text-xs text-[#6b7280]">{col.jobs.length} Jobs</p>
                    </div>
                    <Droppable droppableId={col.stage.id}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className={`flex-1 bg-[#f0f2f5] border border-[#e5e7eb] border-t-0 rounded-b-lg p-2 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-[#d1fae5]" : ""}`}
                        >
                          {col.jobs.map((job, idx) => (
                            <Draggable key={job.id} draggableId={job.id} index={idx}>
                              {(prov, snap) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                  <JobCard job={job} onClick={() => setSelectedJob(job)} isDragging={snap.isDragging} visibleFlexfields={visibleFlexfields} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {col.jobs.length === 0 && (
                            <div className="text-center py-8 text-[#6b7280] text-xs">Nenhum job nesta etapa</div>
                          )}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            {/* Right scroll button */}
            <button
              onClick={() => scrollKanban("right")}
              className={`flex-shrink-0 w-10 flex items-center justify-center z-20 transition-opacity duration-200 ${
                canScrollRight ? "opacity-100 cursor-pointer" : "opacity-30 pointer-events-none"
              }`}
              aria-label="Rolar para direita"
            >
              <div className="bg-[#1a2332] hover:bg-[#243044] text-white shadow-xl rounded-full p-2 hover:scale-110 transition-transform">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>
        </DragDropContext>
      ) : (
        <div className="px-6 pb-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-[#6b7280] text-xs">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-left p-3">Etapa</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Entrega</th>
                  <th className="text-right p-3">Progresso</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.jobs.map(job => {
                  const stageCfg = byStage.find(s => s.stage.id === job.stage)?.stage;
                  const overdue = job.delivery_date && new Date(job.delivery_date) < new Date();
                  return (
                    <tr key={job.id} onClick={() => setSelectedJob(job)} className={`border-b cursor-pointer hover:bg-gray-50 ${overdue ? "bg-red-50/50" : ""}`}>
                      <td className="p-3 font-mono text-xs">J{job.code || job.id}</td>
                      <td className="p-3 font-medium">{job.client_name}</td>
                      <td className="p-3 text-[#6b7280] max-w-[200px] truncate">{job.description}</td>
                      <td className="p-3"><Badge className="text-[10px] text-white" style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge></td>
                      <td className="p-3">{job.responsible[0]?.name || "—"}</td>
                      <td className="p-3 text-right font-medium">{formatBRL(job.value)}</td>
                      <td className={`p-3 ${overdue ? "text-red-600 font-semibold" : ""}`}>{job.delivery_date ? new Date(job.delivery_date).toLocaleDateString("pt-BR") : "—"}</td>
                      <td className="p-3 text-right">{job.progress_percent}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!filteredData?.jobs || filteredData.jobs.length === 0) && (
              <div className="text-center py-12 text-[#6b7280]">Nenhum job encontrado</div>
            )}
          </div>
        </div>
      )}

      <JobDetailDrawer
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={o => { if (!o) setSelectedJob(null); }}
        onStageChange={(jobId, newStage) => {
          let fromStageId = "";
          let fromStageName = "";
          // Update local state to reflect stage change
          setLocalByStage(prev => {
            const current = prev || data?.byStage || [];
            const next = current.map(col => ({ ...col, jobs: [...col.jobs] }));
            let movedJob: Job | undefined;
            for (const col of next) {
              const idx = col.jobs.findIndex(j => j.id === jobId);
              if (idx >= 0) {
                fromStageId = col.stage.id;
                fromStageName = col.stage.name;
                [movedJob] = col.jobs.splice(idx, 1);
                col.totalValue = col.jobs.reduce((s, j) => s + j.value, 0);
                break;
              }
            }
            if (movedJob) {
              movedJob.stage = newStage as Job["stage"];
              const destCol = next.find(c => c.stage.id === newStage);
              if (destCol) {
                destCol.jobs.push(movedJob);
                destCol.totalValue = destCol.jobs.reduce((s, j) => s + j.value, 0);
              }
              setSelectedJob({ ...movedJob });
            }
            return next;
          });
          // Record in DB for KPI
          const destStageObj = byStage.find(c => c.stage.id === newStage)?.stage;
          if (activeBoard) {
            recordMovement.mutate({
              job_id: jobId,
              job_code: selectedJob?.code,
              job_title: selectedJob?.description,
              customer_name: selectedJob?.client_name,
              board_id: activeBoard.id,
              board_name: activeBoard.name,
              from_stage_id: fromStageId,
              from_stage_name: fromStageName,
              to_stage_id: newStage,
              to_stage_name: destStageObj?.name || newStage,
              movement_type: "stage_change",
            });
            // Persist stage to DB
            if (selectedJob) {
              persistStageChange(selectedJob, activeBoard.id, activeBoard.name, newStage, destStageObj?.name || newStage, fromStageName);
            }
          }
          toast({ title: "Etapa atualizada" });
        }}
      />
    </div>
  );
};

const BoardSkeleton = ({ count = 7 }: { count?: number }) => (
  <div className="flex gap-3 px-6 pb-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="min-w-[210px] flex-1 max-w-[260px] space-y-2">
        <Skeleton className="h-16 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

export default JobsKanban;
