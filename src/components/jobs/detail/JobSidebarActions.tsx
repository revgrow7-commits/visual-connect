import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import type { Job } from "../types";
import { formatDateBR } from "../types";
import { useJobExtension, useUpsertJobExtension } from "@/hooks/useJobExtensions";
import { useJobChecklist, useAddChecklistTask, useToggleChecklist, useDeleteChecklist } from "@/hooks/useJobLocalData";
import { useJobFiles, useUploadJobFile, useDeleteJobFile } from "@/hooks/useJobLocalData";
import { useJobLinks, useAddJobLink, useDeleteJobLink } from "@/hooks/useJobLinks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Tag, CalendarDays, ListChecks, Users, Paperclip, SlidersHorizontal,
  Plus, X, Trash2, Loader2, FileText, Image as ImageIcon, Link2, ExternalLink, CalendarIcon,
} from "lucide-react";

interface Props {
  job: Job;
}

const LABEL_COLORS = [
  { name: "Verde", color: "#22c55e" },
  { name: "Amarelo", color: "#eab308" },
  { name: "Laranja", color: "#f97316" },
  { name: "Vermelho", color: "#ef4444" },
  { name: "Roxo", color: "#8b5cf6" },
  { name: "Azul", color: "#3b82f6" },
];

const LEMBRETE_OPTIONS = [
  { value: "nenhum", label: "Nenhum" },
  { value: "no_momento", label: "No momento do vencimento" },
  { value: "5min", label: "5 minutos antes" },
  { value: "10min", label: "10 minutos antes" },
  { value: "15min", label: "15 minutos antes" },
  { value: "1h", label: "1 hora antes" },
  { value: "2h", label: "2 horas antes" },
  { value: "1d", label: "1 dia antes" },
  { value: "2d", label: "2 dias antes" },
];

const RECORRENTE_OPTIONS = [
  { value: "nunca", label: "Nunca" },
  { value: "diario", label: "Diariamente" },
  { value: "semanal", label: "Semanalmente" },
  { value: "mensal", label: "Mensalmente" },
  { value: "anual", label: "Anualmente" },
];

