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
import { useEtiquetas, etiquetaCorToBg } from "@/hooks/useEtiquetas";
import EtiquetasEditor from "@/components/etiquetas/EtiquetasEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";
import {
  Tag, CalendarDays, ListChecks, Users, Paperclip, SlidersHorizontal,
  Plus, X, Trash2, Loader2, FileText, Image as ImageIcon, Link2, ExternalLink,
} from "lucide-react";
import EquipmentSection from "./EquipmentSection";

interface Props {
  job: Job;
}

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

  const { data: ext } = useJobExtension(jobId);
  const upsert = useUpsertJobExtension(jobId);

  const { data: checklist = [] } = useJobChecklist(jobId);
  const addTask = useAddChecklistTask(jobId);
  const toggleTask = useToggleChecklist(jobId);
  const deleteTask = useDeleteChecklist(jobId);

  const { data: files = [] } = useJobFiles(jobId);
  const uploadFile = useUploadJobFile(jobId);
  const deleteFile = useDeleteJobFile(jobId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: links = [] } = useJobLinks(jobId);
  const addLink = useAddJobLink(jobId);
  const deleteLink = useDeleteJobLink(jobId);

  const [colabList, setColabList] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColabList(data.map(c => c.nome));
    });
  }, []);

  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [checklistTitle, setChecklistTitle] = useState("Checklist");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(ext?.times_envolvidos || []));
  const [linkUrl, setLinkUrl] = useState("");
  const [linkText, setLinkText] = useState("");

  const [dataInicio, setDataInicio] = useState<Date | undefined>(ext?.data_inicio ? new Date(ext.data_inicio) : undefined);
  const [dataEntrega, setDataEntrega] = useState<Date | undefined>(ext?.data_entrega ? new Date(ext.data_entrega) : undefined);
  const [dataInicioEnabled, setDataInicioEnabled] = useState(!!ext?.data_inicio);
  const [dataEntregaEnabled, setDataEntregaEnabled] = useState(!!ext?.data_entrega);
  const [horaEntrega, setHoraEntrega] = useState(ext?.data_entrega ? format(new Date(ext.data_entrega), "HH:mm") : "");
  const [lembrete, setLembrete] = useState(ext?.lembrete || "nenhum");
  const [recorrente, setRecorrente] = useState(ext?.recorrente || "nunca");
  const [calendarMonth, setCalendarMonth] = useState<Date>(new Date());

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
  const { data: allEtiquetas = [] } = useEtiquetas();
  const checkedCount = checklist.filter(c => c.checked).length;
  const anexosCount = files.length + links.length;

  // Map tag IDs to etiqueta objects for display
  const selectedEtiquetas = allEtiquetas.filter(e => tags.includes(e.id));

  // ─── Handlers ────
  const handleToggleEtiqueta = (id: string, selected: boolean) => {
    if (selected) {
      if (!tags.includes(id)) upsert.mutate({ tags: [...tags, id] });
    } else {
      upsert.mutate({ tags: tags.filter(t => t !== id) });
    }
  };
  const handleToggleMember = (name: string) => {
    const next = new Set(selectedMembers);
    if (next.has(name)) next.delete(name); else next.add(name);
    setSelectedMembers(next);
    upsert.mutate({ times_envolvidos: Array.from(next) });
  };
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
          id, label: id, items,
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

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center gap-1 px-5 py-2 border-b bg-muted/30 flex-shrink-0 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mr-2">Ferramentas</span>

        {/* ─── Etiquetas ─── */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <Tag className="h-3.5 w-3.5" />
                  Etiquetas
                  {selectedEtiquetas.length > 0 && (
                    <span className="flex gap-0.5 ml-0.5">
                      {selectedEtiquetas.slice(0, 3).map(e => (
                        <span key={e.id} className={`h-2.5 w-2.5 rounded-full ${etiquetaCorToBg(e.cor)}`} />
                      ))}
                      {selectedEtiquetas.length > 3 && <span className="text-[9px] text-muted-foreground">+{selectedEtiquetas.length - 3}</span>}
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Organize e categorize</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-[320px] p-0 bg-[#0d1117] border-[#2a2f3d]" align="start">
            <div className="h-[420px]">
              <EtiquetasEditor
                selectedIds={tags}
                onToggle={handleToggleEtiqueta}
              />
            </div>
          </PopoverContent>
        </Popover>

        {/* ─── Datas ─── */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <CalendarDays className="h-3.5 w-3.5" />
                  Datas
                  {(dataInicioEnabled || dataEntregaEnabled) && (
                    <span className="h-2 w-2 rounded-full bg-primary" />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Início, entrega e lembretes</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-3" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Datas</p>
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
              className="p-1 pointer-events-auto rounded-md border mb-2"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Início</label>
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={dataInicioEnabled} onCheckedChange={(c) => { setDataInicioEnabled(!!c); if (!c) setDataInicio(undefined); }} />
                  <Input type="date" className="h-7 text-[11px] flex-1" disabled={!dataInicioEnabled} value={dataInicio ? format(dataInicio, "yyyy-MM-dd") : ""} onChange={e => { if (e.target.value) setDataInicio(new Date(e.target.value)); }} />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[11px] text-muted-foreground font-medium">Entrega</label>
                <div className="flex items-center gap-1.5">
                  <Checkbox checked={dataEntregaEnabled} onCheckedChange={(c) => { setDataEntregaEnabled(!!c); if (!c) { setDataEntrega(undefined); setHoraEntrega(""); } }} />
                  <Input type="date" className="h-7 text-[11px] flex-1" disabled={!dataEntregaEnabled} value={dataEntrega ? format(dataEntrega, "yyyy-MM-dd") : ""} onChange={e => { if (e.target.value) setDataEntrega(new Date(e.target.value)); }} />
                </div>
              </div>
            </div>
            {dataEntregaEnabled && (
              <div className="mt-2">
                <label className="text-[11px] text-muted-foreground font-medium">Horário</label>
                <Input type="time" className="h-7 text-[11px] w-24 mt-0.5" value={horaEntrega} onChange={e => setHoraEntrega(e.target.value)} />
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="space-y-0.5">
                <label className="text-[11px] text-muted-foreground font-medium">Lembrete</label>
                <Select value={lembrete} onValueChange={setLembrete}>
                  <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{LEMBRETE_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
              <div className="space-y-0.5">
                <label className="text-[11px] text-muted-foreground font-medium">Recorrente</label>
                <Select value={recorrente} onValueChange={setRecorrente}>
                  <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                  <SelectContent>{RECORRENTE_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>))}</SelectContent>
                </Select>
              </div>
            </div>
            {/* ERP dates */}
            <div className="mt-2 pt-2 border-t text-[11px] space-y-0.5">
              <p className="font-semibold text-muted-foreground uppercase text-[9px]">Datas do ERP</p>
              <div className="flex justify-between"><span className="text-muted-foreground">Criação:</span><span>{formatDateBR(job.created_at)}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Entrega:</span><span>{formatDateBR(job.delivery_date)}</span></div>
              {job.delivery_need && <div className="flex justify-between"><span className="text-muted-foreground">Necessidade:</span><span>{formatDateBR(job.delivery_need)}</span></div>}
            </div>
            <Button size="sm" className="w-full mt-2 h-7 text-xs" onClick={handleSaveDates} disabled={upsert.isPending}>Salvar</Button>
          </PopoverContent>
        </Popover>

        {/* ─── Checklist ─── */}
        <Popover onOpenChange={(open) => { if (open && copyFromJobs.length === 0) loadCopyFromJobs(); }}>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <ListChecks className="h-3.5 w-3.5" />
                  Checklist
                  {checklist.length > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-0.5">{checkedCount}/{checklist.length}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Adicionar subtarefas</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-3" align="start">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-muted-foreground">Checklist</p>
              <span className="text-[10px] text-muted-foreground">{checkedCount}/{checklist.length}</span>
            </div>
            {/* Progress */}
            {checklist.length > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden mb-2">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${(checkedCount / checklist.length) * 100}%` }} />
              </div>
            )}
            {/* Items */}
            <ScrollArea className="max-h-40">
              <div className="space-y-1">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox checked={item.checked} onCheckedChange={(c) => toggleTask.mutate({ taskId: item.id, checked: !!c })} />
                    <span className={`text-xs flex-1 ${item.checked ? "line-through text-muted-foreground" : ""}`}>{item.title}</span>
                    <button onClick={() => deleteTask.mutate(item.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-3 w-3" /></button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {/* Add */}
            <div className="flex gap-1.5 mt-2">
              <Input value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="Novo item..." className="h-7 text-xs" onKeyDown={e => e.key === "Enter" && handleAddCheckItem()} />
              <Button size="sm" className="h-7 px-2" onClick={handleAddCheckItem} disabled={addTask.isPending}><Plus className="h-3.5 w-3.5" /></Button>
            </div>
            {/* Copy from */}
            <div className="mt-2 pt-2 border-t">
              <Select onValueChange={handleCopyChecklist}>
                <SelectTrigger className="h-7 text-[11px]"><SelectValue placeholder="Copiar de outro job..." /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none" className="text-xs">(nenhum)</SelectItem>
                  {copyFromJobs.map(j => (<SelectItem key={j.id} value={j.id} className="text-xs">{j.label} ({j.items.length})</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </PopoverContent>
        </Popover>

        {/* ─── Membros ─── */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <Users className="h-3.5 w-3.5" />
                  Membros
                  {selectedMembers.size > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-0.5">{selectedMembers.size}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Atribuir membros</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72 p-3" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Membros</p>
            {selectedMembers.size > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
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
          </PopoverContent>
        </Popover>

        {/* ─── Anexo ─── */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <Paperclip className="h-3.5 w-3.5" />
                  Anexo
                  {anexosCount > 0 && (
                    <Badge variant="secondary" className="text-[9px] h-4 px-1.5 ml-0.5">{anexosCount}</Badge>
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Links, páginas e arquivos</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-80 p-3" align="start">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Anexar</p>
            {/* File upload */}
            <div className="border rounded-lg p-2.5 space-y-1.5 mb-2">
              <p className="text-[11px] text-muted-foreground">Anexe um arquivo de seu computador</p>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
              <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs h-7" onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending}>
                {uploadFile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                Escolher arquivo
              </Button>
            </div>
            {/* Link */}
            <div className="space-y-1.5">
              <label className="text-[11px] text-muted-foreground font-medium">Cole o link <span className="text-destructive">*</span></label>
              <Input value={linkUrl} onChange={e => setLinkUrl(e.target.value)} placeholder="https://..." className="h-7 text-xs" onKeyDown={e => e.key === "Enter" && handleAddLink()} />
              <Input value={linkText} onChange={e => setLinkText(e.target.value)} placeholder="Texto de exibição (opcional)" className="h-7 text-xs" />
              <Button size="sm" className="w-full h-7 text-xs" onClick={handleAddLink} disabled={!linkUrl.trim() || addLink.isPending}>Inserir</Button>
            </div>
            {/* Lists */}
            <ScrollArea className="max-h-36 mt-2">
              {links.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase">Links ({links.length})</p>
                  {links.map(l => (
                    <div key={l.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/40 group text-xs">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                      <a href={l.url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline text-primary text-[11px]">{l.display_text || l.url}</a>
                      <button onClick={() => deleteLink.mutate(l.id)} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
              {files.length > 0 && (
                <div className="space-y-1 pt-1.5 border-t mt-1.5">
                  <p className="text-[9px] font-semibold text-muted-foreground uppercase">Arquivos ({files.length})</p>
                  {files.map(f => (
                    <div key={f.id} className="flex items-center gap-2 p-1.5 rounded bg-muted/40 group text-xs">
                      {f.file_type?.startsWith("image/") ? <ImageIcon className="h-3.5 w-3.5 text-muted-foreground" /> : <FileText className="h-3.5 w-3.5 text-muted-foreground" />}
                      <a href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex-1 truncate hover:underline text-primary text-[11px]">{f.file_name}</a>
                      <button onClick={() => deleteFile.mutate({ fileId: f.id, filePath: f.file_url })} className="opacity-0 group-hover:opacity-100 text-destructive"><Trash2 className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
          </PopoverContent>
        </Popover>

        {/* ─── Campos Personalizados ─── */}
        <Popover>
          <Tooltip>
            <TooltipTrigger asChild>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs px-2.5">
                  <SlidersHorizontal className="h-3.5 w-3.5" />
                  Campos
                  {ext?.prioridade && ext.prioridade !== "normal" && (
                    <span className={`h-2 w-2 rounded-full ${ext.prioridade === "urgente" ? "bg-red-500" : ext.prioridade === "alta" ? "bg-amber-500" : "bg-slate-400"}`} />
                  )}
                </Button>
              </PopoverTrigger>
            </TooltipTrigger>
            <TooltipContent side="bottom"><p>Prioridade e notas</p></TooltipContent>
          </Tooltip>
          <PopoverContent className="w-72 p-3" align="end">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Campos Personalizados</p>
            <div className="space-y-3">
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
          </PopoverContent>
        </Popover>
        {/* ─── Equipamento ─── */}
        <EquipmentSection job={job} />
      </div>
    </TooltipProvider>
  );
};

export default JobSidebarActions;
