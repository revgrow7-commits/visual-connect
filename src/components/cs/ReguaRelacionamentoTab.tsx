import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTouchpoints } from "./mockData";
import type { Touchpoint } from "./types";

const typeCfg: Record<string, { label: string; icon: string; className: string }> = {
  nps_survey: { label: "Pesquisa NPS", icon: "⭐", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  post_delivery_follow: { label: "Follow-up", icon: "📞", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  warranty_reminder: { label: "Lembrete Garantia", icon: "🛡️", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  reorder_nudge: { label: "Recompra", icon: "🔄", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  churn_alert: { label: "Alerta Churn", icon: "🚨", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  anniversary: { label: "Aniversário", icon: "🎂", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  seasonal_campaign: { label: "Campanha", icon: "📣", className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100" },
  complaint_resolved_check: { label: "Check Resolução", icon: "✅", className: "bg-green-100 text-green-800 hover:bg-green-100" },
};

const channelIcon: Record<string, string> = { email: "📧", phone: "📞", whatsapp: "💬", visit: "🏠" };
const statusCfg: Record<string, { label: string; className: string }> = {
  pending: { label: "⬜ Pendente", className: "bg-muted text-muted-foreground hover:bg-muted" },
  completed: { label: "✅ Realizado", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  postponed: { label: "⏭️ Adiado", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  skipped: { label: "⏭️ Pulado", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const ReguaRelacionamentoTab = () => {
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");

  const filtered = mockTouchpoints.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pending = mockTouchpoints.filter((t) => t.status === "pending").length;
  const completed = mockTouchpoints.filter((t) => t.status === "completed").length;

  // Group by week for calendar view
  const weekGroups = filtered.reduce<Record<string, typeof filtered>>((acc, tp) => {
    const d = new Date(tp.date);
    const weekStart = new Date(d);
    weekStart.setDate(d.getDate() - d.getDay() + 1);
    const key = weekStart.toISOString().split("T")[0];
    if (!acc[key]) acc[key] = [];
    acc[key].push(tp);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Realizados (mês)</p><p className="text-2xl font-bold text-green-600">{completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Programados</p><p className="text-2xl font-bold">{mockTouchpoints.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Taxa Execução</p><p className="text-2xl font-bold text-blue-600">{Math.round((completed / mockTouchpoints.length) * 100)}%</p></CardContent></Card>
      </div>

      {/* SLA Reference Card */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">📏 Regras de Touchpoints</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <span>⭐ NPS: D+3 após entrega</span>
            <span>📞 Follow-up: D+7 após entrega</span>
            <span>🛡️ Garantia: 30d antes vencimento</span>
            <span>🔄 Recompra: 60d sem novo pedido</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="pending">Pendente</SelectItem>
            <SelectItem value="completed">Realizado</SelectItem>
            <SelectItem value="postponed">Adiado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="nps_survey">Pesquisa NPS</SelectItem>
            <SelectItem value="post_delivery_follow">Follow-up</SelectItem>
            <SelectItem value="warranty_reminder">Garantia</SelectItem>
            <SelectItem value="reorder_nudge">Recompra</SelectItem>
            <SelectItem value="anniversary">Aniversário</SelectItem>
            <SelectItem value="seasonal_campaign">Campanha</SelectItem>
            <SelectItem value="complaint_resolved_check">Check Resolução</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Trigger</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tp) => (
                <TableRow key={tp.id} className={tp.status === "pending" ? "bg-yellow-50/20" : ""}>
                  <TableCell className="whitespace-nowrap">{formatDate(tp.date)}</TableCell>
                  <TableCell className="font-medium">{tp.customerName}</TableCell>
                  <TableCell><Badge className={typeCfg[tp.type].className}>{typeCfg[tp.type].icon} {typeCfg[tp.type].label}</Badge></TableCell>
                  <TableCell>{channelIcon[tp.channel]} {tp.channel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tp.trigger}</TableCell>
                  <TableCell>{tp.responsibleName}</TableCell>
                  <TableCell><Badge className={statusCfg[tp.status].className}>{statusCfg[tp.status].label}</Badge></TableCell>
                  <TableCell>
                    {tp.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs">✅</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs">⏭️</Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default ReguaRelacionamentoTab;
