import { useState } from "react";
import { Job, formatCurrency, formatDate, getAllTasks, getProgressColor, chargeStatusMap, invoiceStatusMap } from "./types";
import { mockJobs } from "./mockData";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, Play, Pause, CheckCircle, XCircle, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import JobDetailSheet from "./JobDetailSheet";

const columns = [
  { status: "NotStarted", label: "Não Iniciado", icon: Clock, color: "bg-slate-400" },
  { status: "InProgress", label: "Em Produção", icon: Play, color: "bg-blue-500" },
  { status: "Paused", label: "Pausado", icon: Pause, color: "bg-amber-500" },
  { status: "Finalized", label: "Finalizado", icon: CheckCircle, color: "bg-emerald-500" },
  { status: "Cancelled", label: "Cancelado", icon: XCircle, color: "bg-red-500" },
];

function getJobPrimaryStatus(job: Job): string {
  const tasks = getAllTasks(job);
  if (tasks.length === 0) return "NotStarted";
  if (job.isFinalized || tasks.every(t => t.productionStatus === "Finalized")) return "Finalized";
  if (tasks.some(t => t.productionStatus === "Paused")) return "Paused";
  if (tasks.some(t => t.productionStatus === "InProgress")) return "InProgress";
  if (tasks.some(t => t.productionStatus === "Finalized")) return "InProgress";
  return "NotStarted";
}

const KanbanBoard = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [responsible, setResponsible] = useState("all");

  const filtered = mockJobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.code.toString().includes(search) && !j.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (responsible !== "all" && j.responsibleName !== responsible) return false;
    return true;
  });

  const jobsByColumn = columns.map(col => ({
    ...col,
    jobs: filtered.filter(j => getJobPrimaryStatus(j) === col.status),
  }));

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, título..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={responsible} onValueChange={setResponsible}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Responsável" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="João Silva">João Silva</SelectItem>
            <SelectItem value="Maria Santos">Maria Santos</SelectItem>
            <SelectItem value="Carlos Almeida">Carlos Almeida</SelectItem>
          </SelectContent>
        </Select>
        <Badge variant="secondary">{filtered.length} jobs</Badge>
        <Button variant="outline" size="sm"><RefreshCw className="h-3.5 w-3.5 mr-1" /> Sincronizar</Button>
      </div>

      {/* Kanban Columns */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {jobsByColumn.map(col => {
          const Icon = col.icon;
          return (
            <div key={col.status} className="min-w-[280px] flex-1">
              <div className={`flex items-center gap-2 p-2 rounded-t-lg text-white ${col.color}`}>
                <Icon className="h-4 w-4" />
                <span className="font-medium text-sm">{col.label}</span>
                <Badge variant="secondary" className="ml-auto bg-white/20 text-white">{col.jobs.length}</Badge>
              </div>
              <ScrollArea className="h-[calc(100vh-320px)] bg-muted/30 rounded-b-lg p-2">
                <div className="space-y-2">
                  {col.jobs.map(job => <KanbanCard key={job.id} job={job} onClick={() => setSelectedJob(job)} />)}
                  {col.jobs.length === 0 && <p className="text-xs text-muted-foreground text-center py-8">Nenhum job</p>}
                </div>
              </ScrollArea>
            </div>
          );
        })}
      </div>

      <JobDetailSheet job={selectedJob} open={!!selectedJob} onOpenChange={o => !o && setSelectedJob(null)} />
    </div>
  );
};

const KanbanCard = ({ job, onClick }: { job: Job; onClick: () => void }) => {
  const tasks = getAllTasks(job);
  const finishedTasks = tasks.filter(t => t.productionStatus === "Finalized").length;
  const pct = job.production.progressPercentage ?? 0;

  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-primary">Job #{job.code}</span>
          <div className="flex items-center gap-1 w-20">
            <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className={`h-full rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
            </div>
            <span className="text-[10px] font-medium">{pct.toFixed(0)}%</span>
          </div>
        </div>
        <p className="text-xs font-medium leading-tight line-clamp-2">{job.title}</p>
        <div className="text-[11px] text-muted-foreground space-y-0.5">
          <div>👤 {job.customerName}</div>
          <div>🧑‍🔧 {job.responsibleName}</div>
          {job.deliveryNeeded && <div>📅 Entrega: {formatDate(job.deliveryNeeded)}</div>}
          <div>💰 {formatCurrency(job.totalPrice)}</div>
        </div>
        <div className="flex flex-wrap gap-1">
          <Badge className={`text-[10px] px-1.5 py-0 ${chargeStatusMap[job.jobChargeStatus]?.color}`}>
            {chargeStatusMap[job.jobChargeStatus]?.label}
          </Badge>
          <Badge className={`text-[10px] px-1.5 py-0 ${invoiceStatusMap[job.jobInvoiceStatus]?.color}`}>
            {invoiceStatusMap[job.jobInvoiceStatus]?.label}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground">Tasks: {finishedTasks}/{tasks.length} concluídas</p>
      </CardContent>
    </Card>
  );
};

export default KanbanBoard;