const JobSidebarActions: React.FC<Props> = ({ job }) => {
  const jobId = job.id;

  // Extension data
  const { data: ext } = useJobExtension(jobId);
  const upsert = useUpsertJobExtension(jobId);

  // Checklist
  const { data: checklist = [] } = useJobChecklist(jobId);
  const addTask = useAddChecklistTask(jobId);
  const toggleTask = useToggleChecklist(jobId);
  const deleteTask = useDeleteChecklist(jobId);

  // Files
  const { data: files = [] } = useJobFiles(jobId);
  const uploadFile = useUploadJobFile(jobId);
  const deleteFile = useDeleteJobFile(jobId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Links
  const { data: links = [] } = useJobLinks(jobId);
  const addLink = useAddJobLink(jobId);
  const deleteLink = useDeleteJobLink(jobId);

  // Collaborators list
  const [colabList, setColabList] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColabList(data.map(c => c.nome));
    });
  }, []);

  // Local UI state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("Checklist");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(ext?.times_envolvidos || []));
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  // Dates state
  const [dataInicio, setDataInicio] = useState<Date | undefined>(ext?.data_inicio ? new Date(ext.data_inicio) : undefined);
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(ext?.data_entrega ? new Date(ext.data_entrega) : undefined);
  const [dataInicioEnabled, setDataInicioEnabled] = useState(!!ext?.data_inicio);
  const [dataEntregaEnabled, setDataEntregaEnabled] = useState(!!ext?.data_entrega);
  const [horaEntrega, setHoraEntrega] = useState(ext?.data_entrega ? format(new Date(ext.data_entrega), "HH:mm") : "");
  const [lembrete, setLembrete] = useState(ext?.lembrete || "nenhum");
  const [recorrente, setRecorrente] = useState(ext?.recorrente || "nunca");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

  // Checklist copy source
  const [copyFromJobs, setCopyFromJobs] = useState<{ id: string; label: string; items: string[] }[]>([]);
  const [loadingCopyJobs, setLoadingCopyJobs] = useState(false);

  useEffect(() => {
    if (ext?.times_envolvidos) setSelectedMembers(new Set(ext.times_envolvidos));
  }, [ext?.times_envolvidos]);

  useEffect(() => {
    if (ext) {
      setDataInicio(ext.data_inicio ? new Date(ext.data_inicio) : undefined);
      setDataEntrega(ext.data_entrega ? new Date(ext.data_entrega) : undefined);
      setDataInicioEnabled(!!ext.data_inicio);
      setDataEntregaEnabled(!!ext.data_entrega);
      setHoraEntrega(ext.data_entrega ? format(new Date(ext.data_entrega), "HH:mm") : "");
      setLembrete(ext.lembrete || "nenhum");
      setRecorrente(ext.recorrente || "nunca");
    }
  }, [ext]);

  const tags = ext?.tags || [];

  const togglePanel = (panel: string) => {
    setActivePanel(prev => prev === panel ? null : panel);
    // Load copy-from jobs when opening checklist
    if (panel === "checklist" && copyFromJobs.length === 0) {
      loadCopyFromJobs();
    }
  };

  // ─── Etiquetas ────
  const handleAddTag = (color: string) => {
    if (tags.includes(color)) return;
    upsert.mutate({ tags: [...tags, color] });
  };
  const handleRemoveTag = (color: string) => {
    upsert.mutate({ tags: tags.filter(t => t !== color) });
  };

  // ─── Membros ────
  const handleToggleMember = (name: string) => {
    const next = new Set(selectedMembers);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelectedMembers(next);
    upsert.mutate({ times_envolvidos: Array.from(next) });
  };

  // ─── Checklist ────
  const handleAddCheckItem = () => {
    if (!newTaskTitle.trim()) return;
    addTask.mutate(newTaskTitle.trim());
    setNewTaskTitle("");
  };

  const loadCopyFromJobs = async () => {
    setLoadingCopyJobs(true);
    try {
      const { data } = await supabase
        .from("job_checklist")
        .select("job_id, title")
        .neq("job_id", jobId)
        .order("created_at", { ascending: false })
        .limit(200);
      if (data) {
        const grouped = new Map<string, string[]>();
        for (const row of data) {
          if (!grouped.has(row.job_id)) grouped.set(row.job_id, []);
          grouped.get(row.job_id)!.push(row.title);
        }
        setCopyFromJobs(Array.from(grouped.entries()).map(([id, items]) => ({
          id,
          label: id,
          items,
        })).slice(0, 20));
      }
    } catch { /* ignore */ }
    setLoadingCopyJobs(false);
  };

  const handleCopyChecklist = async (sourceJobId: string) => {
    const source = copyFromJobs.find(j => j.id === sourceJobId);
    if (!source) return;
    for (const title of source.items) {
      await addTask.mutateAsync(title);
    }
    toast({ title: `${source.items.length} itens copiados` });
  };

  // ─── Datas ────
  const handleSaveDates = () => {
    const updates: Record<string, unknown> = {};
    if (dataInicioEnabled && dataInicio) {
      updates.data_inicio = dataInicio.toISOString();
    } else {
      updates.data_inicio = null;
    }
    if (dataEntregaEnabled && dataEntrega) {
      const d = new Date(dataEntrega);
      if (horaEntrega) {
        const [h, m] = horaEntrega.split(":").map(Number);
        d.setHours(h || 0, m || 0);
      }
      updates.data_entrega = d.toISOString();
    } else {
      updates.data_entrega = null;
    }
    updates.lembrete = lembrete;
    updates.recorrente = recorrente;
    upsert.mutate(updates as any);
    toast({ title: "Datas salvas" });
  };

  // ─── Anexo / Links ────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile.mutate(f);
    e.target.value = "";
  };

  const handleAddLink = () => {
    if (!linkUrl.trim()) return;
    let url = linkUrl.trim();
    if (!url.startsWith("http")) url = "https://" + url;
    addLink.mutate({ url, display_text: linkText.trim() || undefined });
    setLinkUrl("");
    setLinkText("");
  };

  const sidebarButtons = [
    { id: "etiquetas", icon: Tag, label: "Etiquetas", desc: "Organize, categorize e priorize" },
    { id: "datas", icon: CalendarDays, label: "Datas", desc: "Datas de início, entrega e lembretes" },
    { id: "checklist", icon: ListChecks, label: "Checklist", desc: "Adicionar subtarefas" },
    { id: "membros", icon: Users, label: "Membros", desc: "Atribuir membros" },
    { id: "anexo", icon: Paperclip, label: "Anexo", desc: "Adicione links, páginas e arquivos" },
    { id: "campos", icon: SlidersHorizontal, label: "Campos Personalizados", desc: "Criar seus próprios campos" },
  ];

  const checkedCount = checklist.filter(c => c.checked).length;

  return (
    <div className="w-[280px] flex-shrink-0 border-l bg-muted/20 flex flex-col">
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Adicionar ao cartão</p>

          {sidebarButtons.map(btn => (
            <button
              key={btn.id}
              onClick={() => togglePanel(btn.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                activePanel === btn.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60 text-foreground"
              }`}
            >
              <btn.icon className="h-4.5 w-4.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium leading-tight">{btn.label}</p>
                <p className="text-[11px] text-muted-foreground leading-tight">{btn.desc}</p>
              </div>
            </button>
          ))}
        </div>

        {/* ─── Etiquetas Panel ─── */}
        {activePanel === "etiquetas" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Etiquetas</p>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(t => (
                <span key={t} className="inline-flex items-center gap-1 text-[11px] font-medium text-white rounded-full px-2.5 py-1" style={{ backgroundColor: t }}>
                  {LABEL_COLORS.find(c => c.color === t)?.name || t}
                  <button onClick={() => handleRemoveTag(t)} className="hover:opacity-70"><X className="h-3 w-3" /></button>
                </span>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {LABEL_COLORS.map(lc => (
                <button
                  key={lc.color}
                  onClick={() => tags.includes(lc.color) ? handleRemoveTag(lc.color) : handleAddTag(lc.color)}
                  className={`h-8 rounded-md text-white text-[10px] font-medium transition-all ${tags.includes(lc.color) ? "ring-2 ring-offset-1 ring-foreground/50" : "hover:opacity-80"}`}
                  style={{ backgroundColor: lc.color }}
                >
                  {lc.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ─── Datas Panel (Enhanced) ─── */}
        {activePanel === "datas" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Datas</p>

            {/* Calendar */}
            <Calendar
              mode="single"
              selected={dataEntregaEnabled ? dataEntrega : dataInicio}
              onSelect={(d) => {
                if (d) {
                  if (dataEntregaEnabled) setDataEntrega(d);
                  else if (dataInicioEnabled) setDataInicio(d);
                  else { setDataEntregaEnabled(true); setDataEntrega(d); }
                }
              }}
              month={calendarMonth}
              onMonthChange={setCalendarMonth}
              className={cn("p-2 pointer-events-auto rounded-md border")}
            />

            {/* Data de início */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Data de início</label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={dataInicioEnabled}
                  onCheckedChange={(c) => {
                    setDataInicioEnabled(!!c);
                    if (!c) setDataInicio(undefined);
                  }}
                />
                <Input
                  type="date"
                  className="h-8 text-xs flex-1"
                  disabled={!dataInicioEnabled}
                  value={dataInicio ? format(dataInicio, "yyyy-MM-dd") : ""}
                  onChange={e => {
                    if (e.target.value) setDataInicio(new Date(e.target.value));
                  }}
                />
              </div>
            </div>

            {/* Data de entrega */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Data de entrega</label>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={dataEntregaEnabled}
                  onCheckedChange={(c) => {
                    setDataEntregaEnabled(!!c);
                    if (!c) { setDataEntrega(undefined); setHoraEntrega(""); }
                  }}
                />
                <Input
                  type="date"
                  className="h-8 text-xs flex-1"
                  disabled={!dataEntregaEnabled}
                  value={dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : ""}
                  onChange={e => {
                    if (e.target.value) setDataEntrega(new Date(e.target.value));
                  }}
                />
                <Input
                  type="time"
                  className="h-8 text-xs w-20"
                  disabled={!dataEntregaEnabled}
                  value={horaEntrega}
                  onChange={e => setHoraEntrega(e.target.value)}
                />
              </div>
            </div>

            {/* Recorrente */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium flex items-center gap-1">
                Recorrente <span className="text-[9px] bg-primary/10 text-primary px-1.5 rounded font-bold">NEW</span>
              </label>
              <Select value={recorrente} onValueChange={setRecorrente}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RECORRENTE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Lembrete */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Definir lembrete</label>
              <Select value={lembrete} onValueChange={setLembrete}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LEMBRETE_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground">Lembretes serão enviados a todos os membros e seguidores deste cartão.</p>
            </div>

            {/* ERP dates (read-only) */}
            <div className="space-y-1 pt-2 border-t">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase">Datas do ERP</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Criação:</span>
                  <span className="font-medium">{formatDateBR(job.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entrega:</span>
                  <span className="font-medium">{formatDateBR(job.delivery_date)}</span>
                </div>
                {job.delivery_need && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Necessidade:</span>
                    <span className="font-medium">{formatDateBR(job.delivery_need)}</span>
                  </div>
                )}
              </div>
            </div>

            <Button size="sm" className="w-full" onClick={handleSaveDates} disabled={upsert.isPending}>
              Salvar
            </Button>
          </div>
        )}

        {/* ─── Checklist Panel (Enhanced) ─── */}
        {activePanel === "checklist" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Checklist</p>
              <span className="text-[10px] text-muted-foreground">{checkedCount}/{checklist.length}</span>
            </div>

            {/* Checklist title */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Título</label>
              <Input
                value={checklistTitle}
                onChange={e => setChecklistTitle(e.target.value)}
                className="h-8 text-xs"
                placeholder="Checklist"
              />
            </div>

            {/* Copy from another job */}
            <div className="space-y-1">
              <label className="text-[11px] text-muted-foreground font-medium">Copiar Itens de...</label>
              <Select onValueChange={handleCopyChecklist}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="(nenhum)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">(nenhum)</SelectItem>
                  {copyFromJobs.map(j => (
                    <SelectItem key={j.id} value={j.id} className="text-xs">
                      {j.label} ({j.items.length} itens)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Progress bar */}
            {checklist.length > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${checklist.length ? (checkedCount / checklist.length) * 100 : 0}%` }} />
              </div>
            )}

            {/* Items */}
            <div className="space-y-1">
              {checklist.map(item => (
                <div key={item.id} className="flex items-center gap-2 group">
                  <Checkbox
                    checked={item.checked}
                    onCheckedChange={(c) => toggleTask.mutate({ taskId: item.id, checked: !!c })}
                  />
                  <span className={`text-sm flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
                  <button onClick={() => deleteTask.mutate(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new item */}
            <div className="flex gap-1.5">
              <Input
                value={newTaskTitle}
                onChange={e => setNewTaskTitle(e.target.value)}
                placeholder="Novo item..."
                className="h-8 text-xs"
                onKeyDown={e => e.key === "Enter" && handleAddCheckItem()}
              />
              <Button size="sm" className="h-8 px-2" onClick={handleAddCheckItem} disabled={addTask.isPending}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}

        {/* ─── Membros Panel ─── */}
        {activePanel === "membros" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Membros</p>
            {selectedMembers.size > 0 && (
              <div className="flex flex-wrap gap-1">
                {Array.from(selectedMembers).map(name => (
                  <Badge key={name} variant="secondary" className="text-[10px] gap-1">
                    {name}
                    <button onClick={() => handleToggleMember(name)}><X className="h-2.5 w-2.5" /></button>
                  </Badge>
                ))}
              </div>
            )}
            <Command className="border rounded-lg">
              <CommandInput placeholder="Buscar colaborador..." className="h-8" />
              <CommandList className="max-h-32">
                <CommandEmpty className="text-xs py-2">Nenhum encontrado.</CommandEmpty>
                <CommandGroup>
                  {colabList.map(name => (
                    <CommandItem key={name} value={name} onSelect={() => handleToggleMember(name)} className="text-xs cursor-pointer gap-2">
                      <Checkbox checked={selectedMembers.has(name)} className="pointer-events-none" />
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </div>
        )}

        {/* ─── Anexo Panel (Enhanced) ─── */}
        {activePanel === "anexo" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Anexar</p>

            {/* File upload section */}
            <div className="space-y-2 border rounded-lg p-3">
              <p className="text-xs text-muted-foreground">Anexe um arquivo de seu computador</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending}>
                {uploadFile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Escolher um arquivo
              </Button>
            </div>

            {/* Link section */}
            <div className="space-y-2">
              <label className="text-[11px] text-muted-foreground font-medium">Pesquise ou cole o link <span className="text-destructive">*</span></label>
              <Input
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
                placeholder="Encontre links recentes ou cole um lin..."
                className="h-8 text-xs"
                onKeyDown={e => e.key === "Enter" && handleAddLink()}
              />
              <label className="text-[11px] text-muted-foreground font-medium">Texto para exibição (opcional)</label>
              <Input
                value={linkText}
                onChange={e => setLinkText(e.target.value)}
                placeholder="Texto a ser exibido"
                className="h-8 text-xs"
              />
              <p className="text-[10px] text-muted-foreground">Dê um título ou uma descrição a este link</p>
              <Button size="sm" className="w-full" onClick={handleAddLink} disabled={!linkUrl.trim() || addLink.isPending}>
                Inserir
              </Button>
            </div>

            {/* Links list */}
            {links.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Links ({links.length})</p>
                {links.map(l => (
                  <div key={l.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/40 group text-xs">
                    <Link2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline text-primary">
                      {l.display_text || l.url}
                    </a>
                    <a href={l.url} target="_blank" rel="noopener noreferrer" className="opacity-0 group-hover:opacity-100 text-muted-foreground">
                      <ExternalLink className="h-3 w-3" />
                    </a>
                    <button onClick={() => deleteLink.mutate(l.id)} className="opacity-0 group-hover:opacity-100 text-destructive">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Files list */}
            {files.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Arquivos ({files.length})</p>
                {files.map(f => {
                  const isImage = f.file_type?.startsWith("image/");
                  return (
                    <div key={f.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/40 group text-xs">
                      {isImage ? <ImageIcon className="h-4 w-4 text-muted-foreground" /> : <FileText className="h-4 w-4 text-muted-foreground" />}
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline text-primary">{f.file_name}</a>
                      <button onClick={() => deleteFile.mutate({ fileId: f.id, filePath: f.file_url })} className="opacity-0 group-hover:opacity-100 text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── Campos Personalizados Panel ─── */}
        {activePanel === "campos" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Campos Personalizados</p>
            <div className="space-y-2 text-sm">
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">Prioridade</label>
                <div className="flex gap-1.5 mt-1">
                  {["baixa", "normal", "alta", "urgente"].map(p => (
                    <button
                      key={p}
                      onClick={() => upsert.mutate({ prioridade: p })}
                      className={`text-[10px] px-2.5 py-1 rounded-full font-medium capitalize transition-colors ${
                        (ext?.prioridade || "normal") === p
                          ? p === "urgente" ? "bg-red-500 text-white" : p === "alta" ? "bg-amber-500 text-white" : p === "baixa" ? "bg-slate-400 text-white" : "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-muted/80"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] text-muted-foreground font-medium">Notas Internas</label>
                <textarea
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm min-h-[60px] resize-none focus:outline-none focus:ring-1 focus:ring-ring"
                  placeholder="Observações internas..."
                  defaultValue={ext?.notas_internas || ""}
                  onBlur={e => upsert.mutate({ notas_internas: e.target.value || null })}
                />
              </div>
            </div>
          </div>
        )}

        {/* Summary when no panel active */}
        {(tags.length > 0 || selectedMembers.size > 0 || checklist.length > 0 || files.length > 0 || links.length > 0) && activePanel === null && (
          <div className="px-4 pb-4 space-y-2 border-t pt-3">
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {tags.map(t => (
                  <span key={t} className="h-2.5 w-8 rounded-sm" style={{ backgroundColor: t }} />
                ))}
              </div>
            )}
            {selectedMembers.size > 0 && (
              <p className="text-[11px] text-muted-foreground"><Users className="h-3 w-3 inline mr-1" />{selectedMembers.size} membro(s)</p>
            )}
            {checklist.length > 0 && (
              <p className="text-[11px] text-muted-foreground"><ListChecks className="h-3 w-3 inline mr-1" />{checkedCount}/{checklist.length} checklist</p>
            )}
            {(files.length > 0 || links.length > 0) && (
              <p className="text-[11px] text-muted-foreground"><Paperclip className="h-3 w-3 inline mr-1" />{files.length + links.length} anexo(s)</p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default JobSidebarActions;
