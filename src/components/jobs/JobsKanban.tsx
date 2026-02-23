import React, { useState, useCallback, useMemo } from "react";
import { useJobsData } from "./useJobsData";
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
  Calendar, Settings2,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const JobsKanban: React.FC = () => {
  const boards = useMemo(() => getActiveBoards(), []);
  const [activeBoardId, setActiveBoardId] = useState(boards[0]?.id || "");
  const activeBoard = useMemo(() => boards.find(b => b.id === activeBoardId) || boards[0] || null, [boards, activeBoardId]);

  const visibleFlexfields = useMemo(
    () => activeBoard?.flexfields.filter(f => f.show_on_card) || [],
    [activeBoard]
  );

  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("aberto");
  const [productionType, setProductionType] = useState("todos");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const now = new Date();
  const dateFrom = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;

  const filters: JobsFilters = { search, status: status as JobsFilters["status"], productionType, dateFrom, dateTo: "" };
  const { data, isLoading, isFetching, refetch, isError } = useJobsData(filters, activeBoard);

  const [localByStage, setLocalByStage] = useState<JobsByStage[] | null>(null);
  const byStage = localByStage || data?.byStage || [];

  React.useEffect(() => { if (data?.byStage) setLocalByStage(null); }, [data?.byStage]);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination } = result;
    if (!destination || !data) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const srcStage = source.droppableId;
    const dstStage = destination.droppableId;
    const dstStageName = byStage.find(c => c.stage.id === dstStage)?.stage.name || dstStage;

    setLocalByStage(prev => {
      const current = prev || data.byStage;
      const next = current.map(col => ({ ...col, jobs: [...col.jobs] }));
      const srcCol = next.find(c => c.stage.id === srcStage);
      const dstCol = next.find(c => c.stage.id === dstStage);
      if (!srcCol || !dstCol) return prev;

      const [moved] = srcCol.jobs.splice(source.index, 1);
      moved.stage = dstStage as Job["stage"];
      dstCol.jobs.splice(destination.index, 0, moved);
      srcCol.totalValue = srcCol.jobs.reduce((s, j) => s + j.value, 0);
      dstCol.totalValue = dstCol.jobs.reduce((s, j) => s + j.value, 0);
      return next;
    });

    toast({ title: "Job movido", description: `Job movido para ${dstStageName}` });
  }, [data, byStage]);

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
          <div className="flex-1 overflow-x-auto px-6 pb-4">
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
                {data?.jobs.map(job => {
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
            {(!data?.jobs || data.jobs.length === 0) && (
              <div className="text-center py-12 text-[#6b7280]">Nenhum job encontrado</div>
            )}
          </div>
        </div>
      )}

      <JobDetailDrawer job={selectedJob} open={!!selectedJob} onOpenChange={o => { if (!o) setSelectedJob(null); }} />
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
