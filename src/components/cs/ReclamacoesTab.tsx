import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Loader, CheckCircle, Clock, Search } from "lucide-react";
import { mockComplaints } from "./mockData";
import type { Complaint } from "./types";

const statusCfg: Record<string, { label: string; className: string }> = {
  open: { label: "🔴 Aberta", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  in_progress: { label: "🟡 Em Andamento", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  resolved: { label: "🟢 Resolvida", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "⚪ Cancelada", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const categoryCfg: Record<string, { label: string; className: string }> = {
  delivery_delay: { label: "⏰ Atraso Entrega", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  production_defect: { label: "🔧 Defeito Produção", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  budget_divergence: { label: "💰 Divergência Orçado", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  installation: { label: "🔨 Instalação", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  other: { label: "📋 Outros", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const priorityCfg: Record<string, { label: string; className: string }> = {
  critical: { label: "Crítica", className: "bg-red-600 text-white hover:bg-red-600" },
  high: { label: "Alta", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  medium: { label: "Média", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  low: { label: "Baixa", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");

const ReclamacoesTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [selected, setSelected] = useState<Complaint | null>(null);

  const filtered = mockComplaints.filter((c) => {
    if (statusFilter !== "all" && c.status !== statusFilter) return false;
    if (categoryFilter !== "all" && c.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.customerName.toLowerCase().includes(s) || c.description.toLowerCase().includes(s) || String(c.jobCode).includes(s) || c.id.toLowerCase().includes(s);
    }
    return true;
  });

  const kpis = [
    { label: "Abertas", value: "4", icon: AlertCircle, bg: "bg-red-50", color: "text-red-600" },
    { label: "Em Andamento", value: "2", icon: Loader, bg: "bg-yellow-50", color: "text-yellow-600" },
    { label: "Resolvidas (mês)", value: "8", icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
    { label: "Tempo Médio Resolução", value: "2,3 dias", icon: Clock, bg: "bg-muted", color: "text-muted-foreground" },
  ];

  const getDaysOpen = (date: string, resolved: string | null) => {
    const end = resolved ? new Date(resolved) : new Date();
    return Math.ceil((end.getTime() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
  };

  return (
    <div ref={ref} className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <div className="w-44">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="open">Aberta</SelectItem>
              <SelectItem value="in_progress">Em Andamento</SelectItem>
              <SelectItem value="resolved">Resolvida</SelectItem>
              <SelectItem value="cancelled">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger><SelectValue placeholder="Categoria" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="delivery_delay">Atraso Entrega</SelectItem>
              <SelectItem value="production_defect">Defeito Produção</SelectItem>
              <SelectItem value="budget_divergence">Divergência Orçado</SelectItem>
              <SelectItem value="installation">Instalação</SelectItem>
              <SelectItem value="other">Outros</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, job, descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Prioridade</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Dias</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => {
                const days = getDaysOpen(c.date, c.resolvedDate);
                return (
                  <TableRow key={c.id} className={`cursor-pointer hover:bg-muted/50 ${c.status === "open" ? "bg-red-50/30" : ""}`} onClick={() => setSelected(c)}>
                    <TableCell className="font-bold">{c.id}</TableCell>
                    <TableCell>{formatDate(c.date)}</TableCell>
                    <TableCell>{c.customerName}</TableCell>
                    <TableCell className="font-medium">#{c.jobCode}</TableCell>
                    <TableCell><Badge className={categoryCfg[c.category].className}>{categoryCfg[c.category].label}</Badge></TableCell>
                    <TableCell><Badge className={priorityCfg[c.priority].className}>{priorityCfg[c.priority].label}</Badge></TableCell>
                    <TableCell><Badge className={statusCfg[c.status].className}>{statusCfg[c.status].label}</Badge></TableCell>
                    <TableCell>{c.responsibleName}</TableCell>
                    <TableCell className={days > 5 && !c.resolvedDate ? "text-red-600 font-bold" : ""}>{days}d</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.id} — {selected.customerName}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusCfg[selected.status].className}>{statusCfg[selected.status].label}</Badge>
                  <Badge className={categoryCfg[selected.category].className}>{categoryCfg[selected.category].label}</Badge>
                  <Badge className={priorityCfg[selected.priority].className}>{priorityCfg[selected.priority].label}</Badge>
                </div>
                <Separator />
                <div className="text-sm space-y-2">
                  <p><strong>Data:</strong> {formatDate(selected.date)}</p>
                  <p><strong>Job:</strong> #{selected.jobCode} — {selected.jobTitle}</p>
                  <p><strong>Cliente:</strong> {selected.customerName} ({selected.customerDocument})</p>
                  <p><strong>Responsável:</strong> {selected.responsibleName}</p>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
                {selected.resolution && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Resolução</h4>
                      <p className="text-sm text-green-700">{selected.resolution}</p>
                      {selected.resolvedDate && <p className="text-xs text-muted-foreground mt-1">Resolvida em: {formatDate(selected.resolvedDate)}</p>}
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
