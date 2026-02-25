import React, { useState, useCallback, useMemo, useEffect, useRef } from "react";
import { useJobsData } from "./useJobsData";
import { supabase } from "@/integrations/supabase/client";
import type { Job, JobsFilters, JobsByStage } from "./types";
import { formatBRL, DEFAULT_STAGES } from "./types";
import { getActiveBoards, type Board } from "@/stores/boardsStore";
import JobCard from "./JobCard";
import JobDetailDialog from "./JobDetailDialog";
import BulkActionBar from "./BulkActionBar";
import DrillDownBreadcrumb, { type DrillDownLevel } from "./DrillDownBreadcrumb";
import StageDrillDown from "./StageDrillDown";
import ItemDrillDown from "./ItemDrillDown";
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
  Calendar, Settings2, Users, ChevronLeft, ChevronRight, Archive, MousePointerClick,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { useRecordMovement } from "@/hooks/useJobStageMovements";
import { useQueryClient } from "@tanstack/react-query";
import { useArchivedJobIds, useArchiveJob } from "@/hooks/useJobArchives";

// Drill-down state types
interface DrillDownState {
  level: "board" | "stage" | "job" | "item";
  stageId?: string;
  job?: Job;
  itemId?: string;
}

const JobsKanban: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const boards = useMemo(() => getActiveBoards(), []);
  const [activeBoardId, setActiveBoardId] = useState(() => {
    const paramBoard = searchParams.get("board");
    if (paramBoard && boards.some(b => b.id === paramBoard)) return paramBoard;
    return boards[0]?.id || "";
  });
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0] || null, [boards, activeBoardId]);
  const recordMovement = useRecordMovement();
  const queryClient = useQueryClient();
  const { data: archivedIds, isLoading: archivesLoading } = useArchivedJobIds();
  const archiveJob = useArchiveJob();
  const [showArchived, setShowArchived] = useState(false);

  // Multi-select state
  const [selectedJobIds, setSelectedJobIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [bulkArchiving, setBulkArchiving] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const toggleSelectJob = useCallback((jobId: string, e: React.MouseEvent) => {
    setSelectedJobIds(prev => {
      const next = new Set(prev);
      if (next.has(jobId)) next.delete(jobId);
      else next.add(jobId);
      return next;
    });
    if (!selectionMode) setSelectionMode(true);
  }, [selectionMode]);

  const clearSelection = useCallback(() => {
    setSelectedJobIds(new Set());
    setSelectionMode(false);
  }, []);

  // Track pending moves so we don't clear optimistic state until DB reflects the change
  const pendingMovesRef = useRef<Map<string, string>>(new Map()); // jobId -> targetStageId

  const persistStageChange = useCallback(async (job: Job, boardId: string, boardName: string, stageId: string, stageName: string, fromStageName?: string) => {
    pendingMovesRef.current.set(job.id, stageId);

    try {
      // Deactivate ALL previous assignments for this job on this board
      await supabase
        .from("job_board_assignments")
        .update({ is_active: false })
        .eq("job_id", job.id)
        .eq("board_id", boardId)
        .eq("is_active", true);

      // Insert new active assignment
      const { error: insertError } = await supabase.from("job_board_assignments").insert({
        job_id: job.id, job_code: job.code || null, job_title: job.description || null,
        customer_name: job.client_name || null, board_id: boardId, board_name: boardName,
        stage_id: stageId, stage_name: stageName, assigned_by: "Sistema", is_active: true,
      });

      if (insertError) {
        console.error("Erro ao inserir assignment:", insertError);
        toast({ title: "Erro ao salvar posição", description: insertError.message, variant: "destructive" });
        pendingMovesRef.current.delete(job.id);
        queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
        return;
      }

      // Clear pending and refetch
      pendingMovesRef.current.delete(job.id);
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });

      // Fire-and-forget notification
      supabase.functions.invoke("job-movement-notify", {
        body: { job_id: job.id, job_code: job.code, job_title: job.description, customer_name: job.client_name,
          board_id: boardId, board_name: boardName, from_stage_name: fromStageName || "—", to_stage_name: stageName, moved_by: "Sistema" },
      }).then(({ data }) => {
        if (data?.notified > 0) toast({ title: "📧 Notificação enviada", description: `${data.notified} membro(s) notificado(s)` });
      }).catch(err => console.warn("Erro ao notificar:", err));
    } catch (err) {
      console.error("Erro ao persistir movimentação:", err);
      pendingMovesRef.current.delete(job.id);
      toast({ title: "Erro ao salvar", description: "A posição do job pode não ter sido salva.", variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
    }
  }, [queryClient]);

  const visibleFlexfields = useMemo(() => activeBoard?.flexfields.filter(f => f.show_on_card) || [], [activeBoard]);

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("aberto");
  const [productionType, setProductionType] = useState("todos");
  const [filterResponsavel, setFilterResponsavel] = useState("todos");
  const [filterPrazo, setFilterPrazo] = useState("todos");
  const [filterProgresso, setFilterProgresso] = useState("todos");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [drillDown, setDrillDown] = useState<DrillDownState>({ level: "board" });
  const deepLinkProcessed = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollPercent, setScrollPercent] = useState(0);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 0);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    const maxScroll = el.scrollWidth - el.clientWidth;
    setScrollPercent(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
  }, []);

  const scrollKanban = useCallback((direction: "left" | "right") => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: direction === "right" ? 280 : -280, behavior: "smooth" });
  }, []);

  const [colaboradores, setColaboradores] = useState<string[]>([]);
  React.useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColaboradores(data.map(c => c.nome));
    });
  }, []);

  const now = new Date();
  const defaultFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [dateFrom, setDateFrom] = useState(defaultFrom);
  const [dateTo, setDateTo] = useState(defaultTo);
  const filters: JobsFilters = { search, status: status as JobsFilters["status"], productionType, dateFrom, dateTo };
  const { data, isLoading, isFetching, refetch, isError } = useJobsData(filters, activeBoard);

  const [localByStage, setLocalByStage] = useState<JobsByStage[] | null>(null);

  // Filter by responsavel, deadline, progress, and archive status
  const filteredData = useMemo(() => {
    if (!data) return data;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);

    const filterJobs = (jobs: Job[]) => {
      let result = jobs;
      if (archivedIds && !showArchived) {
        result = result.filter(j => !archivedIds.has(j.id));
      } else if (archivedIds && showArchived) {
        result = result.filter(j => archivedIds.has(j.id));
      }
      if (filterResponsavel !== "todos") {
        result = result.filter(j => j.responsible.some(r => r.name === filterResponsavel));
      }
      if (filterPrazo === "hoje") {
        result = result.filter(j => j.delivery_date && new Date(j.delivery_date) <= todayEnd);
      } else if (filterPrazo === "semana") {
        result = result.filter(j => j.delivery_date && new Date(j.delivery_date) <= weekEnd);
      } else if (filterPrazo === "atrasados") {
        result = result.filter(j => j.delivery_date && new Date(j.delivery_date) < now && j.status !== "fechado");
      }
      if (filterProgresso === "0") {
        result = result.filter(j => j.progress_percent === 0);
      } else if (filterProgresso === "andamento") {
        result = result.filter(j => j.progress_percent > 0 && j.progress_percent < 100);
      } else if (filterProgresso === "concluido") {
        result = result.filter(j => j.progress_percent >= 100);
      }
      return result;
    };
    return {
      ...data,
      jobs: filterJobs(data.jobs),
      byStage: data.byStage.map(col => {
        const filtered = filterJobs(col.jobs);
        return { ...col, jobs: filtered, totalValue: filtered.reduce((s, j) => s + j.value, 0) };
      }),
    };
  }, [data, filterResponsavel, filterPrazo, filterProgresso, archivedIds, showArchived]);

  // When server data arrives, apply any pending moves over it before clearing optimistic state
  const byStage = useMemo(() => {
    const base = localByStage || filteredData?.byStage || [];
    if (pendingMovesRef.current.size === 0 || localByStage) return base;
    // Apply pending moves to server data to prevent visual revert
    const adjusted = base.map(col => ({ ...col, jobs: [...col.jobs] }));
    for (const [jobId, targetStage] of pendingMovesRef.current) {
      // Remove from wrong columns
      for (const col of adjusted) {
        const idx = col.jobs.findIndex(j => j.id === jobId);
        if (idx !== -1 && col.stage.id !== targetStage) {
          const [job] = col.jobs.splice(idx, 1);
          // Add to target column
          const target = adjusted.find(c => c.stage.id === targetStage);
          if (target) {
            job.stage = targetStage as Job["stage"];
            target.jobs.unshift(job);
          }
        }
      }
    }
    // Recalc totals
    for (const col of adjusted) {
      col.totalValue = col.jobs.reduce((s, j) => s + j.value, 0);
    }
    return adjusted;
  }, [localByStage, filteredData?.byStage]);

  React.useEffect(() => { if (data?.byStage) setLocalByStage(null); }, [data?.byStage]);

  // All visible jobs for bulk operations
  const allVisibleJobs = useMemo(() => filteredData?.jobs || [], [filteredData]);

  // Deep link auto-navigation from email notifications
  useEffect(() => {
    if (deepLinkProcessed.current || !data?.jobs.length) return;
    const paramStage = searchParams.get("stage");
    const paramJob = searchParams.get("job");
    if (!paramStage && !paramJob) return;

    deepLinkProcessed.current = true;

    if (paramJob) {
      const job = data.jobs.find(j => j.id === paramJob);
      if (job) {
        setDrillDown({ level: "job", stageId: paramStage || undefined, job });
        setSelectedJob(job);
      } else if (paramStage) {
        setDrillDown({ level: "stage", stageId: paramStage });
      }
    } else if (paramStage) {
      setDrillDown({ level: "stage", stageId: paramStage });
    }

    // Clean URL params without reload
    setSearchParams({}, { replace: true });
  }, [data, searchParams, setSearchParams]);

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
    if (selectionMode) return; // Disable drag during selection mode
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

    if (activeBoard) {
      const job = movedJob || byStage.find(c => c.stage.id === srcStage)?.jobs[source.index];
      recordMovement.mutate({
        job_id: job?.id || result.draggableId, job_code: job?.code, job_title: job?.description,
        customer_name: job?.client_name, board_id: activeBoard.id, board_name: activeBoard.name,
        from_stage_id: srcStage, from_stage_name: srcStageObj?.name || srcStage,
        to_stage_id: dstStage, to_stage_name: dstStageName, movement_type: "drag_drop",
        metadata: { value: job?.value, progress: job?.progress_percent },
      });
    }
    if (activeBoard && movedJob) persistStageChange(movedJob, activeBoard.id, activeBoard.name, dstStage, dstStageName, srcStageObj?.name);
    toast({ title: "Job movido", description: `Job movido para ${dstStageName}` });
  }, [data, byStage, activeBoard, recordMovement, persistStageChange, selectionMode]);

  // Bulk actions
  const handleBulkArchive = useCallback(async (ids: string[]) => {
    setBulkArchiving(true);
    try {
      const jobs = allVisibleJobs.filter(j => ids.includes(j.id));
      // Filter out already archived jobs
      const notArchived = jobs.filter(j => !archivedIds?.has(j.id));
      const rows = notArchived.map(j => ({
        job_id: j.id,
        job_code: j.code ?? null,
        job_title: (j.description || "").substring(0, 200),
        customer_name: (j.client_name || "").substring(0, 200),
        reason: "Arquivamento manual em lote",
        archived_by: "Usuário",
      }));
      if (rows.length > 0) {
        const { error } = await supabase.from("job_archives").insert(rows as any);
        if (error) throw error;
      }
      queryClient.invalidateQueries({ queryKey: ["job-archives"] });
      toast({ title: "Jobs arquivados", description: `${rows.length} job(s) arquivado(s) com sucesso.` });
      clearSelection();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setBulkArchiving(false);
    }
  }, [allVisibleJobs, queryClient, clearSelection, archivedIds]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    setBulkDeleting(true);
    try {
      // Find record_ids in holdprint_cache that match these job ids
      for (const id of ids) {
        await supabase.from("holdprint_cache").delete().eq("endpoint", "jobs").or(`record_id.eq.${id},record_id.eq.poa_${id},record_id.eq.sp_${id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
      toast({ title: "Jobs deletados", description: `${ids.length} job(s) removido(s) do cache local.` });
      clearSelection();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setBulkDeleting(false);
    }
  }, [queryClient, clearSelection]);

  const handleRename = useCallback(async (jobId: string, newTitle: string) => {
    try {
      // Update the title in holdprint_cache raw_data
      const { data: rows } = await supabase.from("holdprint_cache")
        .select("id, raw_data, record_id")
        .eq("endpoint", "jobs")
        .or(`record_id.eq.${jobId},record_id.eq.poa_${jobId},record_id.eq.sp_${jobId}`)
        .limit(1);

      if (rows && rows.length > 0) {
        const row = rows[0];
        const updated = { ...(row.raw_data as any), title: newTitle };
        await supabase.from("holdprint_cache").update({ raw_data: updated }).eq("id", row.id);
      }

      // Also log rename in job_history
      await supabase.from("job_history").insert({
        job_id: jobId,
        event_type: "rename",
        content: `Título alterado para: ${newTitle}`,
        user_name: "Usuário",
      });

      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
      toast({ title: "Job renomeado", description: `Título alterado para "${newTitle}"` });
      clearSelection();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  }, [queryClient, clearSelection]);

  const handleSelectAll = useCallback(() => {
    if (selectedJobIds.size === allVisibleJobs.length) {
      clearSelection();
    } else {
      setSelectedJobIds(new Set(allVisibleJobs.map(j => j.id)));
      setSelectionMode(true);
    }
  }, [allVisibleJobs, selectedJobIds.size, clearSelection]);

  const stageConfigs = activeBoard?.stages || DEFAULT_STAGES;
  const selectedIsArchived = selectedJob ? (archivedIds?.has(selectedJob.id) || false) : false;

  // ── Drill-down navigation ──
  const drillDownToStage = useCallback((stageId: string) => {
    setDrillDown({ level: "stage", stageId });
  }, []);

  const drillDownToJob = useCallback((job: Job) => {
    setDrillDown(prev => ({ ...prev, level: "job", job }));
    setSelectedJob(job);
  }, []);

  const drillDownToItem = useCallback((job: Job, itemId: string) => {
    setDrillDown(prev => ({ ...prev, level: "item", job, itemId }));
  }, []);

  const breadcrumbLevels = useMemo((): DrillDownLevel[] => {
    const boardName = activeBoard?.name || "Jobs";
    const levels: DrillDownLevel[] = [{ type: "board", label: boardName, color: activeBoard?.color }];

    if (drillDown.level !== "board" && drillDown.stageId) {
      const stage = byStage.find(s => s.stage.id === drillDown.stageId)?.stage;
      levels.push({ type: "stage", label: stage?.name || drillDown.stageId, id: drillDown.stageId, color: stage?.color });
    }
    if ((drillDown.level === "job" || drillDown.level === "item") && drillDown.job) {
      levels.push({ type: "job", label: `J${drillDown.job.code || drillDown.job.id} – ${drillDown.job.client_name}`, id: drillDown.job.id });
    }
    if (drillDown.level === "item" && drillDown.itemId) {
      levels.push({ type: "item", label: `Item ${drillDown.itemId.substring(0, 8)}...`, id: drillDown.itemId });
    }
    return levels;
  }, [drillDown, activeBoard, byStage]);

  const handleBreadcrumbNavigate = useCallback((index: number) => {
    const level = breadcrumbLevels[index];
    if (level.type === "board") {
      setDrillDown({ level: "board" });
      setSelectedJob(null);
    } else if (level.type === "stage") {
      setDrillDown({ level: "stage", stageId: level.id });
      setSelectedJob(null);
    } else if (level.type === "job") {
      const job = drillDown.job;
      if (job) setDrillDown({ level: "job", stageId: drillDown.stageId, job });
    }
  }, [breadcrumbLevels, drillDown]);

  const isDrilledDown = drillDown.level !== "board";

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      {/* Header */}
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

      {/* Filters */}
      <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
        {boards.length > 1 && (
          <div className="flex border rounded-md overflow-hidden mr-1">
            {boards.map(b => (
              <button key={b.id} onClick={() => { setActiveBoardId(b.id); setLocalByStage(null); }}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeBoardId === b.id ? "text-white" : "bg-white text-[#6b7280] hover:bg-gray-50"}`}
                style={activeBoardId === b.id ? { backgroundColor: b.color } : undefined}>
                {b.name}
              </button>
            ))}
          </div>
        )}

        <div className="relative flex-1 min-w-[160px] max-w-[220px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6b7280]" />
          <Input placeholder="Buscar" value={search} onChange={e => setSearch(e.target.value)} className="pl-8 h-8 text-xs border-[#e5e7eb]" />
        </div>

        <div className="flex border rounded-md overflow-hidden">
          <button onClick={() => setViewMode("kanban")} className={`p-1.5 ${viewMode === "kanban" ? "bg-[#1a2332] text-white" : "bg-white text-[#6b7280] hover:bg-gray-50"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 ${viewMode === "list" ? "bg-[#1a2332] text-white" : "bg-white text-[#6b7280] hover:bg-gray-50"}`}><List className="h-3.5 w-3.5" /></button>
        </div>

        <Select value={productionType} onValueChange={setProductionType}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Tipo de Produção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Produção Completa</SelectItem>
            <SelectItem value="arte">Arte Final</SelectItem>
            <SelectItem value="impressão">Impressão</SelectItem>
            <SelectItem value="acabamento">Acabamento</SelectItem>
          </SelectContent>
        </Select>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[110px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="aberto">Abertos</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
          <SelectTrigger className="w-[170px] h-8 text-xs"><Users className="h-3.5 w-3.5 mr-1 text-[#6b7280]" /><SelectValue placeholder="Todos..." /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos...</SelectItem>
            {colaboradores.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterPrazo} onValueChange={setFilterPrazo}>
          <SelectTrigger className="w-[130px] h-8 text-xs"><Calendar className="h-3.5 w-3.5 mr-1 text-muted-foreground" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Prazo: Todos</SelectItem>
            <SelectItem value="hoje">📅 Hoje</SelectItem>
            <SelectItem value="semana">📅 Semana</SelectItem>
            <SelectItem value="atrasados">🔴 Atrasados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterProgresso} onValueChange={setFilterProgresso}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Progresso: Todos</SelectItem>
            <SelectItem value="0">📊 0%</SelectItem>
            <SelectItem value="andamento">📊 Em andamento</SelectItem>
            <SelectItem value="concluido">📊 Concluído</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 border rounded-md px-2 h-8">
          <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
            className="bg-transparent text-[11px] text-muted-foreground border-none outline-none w-[105px]" />
          <span className="text-[11px] text-muted-foreground">até</span>
          <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
            className="bg-transparent text-[11px] text-muted-foreground border-none outline-none w-[105px]" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant={selectionMode ? "default" : "outline"}
            size="sm"
            onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
            className={`h-8 gap-1 text-xs ${selectionMode ? "bg-[#1DB899] hover:bg-[#17a085] text-white" : ""}`}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            {selectionMode ? "Cancelar seleção" : "Selecionar"}
          </Button>

          <Button
            variant={showArchived ? "default" : "outline"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-8 gap-1 text-xs ${showArchived ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? "Arquivados" : "Arquivo"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching} className="h-8 px-2">
            {isFetching ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
          </Button>
          <Button className="bg-[#1DB899] hover:bg-[#17a085] text-white h-8 gap-1 text-xs"><Plus className="h-3.5 w-3.5" /> Novo Job</Button>
        </div>
      </div>

      {/* Breadcrumb - shown when drilled down */}
      {isDrilledDown && (
        <DrillDownBreadcrumb levels={breadcrumbLevels} onNavigate={handleBreadcrumbNavigate} />
      )}

      {/* Drill-down views */}
      {isDrilledDown && drillDown.level === "stage" && drillDown.stageId ? (
        (() => {
          const stageData = byStage.find(s => s.stage.id === drillDown.stageId);
          if (!stageData) return <div className="flex-1 flex items-center justify-center text-muted-foreground">Etapa não encontrada</div>;
          return <StageDrillDown stageData={stageData} onSelectJob={(job) => drillDownToJob(job)} />;
        })()
      ) : isDrilledDown && drillDown.level === "item" && drillDown.job && drillDown.itemId ? (
        <ItemDrillDown job={drillDown.job} itemId={drillDown.itemId} />
      ) : isDrilledDown && drillDown.level === "job" && drillDown.job ? (
        // Job-level drill-down uses the dialog (already open via selectedJob)
        null
      ) : isLoading ? (
        <BoardSkeleton count={stageConfigs.length} />
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive font-medium">Erro ao carregar jobs</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2">Tentar novamente</Button>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="px-6 pb-1.5">
            <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-muted/30 border">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">◀ Rolagem Horizontal ▶</span>
              <input type="range" min={0} max={100} step={0.5} value={scrollPercent}
                onChange={(e) => { const val = Number(e.target.value); setScrollPercent(val); const el = scrollRef.current; if (el) el.scrollLeft = (val / 100) * (el.scrollWidth - el.clientWidth); }}
                className="w-full h-1.5 cursor-pointer rounded-full" style={{ accentColor: "#1DB899" }} />
            </div>
          </div>

          <div className="flex-1 flex items-stretch relative">
            <button onClick={() => scrollKanban("left")}
              className={`flex-shrink-0 w-8 flex items-center justify-center z-20 transition-all duration-300 ${canScrollLeft ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}>
              <div className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full p-2 hover:scale-110 transition-transform animate-pulse">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </button>

            <div ref={scrollRef} className="overflow-x-auto flex-1 pb-4 scroll-smooth scrollbar-thin">
              <div className="flex gap-2.5 min-h-[calc(100vh-300px)]">
                {byStage.map(col => (
                  <div key={col.stage.id} className="min-w-[200px] flex-1 max-w-[250px] flex flex-col">
                    <div
                      onClick={() => drillDownToStage(col.stage.id)}
                      className="bg-card rounded-t-lg p-2.5 border border-border border-b-0 cursor-pointer hover:bg-accent/50 transition-colors group"
                      style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}
                    >
                      <p className="font-bold text-[13px] text-foreground group-hover:text-primary transition-colors">{col.stage.name}</p>
                      <p className="text-[11px] text-muted-foreground">{formatBRL(col.totalValue)}</p>
                      <p className="text-[11px] text-muted-foreground">{col.jobs.length} Jobs</p>
                    </div>
                    <Droppable droppableId={col.stage.id} isDropDisabled={selectionMode}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 bg-muted/50 border border-border border-t-0 rounded-b-lg p-1.5 space-y-1.5 transition-colors ${snapshot.isDraggingOver ? "bg-emerald-100/50" : ""}`}>
                          {col.jobs.map((job, idx) => (
                            <Draggable key={job.id} draggableId={job.id} index={idx} isDragDisabled={selectionMode}>
                              {(prov, snap) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                  <JobCard
                                    job={job}
                                    onClick={() => { if (!selectionMode) { drillDownToJob(job); } }}
                                    isDragging={snap.isDragging}
                                    visibleFlexfields={visibleFlexfields}
                                    selectionMode={selectionMode}
                                    isSelected={selectedJobIds.has(job.id)}
                                    onToggleSelect={toggleSelectJob}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {col.jobs.length === 0 && <div className="text-center py-6 text-[#6b7280] text-xs">Nenhum job</div>}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            <button onClick={() => scrollKanban("right")}
              className={`flex-shrink-0 w-8 flex items-center justify-center z-20 transition-all duration-300 ${canScrollRight ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}>
              <div className="bg-red-600 hover:bg-red-700 text-white shadow-lg rounded-full p-2 hover:scale-110 transition-transform animate-pulse">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>

          <div className="px-6 pt-1.5">
            <div className="flex items-center gap-3 px-3 py-1 rounded-md bg-muted/30 border">
              <span className="text-[10px] text-muted-foreground whitespace-nowrap font-medium">◀ Rolagem Horizontal ▶</span>
              <input type="range" min={0} max={100} step={0.5} value={scrollPercent}
                onChange={(e) => { const val = Number(e.target.value); setScrollPercent(val); const el = scrollRef.current; if (el) el.scrollLeft = (val / 100) * (el.scrollWidth - el.clientWidth); }}
                className="w-full h-1.5 cursor-pointer rounded-full" style={{ accentColor: "#1DB899" }} />
            </div>
          </div>
        </DragDropContext>
      ) : (
        <div className="px-6 pb-4">
          <div className="border rounded-lg overflow-hidden bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b text-[#6b7280] text-xs">
                  {selectionMode && <th className="w-8 p-2.5"></th>}
                  <th className="text-left p-2.5">#</th>
                  <th className="text-left p-2.5">Cliente</th>
                  <th className="text-left p-2.5">Descrição</th>
                  <th className="text-left p-2.5">Etapa</th>
                  <th className="text-left p-2.5">Responsável</th>
                  <th className="text-right p-2.5">Valor</th>
                  <th className="text-left p-2.5">Entrega</th>
                  <th className="text-right p-2.5">%</th>
                  <th className="text-center p-2.5">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.jobs.map(job => {
                  const stageCfg = byStage.find(s => s.stage.id === job.stage)?.stage;
                  const overdue = job.delivery_date && new Date(job.delivery_date) < new Date();
                  const isArch = archivedIds?.has(job.id);
                  const isSel = selectedJobIds.has(job.id);
                  return (
                    <tr key={job.id} className={`border-b cursor-pointer hover:bg-gray-50 ${overdue ? "bg-red-50/50" : ""} ${isArch ? "opacity-50" : ""} ${isSel ? "bg-emerald-50 ring-1 ring-inset ring-[#1DB899]" : ""}`}>
                      {selectionMode && (
                        <td className="p-2.5">
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${isSel ? "bg-[#1DB899] border-[#1DB899] text-white" : "border-gray-300"}`}
                            onClick={(e) => toggleSelectJob(job.id, e)}
                          >
                            {isSel && <span className="text-[10px]">✓</span>}
                          </div>
                        </td>
                      )}
                      <td className="p-2.5 font-mono text-xs" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>J{job.code || job.id}</td>
                      <td className="p-2.5 font-medium text-xs" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.client_name}</td>
                      <td className="p-2.5 text-muted-foreground text-xs max-w-[180px] truncate" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.description}</td>
                      <td className="p-2.5" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}><Badge className="text-[9px] text-white" style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge></td>
                      <td className="p-2.5 text-xs" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.responsible[0]?.name || "—"}</td>
                      <td className="p-2.5 text-right text-xs font-medium" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{formatBRL(job.value)}</td>
                      <td className={`p-2.5 text-xs ${overdue ? "text-destructive font-semibold" : ""}`} onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>
                        {job.delivery_date ? new Date(job.delivery_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="p-2.5 text-right text-xs" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.progress_percent}%</td>
                      <td className="p-2.5 text-center">
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0"
                          onClick={() => archiveJob.mutate({ job_id: job.id, job_code: job.code, job_title: job.description, customer_name: job.client_name })}>
                          <Archive className="h-3.5 w-3.5 text-[#6b7280]" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!filteredData?.jobs || filteredData.jobs.length === 0) && (
              <div className="text-center py-10 text-[#6b7280]">{showArchived ? "Nenhum job arquivado" : "Nenhum job encontrado"}</div>
            )}
          </div>
        </div>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedIds={selectedJobIds}
        allJobs={allVisibleJobs}
        onClearSelection={clearSelection}
        onSelectAll={handleSelectAll}
        totalVisible={allVisibleJobs.length}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={handleBulkDelete}
        onRename={handleRename}
        isArchiving={bulkArchiving}
        isDeleting={bulkDeleting}
      />

      <JobDetailDialog
        job={selectedJob}
        open={!!selectedJob}
        onOpenChange={o => { if (!o) { setSelectedJob(null); if (drillDown.level === "job") setDrillDown(prev => prev.stageId ? { level: "stage", stageId: prev.stageId } : { level: "board" }); } }}
        isArchived={selectedIsArchived}
        onStageChange={(jobId, newStage) => {
          let fromStageId = "";
          let fromStageName = "";
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
              if (destCol) { destCol.jobs.push(movedJob); destCol.totalValue = destCol.jobs.reduce((s, j) => s + j.value, 0); }
              setSelectedJob({ ...movedJob });
            }
            return next;
          });
          const destStageObj = byStage.find(c => c.stage.id === newStage)?.stage;
          if (activeBoard) {
            recordMovement.mutate({
              job_id: jobId, job_code: selectedJob?.code, job_title: selectedJob?.description,
              customer_name: selectedJob?.client_name, board_id: activeBoard.id, board_name: activeBoard.name,
              from_stage_id: fromStageId, from_stage_name: fromStageName,
              to_stage_id: newStage, to_stage_name: destStageObj?.name || newStage, movement_type: "stage_change",
            });
            if (selectedJob) persistStageChange(selectedJob, activeBoard.id, activeBoard.name, newStage, destStageObj?.name || newStage, fromStageName);
          }
          toast({ title: "Etapa atualizada" });
        }}
      />
    </div>
  );
};

const BoardSkeleton = ({ count = 7 }: { count?: number }) => (
  <div className="flex gap-2.5 px-6 pb-4">
    {[...Array(count)].map((_, i) => (
      <div key={i} className="min-w-[200px] flex-1 max-w-[250px] space-y-2">
        <Skeleton className="h-14 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
        <Skeleton className="h-24 w-full rounded-lg" />
      </div>
    ))}
  </div>
);

export default JobsKanban;
