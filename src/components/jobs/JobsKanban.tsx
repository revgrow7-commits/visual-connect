import React, { useState, useCallback, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useJobsData } from "./useJobsData";
import { supabase } from "@/integrations/supabase/client";
import type { Job, JobsFilters, JobsByStage } from "./types";
import { formatBRL, DEFAULT_STAGES } from "./types";
import { type Board } from "@/stores/boardsStore";
import { useActiveBoards, useActiveMicroBoards } from "@/hooks/useBoards";
import KanbanColumn from "./KanbanColumn";
import JobCard from "./JobCard";
import type { JobAssignmentBadge, JobCollabBadge, JobEquipmentBadge, JobEtiquetaBadge } from "./JobCard";
import BulkActionBar from "./BulkActionBar";
import DrillDownBreadcrumb, { type DrillDownLevel } from "./DrillDownBreadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebouncedSearch } from "@/hooks/useDebouncedSearch";
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
  Briefcase, Clock, TrendingUp, CalendarCheck,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link, useSearchParams } from "react-router-dom";
import { useRecordMovement } from "@/hooks/useJobStageMovements";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useArchivedJobIds, useArchiveJob, useDeleteJobFromCache } from "@/hooks/useJobArchives";
import { useAllActiveEquipment } from "@/hooks/useJobEquipment";

// Drill-down state types
interface DrillDownState {
  level: "board" | "stage" | "job" | "item";
  stageId?: string;
  job?: Job;
  itemId?: string;
}

// ── KPI Summary Card ──
const KPICard = ({ icon: Icon, value, label, color, bgColor }: {
  icon: React.ElementType; value: number | string; label: string; color: string; bgColor: string;
}) => (
  <div className="flex items-center gap-3 bg-[#161b26] border border-[#2a2f3d] rounded-xl px-5 py-4 flex-1 min-w-[160px]">
    <div className="p-2.5 rounded-lg" style={{ backgroundColor: bgColor }}>
      <Icon className="h-5 w-5" style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold text-gray-100 tabular-nums">{value}</p>
      <p className="text-xs text-gray-500 font-medium">{label}</p>
    </div>
  </div>
);

