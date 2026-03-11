import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, AlertTriangle, Calendar } from "lucide-react";
import { mockTasks } from "@/lib/crm/mockData";

const PRIORITY_COLORS = { alta: "destructive", media: "secondary", baixa: "outline" } as const;
const now = new Date();

export default function CRMTarefasPage() {
  const [statusFilter, setStatusFilter] = useState("pendentes");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockTasks.filter(t => {
      if (statusFilter === "pendentes" && t.completed) return false;
      if (statusFilter === "concluidas" && !t.completed) return false;
      if (priorityFilter !== "todas" && t.priority !== priorityFilter) return false;
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, priorityFilter, search]);

  const overdue = filtered.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now);
  const upcoming = filtered.filter(t => !t.completed && (!t.due_date || new Date(t.due_date!) >= now));
  const completed = filtered.filter(t => t.completed);
  const pendingCount = mockTasks.filter(t => !t.completed).length;
  const doneCount = mockTasks.filter(t => t.completed).length;

  const TaskCard = ({ task }: { task: typeof mockTasks[0] }) => {
    const isOverdue = !task.completed && task.due_date && new Date(task.due_date) < now;
    return (
      <Card className={isOverdue ? "border-destructive/30 bg-destructive/5" : ""}>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start gap-3">
            <Checkbox checked={task.completed} className="mt-1" />
            <div className="flex-1 min-w-0">
              <p className={`font-medium text-sm ${task.completed ? "line-through text-muted-foreground" : ""}`}>{task.title}</p>
              {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                <Badge variant={PRIORITY_COLORS[task.priority] as any} className="text-[10px]">{task.priority}</Badge>
                <span className="text-xs text-muted-foreground">{task.owner_name}</span>
                {task.deal_title && <span className="text-xs text-primary">• {task.deal_title}</span>}
              </div>
              {task.due_date && (
                <div className={`flex items-center gap-1 mt-1 text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
                  {isOverdue && <AlertTriangle className="h-3 w-3" />}
                  <Calendar className="h-3 w-3" />
                  {new Date(task.due_date).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tarefas</h1>
          <p className="text-sm text-muted-foreground">{pendingCount} pendentes • {doneCount} concluídas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Tarefa</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Tarefa</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Título</Label><Input placeholder="Título da tarefa" /></div>
              <div className="space-y-2"><Label>Descrição</Label><Textarea placeholder="Descrição" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Prioridade</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Responsável</Label><Input placeholder="Nome" /></div>
                <div className="space-y-2"><Label>Deal</Label><Input placeholder="Deal relacionado" /></div>
                <div className="space-y-2"><Label>Data de Vencimento</Label><Input type="date" /></div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline">Cancelar</Button><Button>Salvar</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar tarefa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="pendentes">Pendentes</SelectItem><SelectItem value="concluidas">Concluídas</SelectItem><SelectItem value="todas">Todas</SelectItem></SelectContent>
        </Select>
        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="alta">Alta</SelectItem><SelectItem value="media">Média</SelectItem><SelectItem value="baixa">Baixa</SelectItem></SelectContent>
        </Select>
      </div>

      {overdue.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-destructive mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Atrasadas ({overdue.length})</h2>
          <div className="space-y-2">{overdue.map(t => <TaskCard key={t.id} task={t} />)}</div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Próximas ({upcoming.length})</h2>
          <div className="space-y-2">{upcoming.map(t => <TaskCard key={t.id} task={t} />)}</div>
        </div>
      )}

      {completed.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-muted-foreground mb-3">Concluídas ({completed.length})</h2>
          <div className="space-y-2">{completed.map(t => <TaskCard key={t.id} task={t} />)}</div>
        </div>
      )}
    </div>
  );
}
