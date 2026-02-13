import { useState } from "react";
import { Job, formatCurrency, formatDate, getAllTasks, getProgressColor, chargeStatusMap, invoiceStatusMap } from "./types";
import { mockJobs } from "./mockData";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Search, Filter } from "lucide-react";
import JobDetailSheet from "./JobDetailSheet";

const JobsTable = () => {
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [chargeFilter, setChargeFilter] = useState("all");

  const filtered = mockJobs.filter(j => {
    if (search && !j.title.toLowerCase().includes(search.toLowerCase()) && !j.code.toString().includes(search) && !j.customerName.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== "all") {
      const tasks = getAllTasks(j);
      const hasStatus = tasks.some(t => t.productionStatus === statusFilter);
      if (!hasStatus && !(statusFilter === "Finalized" && j.isFinalized)) return false;
    }
    if (chargeFilter !== "all" && j.jobChargeStatus !== chargeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por código, título, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="pl-8" />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Status Produção" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="NotStarted">Não Iniciado</SelectItem>
            <SelectItem value="InProgress">Em Produção</SelectItem>
            <SelectItem value="Paused">Pausado</SelectItem>
            <SelectItem value="Finalized">Finalizado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={chargeFilter} onValueChange={setChargeFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Cobrança" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="Pending">Pendente</SelectItem>
            <SelectItem value="Partial">Parcial</SelectItem>
            <SelectItem value="Paid">Pago</SelectItem>
            <SelectItem value="Overdue">Atrasado</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm"><Filter className="h-3.5 w-3.5 mr-1" /> Filtrar</Button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border rounded-lg">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr className="text-xs text-muted-foreground">
              <th className="text-left py-2.5 px-3">Job</th>
              <th className="text-left py-2.5 px-3">Título</th>
              <th className="text-left py-2.5 px-3">Cliente</th>
              <th className="text-left py-2.5 px-3">Responsável</th>
              <th className="text-left py-2.5 px-3">Progresso</th>
              <th className="text-left py-2.5 px-3">Criado</th>
              <th className="text-left py-2.5 px-3">Entrega</th>
              <th className="text-right py-2.5 px-3">Valor</th>
              <th className="text-right py-2.5 px-3">Custo Real</th>
              <th className="text-center py-2.5 px-3">Margem</th>
              <th className="text-center py-2.5 px-3">Cobrança</th>
              <th className="text-center py-2.5 px-3">NF</th>
              <th className="text-center py-2.5 px-3">✓</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((j, i) => {
              const pct = j.production.progressPercentage ?? 0;
              const margin = j.costs.realized.ProfitPercentual;
              const isOverdue = j.deliveryNeeded && new Date(j.deliveryNeeded) < new Date() && !j.isFinalized;
              return (
                <tr key={j.id} className={`border-b hover:bg-muted/50 cursor-pointer ${i % 2 === 0 ? '' : 'bg-muted/20'}`} onClick={() => setSelectedJob(j)}>
                  <td className="py-2 px-3 font-bold text-primary">#{j.code}</td>
                  <td className="py-2 px-3 max-w-[200px] truncate font-medium">{j.title}</td>
                  <td className="py-2 px-3 text-xs">{j.customerName}</td>
                  <td className="py-2 px-3 text-xs">{j.responsibleName}</td>
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-1 w-20">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className={`h-full rounded-full ${getProgressColor(pct)}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-[10px]">{pct.toFixed(0)}%</span>
                    </div>
                  </td>
                  <td className="py-2 px-3 text-xs">{formatDate(j.creationTime)}</td>
                  <td className={`py-2 px-3 text-xs ${isOverdue ? 'text-red-600 font-medium' : ''}`}>{formatDate(j.deliveryNeeded)}</td>
                  <td className="py-2 px-3 text-right text-xs">{formatCurrency(j.totalPrice)}</td>
                  <td className="py-2 px-3 text-right text-xs">{j.costs.realized.ProductionCost > 0 ? formatCurrency(j.costs.realized.ProductionCost) : '—'}</td>
                  <td className="py-2 px-3 text-center">
                    {margin > 0 ? (
                      <span className={`text-xs font-medium ${margin >= 40 ? 'text-emerald-600' : margin >= 30 ? 'text-blue-600' : 'text-amber-600'}`}>{margin.toFixed(1)}%</span>
                    ) : '—'}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge className={`text-[9px] px-1 py-0 ${chargeStatusMap[j.jobChargeStatus]?.color}`}>{chargeStatusMap[j.jobChargeStatus]?.label}</Badge>
                  </td>
                  <td className="py-2 px-3 text-center">
                    <Badge className={`text-[9px] px-1 py-0 ${invoiceStatusMap[j.jobInvoiceStatus]?.color}`}>{invoiceStatusMap[j.jobInvoiceStatus]?.label}</Badge>
                  </td>
                  <td className="py-2 px-3 text-center">{j.isFinalized ? '✅' : '⬜'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-muted-foreground">Mostrando 1-{filtered.length} de 500 registros</p>

      <JobDetailSheet job={selectedJob} open={!!selectedJob} onOpenChange={o => !o && setSelectedJob(null)} />
    </div>
  );
};

export default JobsTable;
