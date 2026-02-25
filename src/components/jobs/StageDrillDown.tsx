import React from "react";
import type { Job, JobsByStage, StageConfig } from "./types";
import { formatBRL, isOverdue } from "./types";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Clock, AlertTriangle, TrendingUp, Package } from "lucide-react";

interface Props {
  stageData: JobsByStage;
  onSelectJob: (job: Job) => void;
}

const StageDrillDown: React.FC<Props> = ({ stageData, onSelectJob }) => {
  const { stage, jobs, totalValue } = stageData;
  const overdueCount = jobs.filter(j => isOverdue(j.delivery_date) && j.status !== "fechado").length;
  const avgProgress = jobs.length > 0 ? Math.round(jobs.reduce((s, j) => s + j.progress_percent, 0) / jobs.length) : 0;

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Package className="h-3.5 w-3.5" /> Total de Jobs
          </div>
          <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <TrendingUp className="h-3.5 w-3.5" /> Valor Total
          </div>
          <p className="text-2xl font-bold text-foreground">{formatBRL(totalValue)}</p>
        </div>
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <Clock className="h-3.5 w-3.5" /> Progresso Médio
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold text-foreground">{avgProgress}%</p>
            <Progress value={avgProgress} className="flex-1 h-2" />
          </div>
        </div>
        <div className="bg-card border rounded-lg p-4 space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-xs font-medium">
            <AlertTriangle className="h-3.5 w-3.5" /> Atrasados
          </div>
          <p className={`text-2xl font-bold ${overdueCount > 0 ? "text-destructive" : "text-foreground"}`}>{overdueCount}</p>
        </div>
      </div>

      {/* Jobs list */}
      <div className="border rounded-lg overflow-hidden bg-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted/50 border-b text-muted-foreground text-xs">
              <th className="text-left p-3">#</th>
              <th className="text-left p-3">Cliente</th>
              <th className="text-left p-3">Descrição</th>
              <th className="text-left p-3">Responsável</th>
              <th className="text-right p-3">Valor</th>
              <th className="text-left p-3">Entrega</th>
              <th className="text-right p-3">Progresso</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map(job => {
              const overdue = isOverdue(job.delivery_date) && job.status !== "fechado";
              return (
                <tr
                  key={job.id}
                  onClick={() => onSelectJob(job)}
                  className={`border-b cursor-pointer hover:bg-accent/50 transition-colors ${overdue ? "bg-destructive/5" : ""}`}
                >
                  <td className="p-3 font-mono text-xs text-muted-foreground">J{job.code || job.id}</td>
                  <td className="p-3 font-medium text-xs">{job.client_name}</td>
                  <td className="p-3 text-muted-foreground text-xs max-w-[200px] truncate">{job.description}</td>
                  <td className="p-3 text-xs">{job.responsible[0]?.name || "—"}</td>
                  <td className="p-3 text-right text-xs font-medium">{formatBRL(job.value)}</td>
                  <td className={`p-3 text-xs ${overdue ? "text-destructive font-semibold" : ""}`}>
                    {job.delivery_date ? new Date(job.delivery_date).toLocaleDateString("pt-BR") : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Progress value={job.progress_percent} className="w-16 h-1.5" />
                      <span className="text-xs text-muted-foreground w-8 text-right">{job.progress_percent}%</span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {jobs.length === 0 && (
          <div className="text-center py-10 text-muted-foreground text-sm">Nenhum job nesta etapa</div>
        )}
      </div>
    </div>
  );
};

export default StageDrillDown;