const JobsKanban: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: boards = [] } = useActiveBoards();
  const [activeBoardId, setActiveBoardId] = useState(() => {
    const paramBoard = searchParams.get("board");
    return paramBoard || "";
  });
  // Auto-select first board when boards load
  useEffect(() => {
    if (boards.length > 0 && (!activeBoardId || !boards.some(b => b.id === activeBoardId))) {
      setActiveBoardId(boards[0].id);
    }
  }, [boards, activeBoardId]);
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0] || null, [boards, activeBoardId]);
  const { data: microBoards = [] } = useActiveMicroBoards(activeBoardId);
  const [activeMicroBoardId, setActiveMicroBoardId] = useState<string | null>(null);
  const activeMicroBoard = useMemo(() => microBoards.find(b => b.id === activeMicroBoardId) || null, [microBoards, activeMicroBoardId]);
  const recordMovement = useRecordMovement();
  const queryClient = useQueryClient();
  const { data: archivedIds, isLoading: archivesLoading } = useArchivedJobIds();
  const archiveJob = useArchiveJob();
  const deleteJob = useDeleteJobFromCache();
  const [showArchived, setShowArchived] = useState(false);

  // ── Fetch all active board assignments for badge display ──
  const { data: allBoardAssignments = [] } = useQuery({
    queryKey: ["all-board-assignments-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_board_assignments")
        .select("job_id, board_id, board_name, stage_name, item_name")
        .eq("is_active", true)
        .order("assigned_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  const { data: allItemAssignments = [] } = useQuery({
    queryKey: ["all-item-assignments-badges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_item_assignments")
        .select("job_id, item_name, collaborator_name")
        .eq("is_active", true);
      if (error) throw error;
      return data || [];
    },
    staleTime: 30_000,
  });

  // Build lookup maps for quick access per job
  const boardAssignmentsByJob = useMemo(() => {
    const map = new Map<string, JobAssignmentBadge[]>();
    for (const a of allBoardAssignments) {
      const boardObj = boards.find(b => b.id === a.board_id);
      if (!map.has(a.job_id)) map.set(a.job_id, []);
      map.get(a.job_id)!.push({
        board_name: a.board_name,
        board_id: a.board_id,
        board_color: boardObj?.color,
        stage_name: a.stage_name,
        item_name: a.item_name,
      });
    }
    return map;
  }, [allBoardAssignments, boards]);

  const collabAssignmentsByJob = useMemo(() => {
    const map = new Map<string, JobCollabBadge[]>();
    for (const a of allItemAssignments) {
      if (!map.has(a.job_id)) map.set(a.job_id, []);
      map.get(a.job_id)!.push({
        collaborator_name: a.collaborator_name,
        item_name: a.item_name,
      });
    }
    return map;
  }, [allItemAssignments]);

  // ── Active equipment assignments for badge display ──
  const { data: allActiveEquipment = [] } = useAllActiveEquipment();
  const equipmentByJob = useMemo(() => {
    const map = new Map<string, JobEquipmentBadge[]>();
    for (const eq of allActiveEquipment) {
      if (!map.has(eq.job_id)) map.set(eq.job_id, []);
      map.get(eq.job_id)!.push({
        equipment: eq.equipment,
        started_at: eq.started_at,
        board_name: eq.board_name,
        stage_name: eq.stage_name,
      });
    }
    return map;
  }, [allActiveEquipment]);

  // ── Etiquetas for badge display on cards ──
  const { data: allEtiquetas = [] } = useQuery({
    queryKey: ["etiquetas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("etiquetas").select("*");
      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const { data: allJobExtensions = [] } = useQuery({
    queryKey: ["all-job-extensions-tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_extensions")
        .select("holdprint_job_id, tags");
      if (error) throw error;
      return (data || []).filter((d: any) => d.tags && d.tags.length > 0);
    },
    staleTime: 30_000,
  });

  const etiquetasByJob = useMemo(() => {
    const etMap = new Map<string, { id: string; nome: string; cor: string }>();
    for (const et of allEtiquetas) etMap.set(et.id, { id: et.id, nome: et.nome, cor: et.cor });
    const map = new Map<string, JobEtiquetaBadge[]>();
    for (const ext of allJobExtensions) {
      const badges: JobEtiquetaBadge[] = [];
      for (const tagId of (ext.tags || [])) {
        const et = etMap.get(tagId);
        if (et) badges.push(et);
      }
      if (badges.length > 0) map.set(ext.holdprint_job_id, badges);
    }
    return map;
  }, [allEtiquetas, allJobExtensions]);

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

  const pendingMovesRef = useRef<Map<string, string>>(new Map());

  const persistStageChange = useCallback(async (job: Job, boardId: string, boardName: string, stageId: string, stageName: string, fromStageName?: string) => {
    pendingMovesRef.current.set(job.id, stageId);
    try {
      await supabase.from("job_board_assignments").update({ is_active: false }).eq("job_id", job.id).eq("board_id", boardId).eq("is_active", true);
      const { error: insertError } = await supabase.from("job_board_assignments").insert({
        job_id: job.id, job_code: job.code || null, job_title: job.description || null,
        customer_name: job.client_name || null, board_id: boardId, board_name: boardName,
        stage_id: stageId, stage_name: stageName, assigned_by: "Sistema", is_active: true,
      });
      if (insertError) {
        toast({ title: "Erro ao salvar posição", description: insertError.message, variant: "destructive" });
        pendingMovesRef.current.delete(job.id);
        queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
        return;
      }
      pendingMovesRef.current.delete(job.id);
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
      queryClient.invalidateQueries({ queryKey: ["all-board-assignments-badges"] });
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
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const defaultFrom = `${twoDaysAgo.getFullYear()}-${String(twoDaysAgo.getMonth() + 1).padStart(2, "0")}-${String(twoDaysAgo.getDate()).padStart(2, "0")}`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const [dateFrom] = useState(defaultFrom);
  const [dateTo] = useState(defaultTo);
  const filters: JobsFilters = { search, status: status as JobsFilters["status"], productionType, dateFrom, dateTo };
  const { data, isLoading, isFetching, refetch, isError } = useJobsData(filters, activeBoard);

  const [localByStage, setLocalByStage] = useState<JobsByStage[] | null>(null);

  const filteredData = useMemo(() => {
    if (!data) return data;
    const now = new Date();
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    const weekEnd = new Date(todayEnd.getTime() + 7 * 86400000);
    const filterJobs = (jobs: Job[]) => {
      let result = jobs;
      if (archivedIds && !showArchived) result = result.filter(j => !archivedIds.has(j.id));
      else if (archivedIds && showArchived) result = result.filter(j => archivedIds.has(j.id));
      if (filterResponsavel !== "todos") result = result.filter(j => j.responsible.some(r => r.name === filterResponsavel));
      if (filterPrazo === "hoje") result = result.filter(j => j.delivery_date && new Date(j.delivery_date) <= todayEnd);
      else if (filterPrazo === "semana") result = result.filter(j => j.delivery_date && new Date(j.delivery_date) <= weekEnd);
      else if (filterPrazo === "atrasados") result = result.filter(j => j.delivery_date && new Date(j.delivery_date) < now && j.status !== "fechado");
      if (filterProgresso === "0") result = result.filter(j => j.progress_percent === 0);
      else if (filterProgresso === "andamento") result = result.filter(j => j.progress_percent > 0 && j.progress_percent < 100);
      else if (filterProgresso === "concluido") result = result.filter(j => j.progress_percent >= 100);
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

  const byStage = useMemo(() => {
    const base = localByStage || filteredData?.byStage || [];
    if (pendingMovesRef.current.size === 0 || localByStage) return base;
    const adjusted = base.map(col => ({ ...col, jobs: [...col.jobs] }));
    for (const [jobId, targetStage] of pendingMovesRef.current) {
      for (const col of adjusted) {
        const idx = col.jobs.findIndex(j => j.id === jobId);
        if (idx !== -1 && col.stage.id !== targetStage) {
          const [job] = col.jobs.splice(idx, 1);
          const target = adjusted.find(c => c.stage.id === targetStage);
          if (target) { job.stage = targetStage as Job["stage"]; target.jobs.unshift(job); }
        }
      }
    }
    for (const col of adjusted) col.totalValue = col.jobs.reduce((s, j) => s + j.value, 0);
    return adjusted;
  }, [localByStage, filteredData?.byStage]);

  React.useEffect(() => { if (data?.byStage) setLocalByStage(null); }, [data?.byStage]);

  const allVisibleJobs = useMemo(() => filteredData?.jobs || [], [filteredData]);

  // KPI calculations
  const kpis = useMemo(() => {
    const jobs = filteredData?.jobs || [];
    const total = jobs.length;
    const aguardando = byStage.find(s => s.stage.id === "revisao_comercial")?.jobs.length || 0;
    const instalando = byStage.find(s => s.stage.id === "instalacao")?.jobs.length || 0;
    const agendados = byStage.find(s => s.stage.id === "entrega")?.jobs.length || 0;
    return { total, aguardando, instalando, agendados };
  }, [filteredData, byStage]);

  useEffect(() => {
    if (deepLinkProcessed.current || !data?.jobs.length) return;
    const paramStage = searchParams.get("stage");
    const paramJob = searchParams.get("job");
    if (!paramStage && !paramJob) return;
    deepLinkProcessed.current = true;
    if (paramJob) {
      const job = data.jobs.find(j => j.id === paramJob);
      if (job) { setDrillDown({ level: "job", stageId: paramStage || undefined, job }); setSelectedJob(job); }
      else if (paramStage) setDrillDown({ level: "stage", stageId: paramStage });
    } else if (paramStage) setDrillDown({ level: "stage", stageId: paramStage });
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
    if (selectionMode) return;
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
      const totalColumns = next.length;
      const dstIndex = next.findIndex(c => c.stage.id === dstStage);
      if (totalColumns > 1 && dstIndex >= 0) moved.progress_percent = Math.round(((dstIndex + 1) / totalColumns) * 100);
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
      const notArchived = jobs.filter(j => !archivedIds?.has(j.id));
      const rows = notArchived.map(j => ({
        job_id: j.id, job_code: j.code ?? null,
        job_title: (j.description || "").substring(0, 200),
        customer_name: (j.client_name || "").substring(0, 200),
        reason: "Arquivamento manual em lote", archived_by: "Usuário",
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
    } finally { setBulkArchiving(false); }
  }, [allVisibleJobs, queryClient, clearSelection, archivedIds]);

  const handleBulkDelete = useCallback(async (ids: string[]) => {
    setBulkDeleting(true);
    try {
      for (const id of ids) {
        await supabase.from("holdprint_cache").delete().eq("endpoint", "jobs").or(`record_id.eq.${id},record_id.eq.poa_${id},record_id.eq.sp_${id}`);
      }
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
      toast({ title: "Jobs deletados", description: `${ids.length} job(s) removido(s) do cache local.` });
      clearSelection();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally { setBulkDeleting(false); }
  }, [queryClient, clearSelection]);

  const handleRename = useCallback(async (jobId: string, newTitle: string) => {
    try {
      const { data: rows } = await supabase.from("holdprint_cache")
        .select("id, raw_data, record_id").eq("endpoint", "jobs")
        .or(`record_id.eq.${jobId},record_id.eq.poa_${jobId},record_id.eq.sp_${jobId}`).limit(1);
      if (rows && rows.length > 0) {
        const row = rows[0];
        const updated = { ...(row.raw_data as any), title: newTitle };
        await supabase.from("holdprint_cache").update({ raw_data: updated }).eq("id", row.id);
      }
      await supabase.from("job_history").insert({
        job_id: jobId, event_type: "rename", content: `Título alterado para: ${newTitle}`, user_name: "Usuário",
      });
      queryClient.invalidateQueries({ queryKey: ["holdprint-jobs-kanban"] });
      toast({ title: "Job renomeado", description: `Título alterado para "${newTitle}"` });
      clearSelection();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    }
  }, [queryClient, clearSelection]);

  const handleSelectAll = useCallback(() => {
    if (selectedJobIds.size === allVisibleJobs.length) clearSelection();
    else { setSelectedJobIds(new Set(allVisibleJobs.map(j => j.id))); setSelectionMode(true); }
  }, [allVisibleJobs, selectedJobIds.size, clearSelection]);

  const stageConfigs = activeBoard?.stages || DEFAULT_STAGES;
  const selectedIsArchived = selectedJob ? (archivedIds?.has(selectedJob.id) || false) : false;

  // ── Drill-down navigation ──
  const drillDownToStage = useCallback((stageId: string) => { setDrillDown({ level: "stage", stageId }); }, []);
  const drillDownToJob = useCallback((job: Job) => { setDrillDown(prev => ({ ...prev, level: "job", job })); setSelectedJob(job); }, []);
  const drillDownToItem = useCallback((job: Job, itemId: string) => { setDrillDown(prev => ({ ...prev, level: "item", job, itemId })); }, []);

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
    if (level.type === "board") { setDrillDown({ level: "board" }); setSelectedJob(null); }
    else if (level.type === "stage") { setDrillDown({ level: "stage", stageId: level.id }); setSelectedJob(null); }
    else if (level.type === "job") { const job = drillDown.job; if (job) setDrillDown({ level: "job", stageId: drillDown.stageId, job }); }
  }, [breadcrumbLevels, drillDown]);

  const isDrilledDown = drillDown.level !== "board";

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      {/* ── Header ── */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Jobs</h1>
          <p className="text-sm text-white/60">{filteredData?.total || 0} job(s) encontrado(s)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isFetching}
            className="h-9 px-3 text-white/70 hover:text-white hover:bg-[#1e2330] border border-[#2a2f3d]">
            {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            <span className="ml-1.5 text-xs">Atualizar</span>
          </Button>
          <Link to="/admin/boards">
            <Button variant="ghost" size="sm" className="h-9 px-3 text-white/70 hover:text-white hover:bg-[#1e2330] border border-[#2a2f3d]">
              <Settings2 className="h-4 w-4 mr-1.5" /> <span className="text-xs">Configurar</span>
            </Button>
          </Link>
          <Button className="bg-rose-600 hover:bg-rose-700 text-white h-9 gap-1.5 text-xs font-semibold shadow-lg shadow-rose-600/20">
            <Plus className="h-4 w-4" /> Importar Holdprint
          </Button>
        </div>
      </div>

      {/* KPI Summary and Movements Feed hidden per user request */}

      {/* ── Filters ── */}
      <div className="px-6 pb-3 flex flex-wrap items-center gap-2">
        {/* Board tabs */}
        <div className="flex border border-[#2a2f3d] rounded-lg overflow-hidden mr-1">
          {boards.map(b => (
            <button key={b.id} onClick={() => { setActiveBoardId(b.id); setLocalByStage(null); setDrillDown({ level: "board" }); setSelectedJob(null); setActiveMicroBoardId(null); }}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${activeBoardId === b.id && !activeMicroBoardId ? "text-white" : "bg-[#161b26] text-white/70 hover:bg-[#1e2330] hover:text-white"}`}
              style={activeBoardId === b.id && !activeMicroBoardId ? { backgroundColor: b.color } : undefined}>
              {b.name}
            </button>
          ))}
        </div>

        {/* Micro board sub-tabs */}
        {microBoards.length > 0 && (
          <div className="flex border border-[#2a2f3d] rounded-lg overflow-hidden mr-1">
            {microBoards.map(mb => (
              <button key={mb.id} onClick={() => { setActiveMicroBoardId(mb.id); setDrillDown({ level: "board" }); setSelectedJob(null); }}
                className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors flex items-center gap-1.5 ${activeMicroBoardId === mb.id ? "text-white" : "bg-[#161b26] text-white/70 hover:bg-[#1e2330]"}`}
                style={activeMicroBoardId === mb.id ? { backgroundColor: mb.color } : undefined}>
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: mb.color }} />
                {mb.name}
              </button>
            ))}
          </div>
        )}

        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/50" />
          <Input placeholder="Buscar por título, cliente ou #código..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-xs bg-[#161b26] border-[#2a2f3d] text-white placeholder:text-white/40 focus:border-rose-500/50 focus:ring-rose-500/20" />
        </div>

        {/* View toggle */}
        <div className="flex border border-[#2a2f3d] rounded-lg overflow-hidden">
          <button onClick={() => setViewMode("kanban")} className={`p-2 transition-colors ${viewMode === "kanban" ? "bg-[#2a2f3d] text-white" : "bg-[#161b26] text-white/60 hover:text-white"}`}><LayoutGrid className="h-3.5 w-3.5" /></button>
          <button onClick={() => setViewMode("list")} className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#2a2f3d] text-white" : "bg-[#161b26] text-white/60 hover:text-white"}`}><List className="h-3.5 w-3.5" /></button>
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[130px] h-9 text-xs bg-[#161b26] border-[#2a2f3d] text-white"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-[#1e2330] border-[#2a2f3d] text-white">
            <SelectItem value="aberto">Todos os Status</SelectItem>
            <SelectItem value="fechado">Fechados</SelectItem>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="cancelado">Cancelados</SelectItem>
          </SelectContent>
        </Select>

        <Select value={filterResponsavel} onValueChange={setFilterResponsavel}>
          <SelectTrigger className="w-[160px] h-9 text-xs bg-[#161b26] border-[#2a2f3d] text-white">
            <Users className="h-3.5 w-3.5 mr-1 text-white/50" /><SelectValue placeholder="Todas as Filiais" />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2330] border-[#2a2f3d] text-white">
            <SelectItem value="todos">Todos...</SelectItem>
            {colaboradores.map(name => <SelectItem key={name} value={name}>{name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={filterPrazo} onValueChange={setFilterPrazo}>
          <SelectTrigger className="w-[130px] h-9 text-xs bg-[#161b26] border-[#2a2f3d] text-white">
            <Calendar className="h-3.5 w-3.5 mr-1 text-white/50" /><SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1e2330] border-[#2a2f3d] text-white">
            <SelectItem value="todos">Prazo: Todos</SelectItem>
            <SelectItem value="hoje">Hoje</SelectItem>
            <SelectItem value="semana">Semana</SelectItem>
            <SelectItem value="atrasados">Atrasados</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1.5 border border-[#2a2f3d] rounded-lg px-3 h-9 bg-[#161b26]">
          <Calendar className="h-3.5 w-3.5 text-white/50" />
          <input type="date" value={dateFrom} readOnly
            className="bg-transparent text-[11px] text-white/80 border-none outline-none w-[105px] pointer-events-none" />
          <span className="text-[11px] text-white/40">→</span>
          <input type="date" value={dateTo} readOnly
            className="bg-transparent text-[11px] text-white/80 border-none outline-none w-[105px] pointer-events-none" />
        </div>

        <div className="ml-auto flex items-center gap-1.5">
          <Button
            variant={selectionMode ? "default" : "ghost"}
            size="sm"
            onClick={() => { if (selectionMode) clearSelection(); else setSelectionMode(true); }}
            className={`h-9 gap-1 text-xs border border-[#2a2f3d] ${selectionMode ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "text-white/70 hover:text-white hover:bg-[#1e2330]"}`}
          >
            <MousePointerClick className="h-3.5 w-3.5" />
            {selectionMode ? "Cancelar" : "Selecionar"}
          </Button>

          <Button
            variant={showArchived ? "default" : "ghost"}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={`h-9 gap-1 text-xs border border-[#2a2f3d] ${showArchived ? "bg-amber-600 hover:bg-amber-700 text-white border-amber-600" : "text-white/70 hover:text-white hover:bg-[#1e2330]"}`}
          >
            <Archive className="h-3.5 w-3.5" />
            {showArchived ? "Arquivados" : "Arquivo"}
          </Button>
        </div>
      </div>

      {/* ── Breadcrumb ── */}
      {isDrilledDown && <DrillDownBreadcrumb levels={breadcrumbLevels} onNavigate={handleBreadcrumbNavigate} />}

      {/* ── Main content ── */}
      {activeMicroBoard && !isDrilledDown ? (
        <MicroBoardKanban board={activeMicroBoard} />
      ) : isDrilledDown && drillDown.level === "stage" && drillDown.stageId ? (
        (() => {
          const stageData = byStage.find(s => s.stage.id === drillDown.stageId);
          if (!stageData) return <div className="flex-1 flex items-center justify-center text-gray-500">Etapa não encontrada</div>;
          return <StageDrillDown stageData={stageData} onSelectJob={(job) => drillDownToJob(job)} />;
        })()
      ) : isDrilledDown && drillDown.level === "item" && drillDown.job && drillDown.itemId ? (
        <ItemDrillDown job={drillDown.job} itemId={drillDown.itemId} />
      ) : isDrilledDown && drillDown.level === "job" && drillDown.job ? null
      : isLoading ? (
        <BoardSkeleton count={stageConfigs.length} />
      ) : isError ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-400 font-medium">Erro ao carregar jobs</p>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="mt-2 border-[#2a2f3d] text-gray-300">Tentar novamente</Button>
          </div>
        </div>
      ) : viewMode === "kanban" ? (
        <DragDropContext onDragEnd={onDragEnd}>
          {/* Scroll slider top */}
          <div className="px-6 pb-1.5">
            <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-[#161b26]/60 border border-[#2a2f3d]">
              <span className="text-[10px] text-gray-600 whitespace-nowrap font-medium">◀ ▶</span>
              <input type="range" min={0} max={100} step={0.5} value={scrollPercent}
                onChange={(e) => { const val = Number(e.target.value); setScrollPercent(val); const el = scrollRef.current; if (el) el.scrollLeft = (val / 100) * (el.scrollWidth - el.clientWidth); }}
                className="w-full h-1.5 cursor-pointer rounded-full" style={{ accentColor: "#ef4444" }} />
            </div>
          </div>

          <div className="flex-1 flex items-stretch relative">
            {/* Scroll left */}
            <button onClick={() => scrollKanban("left")}
              className={`flex-shrink-0 w-8 flex items-center justify-center z-20 transition-all duration-300 ${canScrollLeft ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}>
              <div className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 rounded-full p-2 hover:scale-110 transition-transform">
                <ChevronLeft className="h-5 w-5" />
              </div>
            </button>

            <div ref={scrollRef} className="overflow-x-auto flex-1 pb-4 scroll-smooth scrollbar-thin">
              <div className="flex gap-2.5 min-h-[calc(100vh-380px)]">
                {byStage.map(col => (
                  <div key={col.stage.id} className="min-w-[220px] flex-1 max-w-[260px] flex flex-col">
                    {/* Column header */}
                    <div
                      onClick={() => drillDownToStage(col.stage.id)}
                      className="bg-[#161b26] rounded-t-xl p-3 border border-[#2a2f3d] border-b-0 cursor-pointer hover:bg-[#1e2330] transition-colors group"
                      style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}
                    >
                      <div className="flex items-center justify-between">
                        <p className="font-bold text-xs text-gray-200 group-hover:text-gray-100 transition-colors truncate">{col.stage.name}</p>
                        <Badge className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.stage.color }}>
                          {col.jobs.length}
                        </Badge>
                      </div>
                      <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{formatBRL(col.totalValue)}</p>
                    </div>

                    {/* Column body */}
                    <Droppable droppableId={col.stage.id} isDropDisabled={selectionMode}>
                      {(provided, snapshot) => (
                        <div ref={provided.innerRef} {...provided.droppableProps}
                          className={`flex-1 bg-[#0f1318] border border-[#2a2f3d] border-t-0 rounded-b-xl p-1.5 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-emerald-900/20 border-emerald-500/30" : ""}`}>
                          {col.jobs.map((job, idx) => (
                            <Draggable key={job.id} draggableId={job.id} index={idx} isDragDisabled={selectionMode}>
                              {(prov, snap) => (
                                <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                                  <JobCard
                                    job={job}
                                    onClick={() => { if (!selectionMode) drillDownToJob(job); }}
                                    isDragging={snap.isDragging}
                                    visibleFlexfields={visibleFlexfields}
                                    selectionMode={selectionMode}
                                    isSelected={selectedJobIds.has(job.id)}
                                    onToggleSelect={toggleSelectJob}
                                    onArchive={(id) => {
                                      const j = col.jobs.find(j => j.id === id);
                                      if (j) archiveJob.mutate({ job_id: j.id, job_code: j.code, job_title: j.description, customer_name: j.client_name });
                                    }}
                                    onDelete={(id) => deleteJob.mutate(id)}
                                    boardAssignments={boardAssignmentsByJob.get(job.id)}
                                    collabAssignments={collabAssignmentsByJob.get(job.id)}
                                    equipmentAssignments={equipmentByJob.get(job.id)}
                                    etiquetas={etiquetasByJob.get(job.id)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                          {col.jobs.length === 0 && <div className="text-center py-8 text-gray-600 text-xs">Nenhum job</div>}
                        </div>
                      )}
                    </Droppable>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll right */}
            <button onClick={() => scrollKanban("right")}
              className={`flex-shrink-0 w-8 flex items-center justify-center z-20 transition-all duration-300 ${canScrollRight ? "opacity-100 cursor-pointer" : "opacity-0 pointer-events-none"}`}>
              <div className="bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/30 rounded-full p-2 hover:scale-110 transition-transform">
                <ChevronRight className="h-5 w-5" />
              </div>
            </button>
          </div>

          {/* Scroll slider bottom */}
          <div className="px-6 pt-1.5">
            <div className="flex items-center gap-3 px-3 py-1 rounded-lg bg-[#161b26]/60 border border-[#2a2f3d]">
              <span className="text-[10px] text-gray-600 whitespace-nowrap font-medium">◀ ▶</span>
              <input type="range" min={0} max={100} step={0.5} value={scrollPercent}
                onChange={(e) => { const val = Number(e.target.value); setScrollPercent(val); const el = scrollRef.current; if (el) el.scrollLeft = (val / 100) * (el.scrollWidth - el.clientWidth); }}
                className="w-full h-1.5 cursor-pointer rounded-full" style={{ accentColor: "#ef4444" }} />
            </div>
          </div>
        </DragDropContext>
      ) : (
        /* ── List view ── */
        <div className="px-6 pb-4">
          <div className="border border-[#2a2f3d] rounded-xl overflow-hidden bg-[#161b26]">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#1a1f2e] border-b border-[#2a2f3d] text-gray-500 text-xs">
                  {selectionMode && <th className="w-8 p-3"></th>}
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Cliente</th>
                  <th className="text-left p-3">Descrição</th>
                  <th className="text-left p-3">Etapa</th>
                  <th className="text-left p-3">Responsável</th>
                  <th className="text-right p-3">Valor</th>
                  <th className="text-left p-3">Entrega</th>
                  <th className="text-right p-3">%</th>
                  <th className="text-center p-3">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredData?.jobs.map(job => {
                  const stageCfg = byStage.find(s => s.stage.id === job.stage)?.stage;
                  const overdue = job.delivery_date && new Date(job.delivery_date) < new Date();
                  const isArch = archivedIds?.has(job.id);
                  const isSel = selectedJobIds.has(job.id);
                  return (
                    <tr key={job.id} className={`border-b border-[#2a2f3d] cursor-pointer transition-colors hover:bg-[#1e2330] ${overdue ? "bg-red-900/10" : ""} ${isArch ? "opacity-40" : ""} ${isSel ? "bg-emerald-900/20 ring-1 ring-inset ring-emerald-500/30" : ""}`}>
                      {selectionMode && (
                        <td className="p-3">
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center cursor-pointer ${isSel ? "bg-emerald-500 border-emerald-500 text-white" : "border-gray-600"}`}
                            onClick={(e) => toggleSelectJob(job.id, e)}>
                            {isSel && <span className="text-[10px]">✓</span>}
                          </div>
                        </td>
                      )}
                      <td className="p-3 font-mono text-xs text-rose-400 font-bold" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>#{job.code || job.id.substring(0,6)}</td>
                      <td className="p-3 font-medium text-xs text-gray-200" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.client_name}</td>
                      <td className="p-3 text-gray-400 text-xs max-w-[180px] truncate" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.description}</td>
                      <td className="p-3" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>
                        <Badge className="text-[9px] text-white font-bold" style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge>
                      </td>
                      <td className="p-3 text-xs text-gray-400" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.responsible[0]?.name || "—"}</td>
                      <td className="p-3 text-right text-xs font-bold text-emerald-400" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{formatBRL(job.value)}</td>
                      <td className={`p-3 text-xs ${overdue ? "text-red-400 font-semibold" : "text-gray-400"}`} onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>
                        {job.delivery_date ? new Date(job.delivery_date).toLocaleDateString("pt-BR") : "—"}
                      </td>
                      <td className="p-3 text-right text-xs text-gray-300" onClick={() => selectionMode ? toggleSelectJob(job.id, {} as any) : drillDownToJob(job)}>{job.progress_percent}%</td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 hover:bg-amber-500/10"
                          onClick={() => archiveJob.mutate({ job_id: job.id, job_code: job.code, job_title: job.description, customer_name: job.client_name })}>
                          <Archive className="h-3.5 w-3.5 text-gray-500 hover:text-amber-400" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(!filteredData?.jobs || filteredData.jobs.length === 0) && (
              <div className="text-center py-12 text-gray-600">{showArchived ? "Nenhum job arquivado" : "Nenhum job encontrado"}</div>
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
      <div key={i} className="min-w-[220px] flex-1 max-w-[260px] space-y-2">
        <Skeleton className="h-14 w-full rounded-xl bg-[#1e2330]" />
        <Skeleton className="h-28 w-full rounded-xl bg-[#1e2330]" />
        <Skeleton className="h-28 w-full rounded-xl bg-[#1e2330]" />
      </div>
    ))}
  </div>
);

export default JobsKanban;
