import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, FileText, MapPin, Search, Wrench } from "lucide-react";
import { mockVisits } from "./mockData";
import type { TechnicalVisit } from "./types";

const typeCfg: Record<string, { label: string; className: string }> = {
  preventive_maintenance: { label: "🔧 Preventiva", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  warranty_repair: { label: "🛡️ Garantia", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  acceptance_inspection: { label: "✅ Vistoria Aceite", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  relationship: { label: "🤝 Relacionamento", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
};

const statusCfg: Record<string, { label: string; className: string }> = {
  scheduled: { label: "📅 Agendada", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  completed: { label: "✅ Realizada", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  cancelled: { label: "❌ Cancelada", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  rescheduled: { label: "🔄 Reagendada", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
};

const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const formatDateTime = (d: string) => new Date(d).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });

const VisitasTecnicasTab = () => {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<TechnicalVisit | null>(null);

  const filtered = mockVisits.filter((v) => {
    if (typeFilter !== "all" && v.type !== typeFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.customerName.toLowerCase().includes(s) || v.description.toLowerCase().includes(s) || v.id.toLowerCase().includes(s);
    }
    return true;
  });

  const scheduled = mockVisits.filter((v) => v.status === "scheduled").length;
  const completed = mockVisits.filter((v) => v.status === "completed").length;
  const pendingReport = mockVisits.filter((v) => v.report_status === "pending").length;
  const nextVisit = mockVisits.filter((v) => v.status === "scheduled").sort((a, b) => new Date(a.scheduled_date).getTime() - new Date(b.scheduled_date).getTime())[0];

  const kpis = [
    { label: "Agendadas", value: String(scheduled), icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Realizadas (mês)", value: String(completed), icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
    { label: "Pendentes de Laudo", value: String(pendingReport), icon: FileText, bg: "bg-yellow-50", color: "text-yellow-600" },
    { label: "Próxima Visita", value: nextVisit ? `${formatDate(nextVisit.scheduled_date)} - ${nextVisit.customerName.split(" ")[0]}` : "—", icon: MapPin, bg: "bg-blue-50", color: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}>
                <k.icon className={`h-5 w-5 ${k.color}`} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{k.label}</p>
                <p className="text-sm font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="preventive_maintenance">Preventiva</SelectItem>
            <SelectItem value="warranty_repair">Garantia</SelectItem>
            <SelectItem value="acceptance_inspection">Vistoria Aceite</SelectItem>
            <SelectItem value="relationship">Relacionamento</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="scheduled">Agendada</SelectItem>
            <SelectItem value="completed">Realizada</SelectItem>
            <SelectItem value="cancelled">Cancelada</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <Card>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Técnico</TableHead>
                <TableHead>Job</TableHead>
                <TableHead>Recl.</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Laudo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((v) => (
                <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(v)}>
                  <TableCell className="font-bold">{v.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(v.scheduled_date)}</TableCell>
                  <TableCell>{v.customerName}</TableCell>
                  <TableCell><Badge className={typeCfg[v.type].className}>{typeCfg[v.type].label}</Badge></TableCell>
                  <TableCell>{v.technicianName}</TableCell>
                  <TableCell>{v.jobCode ? `#${v.jobCode}` : "—"}</TableCell>
                  <TableCell>{v.complaintId || "—"}</TableCell>
                  <TableCell><Badge className={statusCfg[v.status].className}>{statusCfg[v.status].label}</Badge></TableCell>
                  <TableCell>{v.report_status === "submitted" ? "✅" : v.report_status === "pending" ? "⏳" : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>{selected.id} — {selected.customerName}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge className={typeCfg[selected.type].className}>{typeCfg[selected.type].label}</Badge>
                  <Badge className={statusCfg[selected.status].className}>{statusCfg[selected.status].label}</Badge>
                </div>
                <Separator />
                <div className="text-sm space-y-2">
                  <p><strong>Data/Hora:</strong> {formatDateTime(selected.scheduled_date)}</p>
                  <p><strong>Endereço:</strong> {selected.customerAddress}</p>
                  <p><strong>Técnico:</strong> {selected.technicianName}</p>
                  {selected.jobCode && <p><strong>Job:</strong> #{selected.jobCode}</p>}
                  {selected.complaintId && <p><strong>Reclamação:</strong> {selected.complaintId}</p>}
                  {selected.duration_minutes && <p><strong>Duração:</strong> {selected.duration_minutes} minutos</p>}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selected.description}</p>
                </div>
                {selected.report_notes && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Laudo Técnico</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded">{selected.report_notes}</p>
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
};

export default VisitasTecnicasTab;
