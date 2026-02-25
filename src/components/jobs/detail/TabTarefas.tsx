import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "../types";
import { useJobTasks, useAddJobTask, useUpdateJobTask, useDeleteJobTask, useApplyTemplate, TASK_TEMPLATES } from "@/hooks/useJobTasks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, Trash2, Loader2, ListChecks, ChevronDown, ChevronRight } from "lucide-react";

interface Props { job: Job }

const PRIORIDADE_COLORS: Record<string, string> = {
  baixa: "bg-gray-100 text-gray-700",
  media: "bg-blue-100 text-blue-700",
  alta: "bg-amber-100 text-amber-700",
  urgente: "bg-red-100 text-red-700",
};

const TabTarefas: React.FC<Props> = ({ job }) => {
  const { data: tasks = [], isLoading } = useJobTasks(job.id);
  const addTask = useAddJobTask(job.id);
  const updateTask = useUpdateJobTask(job.id);
  const deleteTask = useDeleteJobTask(job.id);
  const applyTemplate = useApplyTemplate(job.id);

  const [newTitle, setNewTitle] = useState("");
  const [newPrioridade, setNewPrioridade] = useState("media");
  const [newResponsavel, setNewResponsavel] = useState("");
  const [newPrazo, setNewPrazo] = useState("");
  const [respOpen, setRespOpen] = useState(false);
  const [colabNames, setColabNames] = useState<string[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(["sem-template"]));

  useEffect(() => {
    supabase.from("colaboradores").select("nome").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColabNames(data.map(c => c.nome));
    });
  }, []);

  const rootTasks = tasks.filter(t => !t.parent_task_id);
  const subTasks = tasks.filter(t => t.parent_task_id);
  const doneCount = tasks.filter(t => t.status === "concluida").length;
  const progress = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  // Group by template
  const grouped = rootTasks.reduce((acc, t) => {
    const key = t.template_origem || "sem-template";
    if (!acc[key]) acc[key] = [];
    acc[key].push(t);
    return acc;
  }, {} as Record<string, typeof rootTasks>);

  const toggleGroup = (key: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    addTask.mutate({
      titulo: newTitle.trim(),
      prioridade: newPrioridade,
      responsavel_id: newResponsavel || undefined,
      prazo: newPrazo ? new Date(newPrazo).toISOString() : undefined,
    });
    setNewTitle("");
    setNewPrazo("");
    setNewResponsavel("");
  };

  const toggleStatus = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "concluida" ? "pendente" : "concluida";
    updateTask.mutate({ taskId, updates: { status: newStatus } });
  };

  if (isLoading) return <div className="p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold flex items-center gap-1.5"><ListChecks className="h-4 w-4" /> Tarefas</h3>
          <span className="text-xs text-muted-foreground">{doneCount}/{tasks.length}</span>
        </div>
        <div className="flex items-center gap-1.5">
          {Object.keys(TASK_TEMPLATES).map(tmpl => (
            <Button key={tmpl} size="sm" variant="outline" className="text-[10px] h-7"
              onClick={() => applyTemplate.mutate(tmpl)} disabled={applyTemplate.isPending}>
              + {tmpl}
            </Button>
          ))}
        </div>
      </div>

      {tasks.length > 0 && <Progress value={progress} className="h-2" />}

      {/* New task form */}
      <div className="flex gap-2 items-end flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <Input placeholder="Nova tarefa..." value={newTitle} onChange={e => setNewTitle(e.target.value)}
            className="h-9 text-sm" onKeyDown={e => { if (e.key === "Enter") handleAdd(); }} />
        </div>
        <Select value={newPrioridade} onValueChange={setNewPrioridade}>
          <SelectTrigger className="w-[100px] h-9 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="baixa">Baixa</SelectItem>
            <SelectItem value="media">Média</SelectItem>
            <SelectItem value="alta">Alta</SelectItem>
            <SelectItem value="urgente">Urgente</SelectItem>
          </SelectContent>
        </Select>
        <Popover open={respOpen} onOpenChange={setRespOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="h-9 text-xs min-w-[120px] justify-start truncate">
              {newResponsavel || <span className="text-muted-foreground">Responsável</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="p-0 w-[220px]" align="end">
            <Command>
              <CommandInput placeholder="Buscar..." className="h-8 text-xs" />
              <CommandList>
                <CommandEmpty className="text-xs p-2">Nenhum</CommandEmpty>
                <CommandGroup>
                  {colabNames.map(name => (
                    <CommandItem key={name} value={name} onSelect={() => { setNewResponsavel(name); setRespOpen(false); }} className="text-xs">
                      {name}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>
        <Input type="date" value={newPrazo} onChange={e => setNewPrazo(e.target.value)} className="h-9 text-xs w-[140px]" />
        <Button size="sm" onClick={handleAdd} disabled={!newTitle.trim() || addTask.isPending} className="h-9 gap-1">
          {addTask.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
          Adicionar
        </Button>
      </div>

      {/* Tasks by group */}
      {Object.entries(grouped).map(([groupKey, groupTasks]) => (
        <div key={groupKey} className="border rounded-lg overflow-hidden">
          <button onClick={() => toggleGroup(groupKey)}
            className="w-full flex items-center gap-2 p-2.5 bg-muted/30 hover:bg-muted/50 text-sm font-medium">
            {expandedGroups.has(groupKey) ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            {groupKey === "sem-template" ? "Tarefas Manuais" : groupKey}
            <span className="text-xs text-muted-foreground ml-auto">{groupTasks.filter(t => t.status === "concluida").length}/{groupTasks.length}</span>
          </button>
          {expandedGroups.has(groupKey) && (
            <div className="divide-y">
              {groupTasks.map(task => {
                const children = subTasks.filter(st => st.parent_task_id === task.id);
                const isLate = task.prazo && new Date(task.prazo) < new Date() && task.status !== "concluida";
                return (
                  <div key={task.id}>
                    <div className={`flex items-center gap-2 p-2.5 group ${task.status === "concluida" ? "opacity-60" : ""}`}>
                      <Checkbox checked={task.status === "concluida"} onCheckedChange={() => toggleStatus(task.id, task.status)}
                        className={task.status === "concluida" ? "data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600" : ""} />
                      <span className={`text-sm flex-1 ${task.status === "concluida" ? "line-through text-muted-foreground" : ""}`}>{task.titulo}</span>
                      <Badge className={`text-[9px] ${PRIORIDADE_COLORS[task.prioridade] || ""}`}>{task.prioridade}</Badge>
                      {task.responsavel_id && <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">{task.responsavel_id}</span>}
                      {task.prazo && (
                        <span className={`text-[10px] ${isLate ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                          {new Date(task.prazo).toLocaleDateString("pt-BR")}
                        </span>
                      )}
                      <button onClick={() => deleteTask.mutate(task.id)} className="text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    {children.map(child => (
                      <div key={child.id} className={`flex items-center gap-2 p-2 pl-8 group border-t border-dashed ${child.status === "concluida" ? "opacity-60" : ""}`}>
                        <Checkbox checked={child.status === "concluida"} onCheckedChange={() => toggleStatus(child.id, child.status)} />
                        <span className={`text-xs flex-1 ${child.status === "concluida" ? "line-through" : ""}`}>{child.titulo}</span>
                        <button onClick={() => deleteTask.mutate(child.id)} className="text-destructive/40 hover:text-destructive opacity-0 group-hover:opacity-100">
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}

      {tasks.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhuma tarefa ainda. Adicione manualmente ou aplique um template acima.
        </div>
      )}
    </div>
  );
};

export default TabTarefas;
