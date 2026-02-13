import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader, CheckCircle, Clock, Search, AlertOctagon, Phone } from "lucide-react";
import { mockComplaintsWithSLA } from "./mockData";
import type { ComplaintWithSLA } from "./types";

const statusCfg: Record<string, { label: string; className: string }> = {
  open: { label: "🔴 Aberta", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  in_progress: { label: "🟡 Em Andamento", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  resolved: { label: "🟢 Resolvida", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "⚪ Cancelada", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const categoryCfg: Record<string, { label: string; className: string }> = {
  delivery_delay: { label: "⏰ Atraso", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  production_defect: { label: "🔧 Defeito", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  budget_divergence: { label: "💰 Divergência", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  installation: { label: "🔨 Instalação", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  other: { label: "📋 Outros", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const priorityIcon: Record<string, string> = { critical: "🔴", high: "🟠", medium: "🟡", low: "⚪" };

const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const ReclamacoesTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<ComplaintWithSLA | null>(null);

  const filtered = mockComplaintsWithSLA.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.customerName.toLowerCase().includes(s) || c.description.toLowerCase().includes(s) || c.id.toLowerCase().includes(s);
    }
    return true;
  });

  const openCount = mockComplaintsWithSLA.filter((c) => c.status === "open" || c.status === "in_progress").length;
  const slaOk = mockComplaintsWithSLA.filter((c) => !c.sla.resolutionBreached && !c.sla.responseBreached).length;
  const slaBreached = mockComplaintsWithSLA.filter((c) => c.sla.resolutionBreached || c.sla.responseBreached).length;

  const kpis = [
    { label: "Total Abertas", value: String(openCount), icon: AlertCircle, bg: "bg-red-50", color: "text-red-600" },
    { label: "SLA No Prazo", value: String(slaOk), icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
    { label: "SLA Estourado", value: String(slaBreached), icon: AlertOctagon, bg: "bg-red-50", color: "text-red-600", pulse: slaBreached > 0 },
    { label: "Tempo Médio Resposta", value: "3,2h", icon: Clock, bg: "bg-muted", color: "text-muted-foreground" },
    { label: "Tempo Médio Resolução", value: "2,3 dias", icon: Clock, bg: "bg-muted", color: "text-muted-foreground" },
    { label: "% Resolução 1° Contato", value: "35%", icon: Phone, bg: "bg-blue-50", color: "text-blue-600" },
  ];

  return (
    <div ref={ref} className="space-y-6">
      {/* SLA Reference */}
      <Card className="border-blue-200 bg-blue-50/30">
        <CardContent className="p-4">
          <h4 className="font-semibold text-sm mb-2">📏 Tabela de SLA por Prioridade</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-muted-foreground">
            <span>🔴 Crítica: Resposta 2h | Resolução 24h</span>
            <span>🟠 Alta: Resposta 4h | Resolução 48h</span>
            <span>🟡 Média: Resposta 8h | Resolução 5 dias</span>
            <span>⚪ Baixa: Resposta 24h | Resolução 10 dias</span>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-3 flex items-center gap-2">
              <div className={`h-8 w-8 rounded-lg ${k.bg} flex items-center justify-center ${(k as any).pulse ? "animate-pulse" : ""}`}>
                <k.icon className={`h-4 w-4 ${k.color}`} />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground leading-tight">{k.label}</p>
                <p className="text-sm font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="open">Aberta</SelectItem>
            <SelectItem value="in_progress">Em Andamento</SelectItem>
            <SelectItem value="resolved">Resolvida</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Categoria" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="delivery_delay">Atraso</SelectItem>
            <SelectItem value="production_defect">Defeito</SelectItem>
            <SelectItem value="budget_divergence">Divergência</SelectItem>
            <SelectItem value="installation">Instalação</SelectItem>
            <SelectItem value="other">Outros</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, job, descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Prior.</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>SLA Resp.</TableHead>
                <TableHead>SLA Resol.</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead>Responsável</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.sla.resolutionBreached ? "bg-red-50/40" : ""}`} onClick={() => setSelected(c)}>
                  <TableCell className="font-bold">{c.id}</TableCell>
                  <TableCell>{priorityIcon[c.priority]} {c.priority}</TableCell>
                  <TableCell className="whitespace-nowrap text-xs">{formatDateTime(c.date)}</TableCell>
                  <TableCell>{c.customerName}</TableCell>
                  <TableCell className="font-medium">#{c.jobCode}</TableCell>
                  <TableCell><Badge className={categoryCfg[c.category].className}>{categoryCfg[c.category].label}</Badge></TableCell>
                  <TableCell><Badge className={statusCfg[c.status].className}>{statusCfg[c.status].label}</Badge></TableCell>
                  <TableCell>{c.sla.responseBreached ? <span className="text-red-600 font-bold text-xs">❌ Estourado</span> : c.sla.responseActual ? <span className="text-green-600 text-xs">✅ OK</span> : <span className="text-yellow-600 text-xs">⏳</span>}</TableCell>
                  <TableCell>{c.sla.resolutionBreached ? <span className="text-red-600 font-bold text-xs">❌ Estourado</span> : c.sla.resolutionActual ? <span className="text-green-600 text-xs">✅ OK</span> : <span className="text-yellow-600 text-xs">⏳</span>}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{c.escalationLevel}</Badge></TableCell>
                  <TableCell>{c.responsibleName}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.id} — {selected.customerName}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusCfg[selected.status].className}>{statusCfg[selected.status].label}</Badge>
                  <Badge className={categoryCfg[selected.category].className}>{categoryCfg[selected.category].label}</Badge>
                  <Badge variant="outline">{priorityIcon[selected.priority]} {selected.priority}</Badge>
                  <Badge variant="outline">Nível: {selected.escalationLevel}</Badge>
                </div>
                <Separator />
                <div className="text-sm space-y-1">
                  <p><strong>Data:</strong> {formatDateTime(selected.date)}</p>
                  <p><strong>Job:</strong> #{selected.jobCode} — {selected.jobTitle}</p>
                  <p><strong>Responsável:</strong> {selected.responsibleName}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">SLA</h4>
                  <div className="text-sm space-y-1">
                    <p>Resposta: {selected.sla.responseBreached ? "❌ Estourado" : selected.sla.responseActual ? "✅ Dentro do prazo" : "⏳ Pendente"} — Prazo: {formatDateTime(selected.sla.responseDeadline)}{selected.sla.responseActual ? ` — Respondido: ${formatDateTime(selected.sla.responseActual)}` : ""}</p>
                    <p>Resolução: {selected.sla.resolutionBreached ? "❌ Estourado" : selected.sla.resolutionActual ? "✅ Dentro do prazo" : "⏳ Pendente"} — Prazo: {formatDateTime(selected.sla.resolutionDeadline)}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-3">Timeline de Escalonamento</h4>
                  <div className="space-y-3">
                    {selected.escalationHistory.map((e, i) => (
                      <div key={i} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${i === selected.escalationHistory.length - 1 && selected.sla.resolutionBreached ? "bg-red-500" : "bg-blue-500"}`}>{e.level}</div>
                          {i < selected.escalationHistory.length - 1 && <div className="w-0.5 h-8 bg-muted" />}
                        </div>
                        <div className="text-sm">
                          <p className="font-medium">{e.person}</p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(e.date)}</p>
                          <p className="text-xs text-muted-foreground">{e.reason}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {selected.resolution && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Resolução</h4>
                      <p className="text-sm text-green-700">{selected.resolution}</p>
                    </div>
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

ReclamacoesTab.displayName = "ReclamacoesTab";
export default ReclamacoesTab;
