import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "../types";
import { formatDateBR } from "../types";
import { useJobExtension, useUpsertJobExtension } from "@/hooks/useJobExtensions";
import { useJobChecklist, useAddChecklistTask, useToggleChecklist, useDeleteChecklist } from "@/hooks/useJobLocalData";
import { useJobFiles, useUploadJobFile, useDeleteJobFile } from "@/hooks/useJobLocalData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "@/hooks/use-toast";
import {
  Tag, CalendarDays, ListChecks, Users, Paperclip, SlidersHorizontal,
  Plus, X, Trash2, Loader2, Download, FileText, Image as ImageIcon,
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

const JobSidebarActions: React.FC<Props> = ({ job }) => {
  const jobId = job.id;

  // Extension data (tags, teams)
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

  // Collaborators list
  const [colabList, setColabList] = useState<string[]>([]);
  useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColabList(data.map(c => c.nome));
    });
  }, []);

  // Local UI state
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [newTag, setNewTag] = useState("");
  const [newTask_title, setNewTaskTitle] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set(ext?.times_envolvidos || []));

  useEffect(() => {
    if (ext?.times_envolvidos) setSelectedMembers(new Set(ext.times_envolvidos));
  }, [ext?.times_envolvidos]);

  const tags = ext?.tags || [];

  const togglePanel = (panel: string) => {
    setActivePanel(prev => prev === panel ? null : panel);
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
    if (!newTask_title.trim()) return;
    addTask.mutate(newTask_title.trim());
    setNewTaskTitle("");
  };

  // ─── Anexo ────
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) uploadFile.mutate(f);
    e.target.value = "";
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

        {/* ─── Panels ─── */}
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

        {activePanel === "datas" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Datas</p>
            <div className="space-y-2 text-sm">
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
              {job.estimated_delivery && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prevista:</span>
                  <span className="font-medium">{formatDateBR(job.estimated_delivery)}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {activePanel === "checklist" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Checklist</p>
              <span className="text-[10px] text-muted-foreground">{checkedCount}/{checklist.length}</span>
            </div>
            {checklist.length > 0 && (
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${checklist.length ? (checkedCount / checklist.length) * 100 : 0}%` }} />
              </div>
            )}
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
            <div className="flex gap-1.5">
              <Input
                value={newTask_title}
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

        {activePanel === "anexo" && (
          <div className="px-4 pb-4 space-y-3 border-t pt-3">
            <p className="text-xs font-semibold text-muted-foreground">Anexos ({files.length})</p>
            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
            <Button size="sm" variant="outline" className="w-full gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploadFile.isPending}>
              {uploadFile.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              Adicionar arquivo
            </Button>
            <div className="space-y-1.5">
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
          </div>
        )}

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

        {/* Current labels/members summary at bottom */}
        {(tags.length > 0 || selectedMembers.size > 0 || checklist.length > 0 || files.length > 0) && activePanel === null && (
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
            {files.length > 0 && (
              <p className="text-[11px] text-muted-foreground"><Paperclip className="h-3 w-3 inline mr-1" />{files.length} anexo(s)</p>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default JobSidebarActions;
