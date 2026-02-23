import React, { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import type { Job } from "../types";
import { formatBRL, formatDateBR, isOverdue } from "../types";
import { DEFAULT_STAGES } from "../types";
import { useJobDetail, type ProductionTask } from "@/hooks/useJobDetail";
import {
  useJobItems, useAddJobItem, useToggleJobItem, useDeleteJobItem,
  useJobChecklist, useAddChecklistTask, useToggleChecklist, useDeleteChecklist,
  useJobTimeEntries, useAddTimeEntry,
  useJobMaterials, useAddJobMaterial, useDeleteJobMaterial,
  useJobHistory, useAddComment, logHistory,
  useJobFiles, useUploadJobFile, useDeleteJobFile,
} from "@/hooks/useJobLocalData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { getActiveBoards, type Board } from "@/stores/boardsStore";
import {
  Package, Plus, Trash2, CheckCircle, Clock, MessageSquare,
  Loader2, ChevronDown, ChevronUp, Play, Send, X, Paperclip, FileText, Image, Download, Pause, Square, LayoutGrid, Check,
} from "lucide-react";

interface Props {
  job: Job;
  onStageChange?: (jobId: string, newStage: string) => void;
}

// ─── Tab: Itens ─────────────────────────────────────────
const TabItens: React.FC<Props> = ({ job }) => {
  const jobId = job.id;
  const { data: apiDetail, isLoading: apiLoading } = useJobDetail(job);
  const { data: localItems = [], isLoading: localLoading } = useJobItems(jobId);
  const addItem = useAddJobItem(jobId);
  const toggleItem = useToggleJobItem(jobId);
  const deleteItem = useDeleteJobItem(jobId);

  const [showForm, setShowForm] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", quantity: "1", unit: "un", format: "", unit_value: "", observation: "" });
  const [importing, setImporting] = useState(false);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [boardPopoverOpen, setBoardPopoverOpen] = useState(false);
  const boards = React.useMemo(() => getActiveBoards(), []);

  const toggleSelectItem = (itemId: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const toggleSelectAll = (allIds: string[]) => {
    if (selectedItems.size === allIds.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(allIds));
    }
  };

  const handleAssignToBoard = async (board: Board) => {
    setBoardPopoverOpen(false);
    const selected = allItems.filter(i => selectedItems.has(`${i._source}-${i.id}`));
    const itemNames = selected.map(i => i.name);
    const firstStage = board.stages[0];
    const boardFlexfields = {
      board_id: board.id,
      board_name: board.name,
      board_stage: firstStage?.id || null,
      board_stage_name: firstStage?.name || null,
      assigned_at: new Date().toISOString(),
    };

    // Update existing local items
    const localSelected = selected.filter(i => i._source === "local");
    if (localSelected.length > 0) {
      const ids = localSelected.map(i => i.id);
      const { error } = await supabase
        .from("job_items")
        .update({ flexfields: boardFlexfields })
        .in("id", ids);
      if (error) {
        console.error("[assign-board] local update error:", error);
        toast({ title: "Erro ao atribuir", description: error.message, variant: "destructive" });
        return;
      }
    }

    // Auto-import API items that aren't local yet, with board flexfields
    const apiSelected = selected.filter(i => i._source === "api");
    if (apiSelected.length > 0) {
      for (const ai of apiSelected) {
        const localMatch = localItems.find(li => li.name.toLowerCase().trim() === ai.name.toLowerCase().trim());
        if (localMatch) {
          // Update existing local item's flexfields
          await supabase.from("job_items").update({ flexfields: boardFlexfields }).eq("id", localMatch.id);
        } else {
          // Import as new local item with board flexfields
          await new Promise<void>((resolve) => {
            addItem.mutate(
              {
                name: ai.name, quantity: ai.quantity || 1, unit: ai.unit || "un", format: null,
                unit_value: ai.unitPrice || 0, total_value: ai.subtotal || (ai.unitPrice || 0) * (ai.quantity || 1),
                checked: false, observation: ai.description || null, flexfields: boardFlexfields,
              },
              { onSuccess: () => resolve(), onError: () => resolve() }
            );
          });
        }
      }
    }

    // Log to job history for notification/audit trail
    await logHistory(
      jobId,
      "items_assigned_to_board",
      `${itemNames.length} item(ns) atribuído(s) à board "${board.name}" → ${firstStage?.name || "primeira etapa"}`,
      {
        board_id: board.id,
        board_name: board.name,
        stage: firstStage?.id || "",
        item_names: itemNames.join(", "),
        item_count: String(itemNames.length),
      }
    );

    toast({
      title: `✅ Itens atribuídos: ${board.name}`,
      description: `${itemNames.length} ite${itemNames.length === 1 ? "m" : "ns"} → ${firstStage?.name || "primeira etapa"}`,
    });
    setSelectedItems(new Set());
  };

  // Merge: API items (read-only) + local items (CRUD)
  const apiItems = apiDetail?.items || [];
  type MergedItem = { id: string; name: string; quantity: number; unit: string; subtotal: number; checked: boolean; description: string; format?: string; unitPrice?: number; materials: any[]; _source: "api" | "local"; flexfields?: Record<string, unknown> };
  const allItems: MergedItem[] = [
    ...apiItems.map(ai => ({ id: ai.id, _source: "api" as const, checked: false, name: ai.name, quantity: ai.quantity || 1, unit: ai.unit || "un", subtotal: ai.subtotal || 0, unitPrice: ai.unitPrice || 0, description: ai.description || "", materials: ai.materials || [] })),
    ...localItems.map(li => ({ id: li.id, _source: "local" as const, name: li.name, quantity: li.quantity, unit: li.unit, subtotal: li.total_value, checked: li.checked, description: li.observation || "", format: li.format || undefined, materials: [], flexfields: li.flexfields })),
  ];

  const checkedCount = allItems.filter(i => i.checked).length;
  const totalValue = allItems.reduce((s, i) => s + (i.subtotal || 0), 0);

  // Check which API items are already imported (by name match)
  const localNames = new Set(localItems.map(li => li.name.toLowerCase().trim()));
  const importableItems = apiItems.filter(ai => !localNames.has(ai.name.toLowerCase().trim()));

  const handleImportAll = async () => {
    if (importableItems.length === 0) return;
    setImporting(true);
    for (const ai of importableItems) {
      const uv = ai.unitPrice || 0;
      const qty = ai.quantity || 1;
      await new Promise<void>((resolve, reject) => {
        addItem.mutate(
          { name: ai.name, quantity: qty, unit: ai.unit || "un", format: null, unit_value: uv, total_value: ai.subtotal || uv * qty, checked: false, observation: ai.description || null },
          { onSuccess: () => resolve(), onError: () => resolve() }
        );
      });
    }
    setImporting(false);
  };

  const handleAdd = () => {
    const uv = parseFloat(form.unit_value) || 0;
    const qty = parseFloat(form.quantity) || 1;
    addItem.mutate({
      name: form.name, quantity: qty, unit: form.unit, format: form.format || null,
      unit_value: uv, total_value: uv * qty, checked: false, observation: form.observation || null,
    });
    setForm({ name: "", quantity: "1", unit: "un", format: "", unit_value: "", observation: "" });
    setShowForm(false);
  };

  if (apiLoading || localLoading) return <LoadingSkeleton />;

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
            <Plus className="h-3.5 w-3.5" /> Adicionar Item
          </Button>
          <Button
            size="sm"
            variant="default"
            className="gap-1.5 text-xs"
            onClick={handleImportAll}
            disabled={importing || importableItems.length === 0}
          >
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
            {apiLoading ? "Carregando ERP..." : importableItems.length > 0 ? `Importar do ERP (${importableItems.length})` : apiItems.length > 0 ? "Já importados" : "Importar Itens"}
          </Button>
        </div>
        <span className="text-xs text-muted-foreground">
          Total: {allItems.length} itens | {formatBRL(totalValue)}
        </span>
      </div>

      {/* Selection bar */}
      {selectedItems.size > 0 && (
        <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/10 border border-primary/20">
          <span className="text-xs font-medium text-primary">{selectedItems.size} selecionado{selectedItems.size > 1 ? "s" : ""}</span>
          <Popover open={boardPopoverOpen} onOpenChange={setBoardPopoverOpen}>
            <PopoverTrigger asChild>
              <Button size="sm" className="gap-1.5 text-xs h-7 ml-auto">
                <LayoutGrid className="h-3.5 w-3.5" />
                Atribuir a Board
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56 p-1" align="end">
              <p className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Selecionar Board</p>
              {boards.map(b => (
                <button
                  key={b.id}
                  onClick={() => handleAssignToBoard(b)}
                  className="flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded-sm hover:bg-accent text-left"
                >
                  <span className="h-3 w-3 rounded-sm flex-shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="flex-1">{b.name}</span>
                </button>
              ))}
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setSelectedItems(new Set())}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Nome do item *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Banner Lona 440g" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantidade *</label>
              <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Unidade</label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["un", "m²", "ml", "kg", "folha", "rolo"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Formato</label>
              <Input value={form.format} onChange={e => setForm(f => ({ ...f, format: e.target.value }))} placeholder="Ex: 3x1m" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Valor unitário (R$)</label>
              <Input type="number" step="0.01" value={form.unit_value} onChange={e => setForm(f => ({ ...f, unit_value: e.target.value }))} className="mt-1" />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Observação</label>
              <Input value={form.observation} onChange={e => setForm(f => ({ ...f, observation: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={!form.name.trim() || addItem.isPending} className="bg-primary text-primary-foreground">
              {addItem.isPending ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}Salvar
            </Button>
          </div>
        </div>
      )}

      {allItems.map((item, idx) => {
        const itemKey = `${item._source}-${item.id}`;
        const isSelected = selectedItems.has(itemKey);
        return (
        <div key={itemKey} className={`border rounded-lg overflow-hidden ${item.checked ? "opacity-60" : ""} ${isSelected ? "ring-2 ring-primary/50" : ""}`}>
          <div
            className="flex items-center justify-between p-3 bg-muted/30 cursor-pointer hover:bg-muted/50"
            onClick={() => setExpandedItem(expandedItem === item.id ? null : item.id)}
          >
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={() => toggleSelectItem(itemKey)}
                onClick={e => e.stopPropagation()}
                className="border-muted-foreground/40"
              />
              {item._source === "local" && (
                <Checkbox
                  checked={item.checked}
                  onCheckedChange={(c) => { toggleItem.mutate({ itemId: item.id, checked: !!c }); }}
                  onClick={e => e.stopPropagation()}
                />
              )}
              <span className={`font-semibold text-sm ${item.checked ? "line-through" : ""}`}>
                {idx + 1}. {item.name}
              </span>
              {item._source === "api" && <Badge variant="outline" className="text-[9px] ml-1">API</Badge>}
              {item.flexfields?.board_name && (
                <Badge className="text-[9px] ml-1 text-white" style={{ backgroundColor: boards.find(b => b.id === item.flexfields?.board_id)?.color || "hsl(var(--primary))" }}>
                  {String(item.flexfields.board_name)}
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>Qtd: <strong>{item.quantity}</strong></span>
              {item.format && <span>Formato: <strong>{item.format}</strong></span>}
              <span>{formatBRL(item.subtotal || 0)}</span>
              {item._source === "local" && (
                <button onClick={e => { e.stopPropagation(); deleteItem.mutate(item.id); }} className="text-destructive hover:text-destructive/80">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
              {expandedItem === item.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </div>
          </div>
          {expandedItem === item.id && (
            <div className="p-3 border-t text-sm space-y-2">
              {item.description && <p className="text-muted-foreground">{item.description}</p>}
              {item.materials && item.materials.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground mb-1">MATÉRIA PRIMA</p>
                  {item.materials.map((mat: any, mi: number) => (
                    <div key={mi} className="flex items-center gap-2 text-xs py-1">
                      <span className="font-medium">{mat.name}</span>
                      {mat.attributes && Object.entries(mat.attributes).map(([k, v]) => (
                        <Badge key={k} variant="outline" className="text-[9px] px-1">{k}: {String(v)}</Badge>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        );
      })}

      {allItems.length === 0 && <EmptyState icon={<Package />} message="Nenhum item encontrado" sub="Adicione itens manualmente ou os dados serão carregados da API" />}

      {checkedCount > 0 && (
        <div className="text-xs text-muted-foreground text-center">
          Progresso: {checkedCount}/{allItems.length} itens concluídos ({Math.round((checkedCount / allItems.length) * 100)}%)
        </div>
      )}
    </div>
  );
};

// ─── Tab: Produção ──────────────────────────────────────
const TabProducao: React.FC<Props & { onStageChange?: (jobId: string, newStage: string) => void }> = ({ job, onStageChange }) => {
  const { data: detail, isLoading } = useJobDetail(job);
  const { data: checklist = [] } = useJobChecklist(job.id);
  const addTask = useAddChecklistTask(job.id);
  const toggleTask = useToggleChecklist(job.id);
  const deleteTask = useDeleteChecklist(job.id);
  const { data: timeEntries = [] } = useJobTimeEntries(job.id);
  const addTime = useAddTimeEntry(job.id);

  const [moveTarget, setMoveTarget] = useState<string | null>(null);
  const [movingStage, setMovingStage] = useState(false);
  const [newTask, setNewTask] = useState("");
  const [showTimeForm, setShowTimeForm] = useState(false);
  const [timeForm, setTimeForm] = useState({ user_name: "", description: "", minutes: "", entry_date: new Date().toISOString().split("T")[0] });

  // ── Stopwatch state ──
  const [swRunning, setSwRunning] = useState(false);
  const [swElapsed, setSwElapsed] = useState(0); // seconds
  const [swUser, setSwUser] = useState("");
  const [swDesc, setSwDesc] = useState("");
  const swIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (swRunning) {
      swIntervalRef.current = setInterval(() => setSwElapsed(p => p + 1), 1000);
    } else if (swIntervalRef.current) {
      clearInterval(swIntervalRef.current);
      swIntervalRef.current = null;
    }
    return () => { if (swIntervalRef.current) clearInterval(swIntervalRef.current); };
  }, [swRunning]);

  const handleSwStop = useCallback(() => {
    setSwRunning(false);
    const mins = Math.max(1, Math.round(swElapsed / 60));
    if (swUser.trim()) {
      addTime.mutate({
        user_name: swUser.trim(),
        description: swDesc.trim() || "Cronômetro",
        minutes: mins,
        entry_date: new Date().toISOString().split("T")[0],
      });
    }
    setSwElapsed(0);
    setSwUser("");
    setSwDesc("");
  }, [swElapsed, swUser, swDesc, addTime]);

  const formatStopwatch = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const stageCfg = DEFAULT_STAGES.find(s => s.id === job.stage);
  const tasks = detail?.productionTasks || [];
  const progress = detail?.productionProgress ?? job.progress_percent;
  const totalMinutes = timeEntries.reduce((s, t) => s + t.minutes, 0);

  const handleMoveStage = async () => {
    if (!moveTarget) return;
    setMovingStage(true);
    try {
      // Persist via Holdprint API
      const unitKey = job._unit_key || "poa";
      const { data: apiResult, error: apiError } = await supabase.functions.invoke("holdprint-erp", {
        body: {
          endpoint: `/api-key/jobs/${job.id}/production-step`,
          method: "PUT",
          payload: { stepName: moveTarget, status: "Started" },
          unidade: unitKey,
        },
      });

      if (apiError) {
        console.warn("[stage-change] API error, falling back to local:", apiError.message);
      }

      // Update local UI via callback
      if (onStageChange) {
        onStageChange(job.id, moveTarget);
      }

      // Log to history
      await logHistory(job.id, "stage_changed", `Etapa alterada para ${DEFAULT_STAGES.find(s => s.id === moveTarget)?.name || moveTarget}`, {
        from_stage: job.stage,
        to_stage: moveTarget,
        api_synced: apiError ? "false" : "true",
      });

      toast({
        title: "Etapa atualizada",
        description: apiError
          ? "Salvo localmente (erro ao sincronizar com ERP)"
          : `Job movido para ${DEFAULT_STAGES.find(s => s.id === moveTarget)?.name || moveTarget}`,
      });
    } catch (err: any) {
      console.error("[stage-change] Error:", err);
      // Still update locally even if API fails
      if (onStageChange) onStageChange(job.id, moveTarget);
      await logHistory(job.id, "stage_changed", `Etapa alterada (offline)`, {
        from_stage: job.stage,
        to_stage: moveTarget,
        api_synced: "false",
      });
      toast({ title: "Etapa atualizada localmente", description: "Não foi possível sincronizar com o ERP" });
    } finally {
      setMovingStage(false);
      setMoveTarget(null);
    }
  };

  if (isLoading) return <LoadingSkeleton />;

  return (
    <div className="p-5 space-y-5">
      {/* Status */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Etapa Atual:</span>
          <Badge className="text-white" style={{ backgroundColor: stageCfg?.color }}>{stageCfg?.name}</Badge>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-muted-foreground">Progresso:</span>
          <Progress value={progress} className="flex-1 h-3" />
          <span className="font-bold text-sm">{progress}%</span>
        </div>
      </div>

      {/* Pipeline */}
      <div className="border rounded-lg p-4">
        <p className="text-sm font-semibold mb-3">Fluxo de Produção</p>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {(tasks.length > 0 ? tasks : DEFAULT_STAGES).map((step: any, i: number, arr: any[]) => {
            const isTask = 'productionStatus' in step;
            const isFinalized = isTask ? step.productionStatus === "Finalized" : step.order < (stageCfg?.order || 0);
            const isCurrent = isTask ? (step.productionStatus === "Started" || step.productionStatus === "Ready") && i > 0 && arr[i - 1]?.productionStatus === "Finalized" : step.id === job.stage;
            const stageId = isTask ? step.name : step.id;
            const stageName = isTask ? step.name : step.name;
            const stageColor = isTask ? (isCurrent ? stageCfg?.color : undefined) : step.color;

            return (
              <div key={i} className="flex items-center gap-1">
                <button
                  onClick={() => {
                    if (!isFinalized && !isCurrent) setMoveTarget(stageId);
                  }}
                  disabled={isFinalized || isCurrent || movingStage}
                  className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-all ${
                    isCurrent ? "text-white shadow-md" : isFinalized ? "bg-muted text-muted-foreground" : "bg-muted/50 text-muted-foreground/60 hover:bg-muted"
                  }`}
                  style={isCurrent ? { backgroundColor: stageColor || "#6366F1" } : undefined}
                >
                  {isFinalized && <CheckCircle className="h-3 w-3 inline mr-1 text-green-600" />}
                  {stageName}
                  {isTask && step.duration > 0 && <span className="ml-1 opacity-60">({step.duration}min)</span>}
                </button>
                {i < arr.length - 1 && <span className="text-muted-foreground/40">→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Time */}
      <div className="border rounded-lg p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Tempo Registrado</h4>
          <span className="text-sm font-bold flex items-center gap-1"><Clock className="h-4 w-4" /> {formatMins(totalMinutes + (swRunning ? Math.round(swElapsed / 60) : 0))}</span>
        </div>

        {/* Stopwatch */}
        <div className={`rounded-lg p-3 space-y-2 ${swRunning ? "bg-primary/10 border border-primary/30" : "bg-muted/30 border border-border"}`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">⏱ Cronômetro</span>
            <span className={`font-mono text-lg font-bold tabular-nums ${swRunning ? "text-primary" : "text-foreground"}`}>
              {formatStopwatch(swElapsed)}
            </span>
          </div>

          {!swRunning && swElapsed === 0 && (
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Responsável *" value={swUser} onChange={e => setSwUser(e.target.value)} className="h-8 text-xs" />
              <Input placeholder="Descrição" value={swDesc} onChange={e => setSwDesc(e.target.value)} className="h-8 text-xs" />
            </div>
          )}

          <div className="flex gap-2">
            {!swRunning && swElapsed === 0 && (
              <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground" onClick={() => { if (swUser.trim()) setSwRunning(true); }} disabled={!swUser.trim()}>
                <Play className="h-3.5 w-3.5" /> Iniciar
              </Button>
            )}
            {swRunning && (
              <>
                <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setSwRunning(false)}>
                  <Pause className="h-3.5 w-3.5" /> Pausar
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleSwStop}>
                  <Square className="h-3 w-3" /> Parar e Salvar
                </Button>
              </>
            )}
            {!swRunning && swElapsed > 0 && (
              <>
                <Button size="sm" className="gap-1.5 text-xs bg-primary text-primary-foreground" onClick={() => setSwRunning(true)}>
                  <Play className="h-3.5 w-3.5" /> Retomar
                </Button>
                <Button size="sm" variant="destructive" className="gap-1.5 text-xs" onClick={handleSwStop}>
                  <Square className="h-3 w-3" /> Parar e Salvar ({Math.max(1, Math.round(swElapsed / 60))}min)
                </Button>
                <Button size="sm" variant="ghost" className="text-xs" onClick={() => { setSwElapsed(0); setSwRunning(false); }}>
                  <X className="h-3 w-3" /> Descartar
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Manual entry */}
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="gap-1 text-xs" onClick={() => setShowTimeForm(!showTimeForm)}>
            <Plus className="h-3 w-3" /> Lançar Tempo Manual
          </Button>
        </div>
        {showTimeForm && (
          <div className="grid grid-cols-2 gap-2 pt-2">
            <Input placeholder="Responsável" value={timeForm.user_name} onChange={e => setTimeForm(f => ({ ...f, user_name: e.target.value }))} />
            <Input placeholder="Descrição" value={timeForm.description} onChange={e => setTimeForm(f => ({ ...f, description: e.target.value }))} />
            <Input type="number" placeholder="Minutos" value={timeForm.minutes} onChange={e => setTimeForm(f => ({ ...f, minutes: e.target.value }))} />
            <Input type="date" value={timeForm.entry_date} onChange={e => setTimeForm(f => ({ ...f, entry_date: e.target.value }))} />
            <div className="col-span-2 flex gap-2 justify-end">
              <Button size="sm" variant="ghost" onClick={() => setShowTimeForm(false)}>Cancelar</Button>
              <Button size="sm" className="bg-primary text-primary-foreground" onClick={() => {
                addTime.mutate({ user_name: timeForm.user_name, description: timeForm.description, minutes: parseInt(timeForm.minutes) || 0, entry_date: timeForm.entry_date });
                setTimeForm({ user_name: "", description: "", minutes: "", entry_date: new Date().toISOString().split("T")[0] });
                setShowTimeForm(false);
              }} disabled={!timeForm.user_name || !timeForm.minutes}>Salvar</Button>
            </div>
          </div>
        )}
        {timeEntries.length > 0 && (
          <div className="space-y-1 pt-1">
            {timeEntries.map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs py-1 border-b border-border/50 last:border-0">
                <span>{t.entry_date} — {t.user_name} — {t.description || "Sem descrição"}</span>
                <span className="font-medium">{formatMins(t.minutes)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Checklist */}
      <div className="border rounded-lg p-4 space-y-2">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Checklist de Produção</h4>
          <span className="text-xs text-muted-foreground">{checklist.filter(c => c.checked).length}/{checklist.length}</span>
        </div>
        {checklist.map(task => (
          <div key={task.id} className="flex items-center gap-2 py-1">
            <Checkbox checked={task.checked} onCheckedChange={c => toggleTask.mutate({ taskId: task.id, checked: !!c })} />
            <span className={`text-sm flex-1 ${task.checked ? "line-through text-muted-foreground" : ""}`}>{task.title}</span>
            {task.responsible_name && <span className="text-xs text-muted-foreground">{task.responsible_name}</span>}
            <button onClick={() => deleteTask.mutate(task.id)} className="text-destructive/60 hover:text-destructive"><Trash2 className="h-3 w-3" /></button>
          </div>
        ))}
        <div className="flex gap-2 pt-1">
          <Input placeholder="Nova tarefa..." value={newTask} onChange={e => setNewTask(e.target.value)} className="h-8 text-sm"
            onKeyDown={e => { if (e.key === "Enter" && newTask.trim()) { addTask.mutate(newTask.trim()); setNewTask(""); } }} />
          <Button size="sm" variant="outline" className="h-8" onClick={() => { if (newTask.trim()) { addTask.mutate(newTask.trim()); setNewTask(""); } }}>
            <Plus className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Move stage dialog */}
      <AlertDialog open={!!moveTarget} onOpenChange={(open) => { if (!open && !movingStage) setMoveTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Alterar etapa de produção?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium">{stageCfg?.name || job.stage}</span> → <span className="font-medium">{DEFAULT_STAGES.find(s => s.id === moveTarget)?.name || moveTarget}</span>
              <br />
              <span className="text-xs mt-1 block">A mudança será sincronizada com o ERP Holdprint.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={movingStage}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleMoveStage} disabled={movingStage}>
              {movingStage ? <><Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Salvando...</> : "Confirmar →"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// ─── Tab: Matéria Prima ─────────────────────────────────
const TabMateriais: React.FC<Props> = ({ job }) => {
  const { data: apiDetail, isLoading: apiLoading } = useJobDetail(job);
  const { data: localMats = [], isLoading: localLoading } = useJobMaterials(job.id);
  const addMat = useAddJobMaterial(job.id);
  const deleteMat = useDeleteJobMaterial(job.id);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", quantity: "", unit: "m²", unit_cost: "", supplier: "", observation: "" });

  const apiMats = apiDetail?.materials || [];
  const allMats = [
    ...apiMats.map((m, i) => ({ id: `api-${i}`, _source: "api" as const, name: m.name, quantity: 0, unit: "", unit_cost: 0, total_cost: 0, supplier: null, observation: null, attributes: m.attributes, process: m.process })),
    ...localMats.map(m => ({ ...m, _source: "local" as const, attributes: undefined, process: undefined })),
  ];

  const totalCost = localMats.reduce((s, m) => s + m.total_cost, 0);

  const handleAdd = () => {
    const qty = parseFloat(form.quantity) || 0;
    const uc = parseFloat(form.unit_cost) || 0;
    addMat.mutate({
      name: form.name, quantity: qty, unit: form.unit, unit_cost: uc,
      total_cost: qty * uc, supplier: form.supplier || null, observation: form.observation || null,
    });
    setForm({ name: "", quantity: "", unit: "m²", unit_cost: "", supplier: "", observation: "" });
    setShowForm(false);
  };

  if (apiLoading || localLoading) return <LoadingSkeleton />;

  return (
    <div className="p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-3.5 w-3.5" /> Adicionar
        </Button>
        <span className="text-xs text-muted-foreground">
          {allMats.length} materiais | Custo local: {formatBRL(totalCost)}
        </span>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium text-muted-foreground">Material *</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Lona 440g" className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Quantidade *</label>
              <Input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Unidade</label>
              <Select value={form.unit} onValueChange={v => setForm(f => ({ ...f, unit: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["m²", "ml", "kg", "un", "folha", "rolo"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Custo unitário (R$)</label>
              <Input type="number" step="0.01" value={form.unit_cost} onChange={e => setForm(f => ({ ...f, unit_cost: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Fornecedor</label>
              <Input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} className="mt-1" />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <Button size="sm" variant="ghost" onClick={() => setShowForm(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={!form.name.trim()} className="bg-primary text-primary-foreground">Salvar</Button>
          </div>
        </div>
      )}

      {allMats.length > 0 ? (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-muted-foreground text-xs bg-muted/50">
                <th className="text-left p-3">Material</th>
                <th className="text-right p-3">Qtd</th>
                <th className="text-left p-3">Unid.</th>
                <th className="text-right p-3">Custo</th>
                <th className="text-left p-3">Info</th>
                <th className="text-right p-3 w-12"></th>
              </tr>
            </thead>
            <tbody>
              {allMats.map(mat => (
                <tr key={mat.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="p-3">
                    <span className="font-medium">{mat.name}</span>
                    {mat._source === "api" && <Badge variant="outline" className="text-[9px] ml-1">API</Badge>}
                  </td>
                  <td className="p-3 text-right">{mat.quantity || "—"}</td>
                  <td className="p-3">{mat.unit || "—"}</td>
                  <td className="p-3 text-right font-medium">{mat.total_cost ? formatBRL(mat.total_cost) : "—"}</td>
                  <td className="p-3 text-xs text-muted-foreground">
                    {mat.supplier || mat.process || ""}
                    {mat.attributes && (
                      <div className="flex gap-1 flex-wrap mt-0.5">
                        {Object.entries(mat.attributes).map(([k, v]) => (
                          <Badge key={k} variant="outline" className="text-[9px] px-1">{k}: {String(v)}</Badge>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    {mat._source === "local" && (
                      <button onClick={() => deleteMat.mutate(mat.id)} className="text-destructive/60 hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState icon={<Package />} message="Nenhuma matéria prima" sub="Adicione manualmente ou aguarde dados da API" />
      )}
    </div>
  );
};

// ─── Tab: Histórico ─────────────────────────────────────
const TabHistorico: React.FC<Props> = ({ job }) => {
  const { data: apiDetail } = useJobDetail(job);
  const { data: localHistory = [] } = useJobHistory(job.id, true);
  const { data: files = [] } = useJobFiles(job.id);
  const addComment = useAddComment(job.id);
  const uploadFile = useUploadJobFile(job.id);
  const deleteFile = useDeleteJobFile(job.id);
  const [comment, setComment] = useState("");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Merge API production events + local history
  const apiEvents = (apiDetail?.comments || []).map(c => ({
    id: `api-${c.id}`,
    event_type: c.content?.startsWith("✅") ? "stage_finalized" : "stage_event",
    user_name: c.user,
    content: c.content,
    created_at: c.timestamp,
    _source: "api" as const,
  }));

  const allEvents = [
    ...localHistory.map(h => ({ ...h, _source: "local" as const })),
    ...apiEvents,
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const handleComment = () => {
    if (!comment.trim()) return;
    addComment.mutate({ content: comment.trim(), userName: "Usuário" });
    setComment("");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles) return;
    Array.from(selectedFiles).forEach(file => uploadFile.mutate(file));
    e.target.value = "";
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/")) return <Image className="h-4 w-4 text-primary" />;
    return <FileText className="h-4 w-4 text-primary" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const eventIcon = (type: string) => {
    switch (type) {
      case "comment": return "💬";
      case "stage_changed": return "🔄";
      case "job_edited": return "✏️";
      case "item_checked": return "✅";
      case "time_logged": return "⏱";
      case "file_uploaded": return "📎";
      case "stage_finalized": return "✅";
      case "stage_event": return "📋";
      default: return "➕";
    }
  };

  return (
    <div className="p-5 space-y-4 flex flex-col h-full">
      <p className="text-xs text-muted-foreground font-medium">{allEvents.length} eventos</p>

      {/* Files section */}
      {files.length > 0 && (
        <div className="border rounded-lg p-3 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">📎 Arquivos ({files.length})</p>
          <div className="space-y-1.5">
            {files.map(f => (
              <div key={f.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/30 hover:bg-muted/50 group">
                {getFileIcon(f.file_type)}
                <div className="flex-1 min-w-0">
                  <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium truncate block hover:underline text-foreground">
                    {f.file_name}
                  </a>
                  <span className="text-[10px] text-muted-foreground">
                    {formatFileSize(f.file_size)} · {f.uploaded_by} · {formatDateBR(f.created_at)}
                  </span>
                </div>
                <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground">
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  onClick={() => deleteFile.mutate({ fileId: f.id, filePath: f.file_url })}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Events feed */}
      <div className="flex-1 space-y-3 overflow-y-auto">
        {allEvents.length > 0 ? allEvents.map(evt => (
          <div key={evt.id} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center text-sm flex-shrink-0">
              {eventIcon(evt.event_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{evt.user_name}</span>{" "}
                <span className="text-muted-foreground text-xs">{formatDateBR(evt.created_at)}</span>
                {evt._source === "api" && <Badge variant="outline" className="text-[9px] ml-1">API</Badge>}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">{evt.content || renderMetadata(evt.event_type, (evt as any).metadata)}</p>
            </div>
          </div>
        )) : (
          <EmptyState icon={<MessageSquare />} message="Nenhum evento" sub="Adicione um comentário ou envie um arquivo para iniciar o histórico" />
        )}
      </div>

      {/* Comment + file upload input */}
      <div className="flex gap-2 border-t pt-3">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
        <Button
          size="icon"
          variant="outline"
          className="h-10 w-10 flex-shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadFile.isPending}
          title="Anexar arquivo"
        >
          {uploadFile.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
        </Button>
        <Input
          placeholder="Adicionar comentário..."
          value={comment}
          onChange={e => setComment(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter") handleComment(); }}
          className="flex-1"
        />
        <Button size="sm" onClick={handleComment} disabled={!comment.trim() || addComment.isPending} className="bg-primary text-primary-foreground">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};

// ─── Tab: Informações Gerais ────────────────────────────
const TabInfo: React.FC<Props> = ({ job }) => {
  const { data: detail } = useJobDetail(job);
  const stageCfg = DEFAULT_STAGES.find(s => s.id === job.stage);

  return (
    <div className="p-5">
      <div className="grid grid-cols-2 gap-4">
        <InfoRow label="Cliente" value={job.client_name} />
        <InfoRow label="ID do Job" value={`J${job.code || job.id}`} />
        <InfoRow label="Título / Descrição" value={job.description} />
        <InfoRow label="Tipo de Produção" value={job.production_type} />
        <InfoRow label="Responsável(is)" value={job.responsible.map(r => r.name).join(", ") || "Não atribuído"} />
        <InfoRow label="Status" value={job.status === "aberto" ? "Aberto" : job.status === "fechado" ? "Fechado" : "Cancelado"} />
        <InfoRow label="Data de Criação" value={formatDateBR(job.created_at)} />
        <InfoRow label="Necessidade de Entrega" value={formatDateBR(job.delivery_date)} highlight={isOverdue(job.delivery_date)} />
        <InfoRow label="Valor Total" value={formatBRL(job.value)} />
        <InfoRow label="Urgente" value={job.urgent ? "Sim" : "Não"} />
        {job._unit_key && <InfoRow label="Unidade" value={job._unit_key.toUpperCase()} />}
        <InfoRow label="Etapa Atual" value={stageCfg?.name || job.stage} />
        {detail?.productionStartDate && <InfoRow label="Início Produção" value={formatDateBR(detail.productionStartDate)} />}
        {detail?.productionEndDate && <InfoRow label="Fim Produção" value={formatDateBR(detail.productionEndDate)} />}
      </div>
    </div>
  );
};

// ─── Helpers ────────────────────────────────────────────
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="py-2 border-b border-border">
      <p className="text-xs font-semibold text-muted-foreground">{label}</p>
      <p className={`text-sm ${highlight ? "text-destructive font-semibold" : "text-foreground"}`}>{value || "—"}</p>
    </div>
  );
}

function EmptyState({ icon, message, sub }: { icon: React.ReactNode; message: string; sub?: string }) {
  return (
    <div className="text-center py-12 text-muted-foreground">
      <div className="mx-auto mb-2 opacity-50 w-fit [&>svg]:h-10 [&>svg]:w-10">{icon}</div>
      <p className="text-sm">{message}</p>
      {sub && <p className="text-xs mt-1">{sub}</p>}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-5 space-y-3">
      {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}
    </div>
  );
}

function formatMins(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}min`;
}

function renderMetadata(type: string, metadata: Record<string, string> | null): string {
  if (!metadata) return "";
  if (type === "stage_changed") return `Moveu: ${metadata.from_stage || "?"} → ${metadata.to_stage || "?"}`;
  if (type === "job_edited") return `Editou: ${metadata.field_label || metadata.field} (${metadata.old_value} → ${metadata.new_value})`;
  return JSON.stringify(metadata);
}

export { TabItens, TabInfo, TabProducao, TabMateriais, TabHistorico };
