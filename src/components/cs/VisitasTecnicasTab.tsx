import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Calendar, CheckCircle, FileText, MapPin, Search, Wrench, Plus, Loader2 } from "lucide-react";
import { useCSVisitas, useCreateCSVisita } from "@/hooks/useCSData";
import { mockVisits } from "./mockData";
import { toast } from "sonner";

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
  const [selected, setSelected] = useState<any | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ scheduled_date: "", customer_name: "", customer_address: "", type: "preventive_maintenance", description: "", technician_name: "", job_code: "" });

  const { data: dbVisitas, isLoading } = useCSVisitas();
  const createVisita = useCreateCSVisita();

  const visits = dbVisitas && dbVisitas.length > 0 ? dbVisitas.map(v => ({
    id: v.code,
    scheduled_date: v.scheduled_date,
    customerName: v.customer_name,
    customerAddress: v.customer_address || "",
    type: v.type,
    description: v.description,
    technicianName: v.technician_name,
    jobCode: v.job_code,
    complaintId: v.complaint_id,
    status: v.status,
    report_status: v.report_status,
    report_notes: v.report_notes,
    duration_minutes: v.duration_minutes,
  })) : mockVisits;

  const isRealData = dbVisitas && dbVisitas.length > 0;

  const filtered = visits.filter((v: any) => {
    if (typeFilter !== "all" && v.type !== typeFilter) return false;
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return v.customerName.toLowerCase().includes(s) || v.description.toLowerCase().includes(s) || v.id?.toLowerCase().includes(s);
    }
    return true;
  });

  const scheduled = visits.filter((v: any) => v.status === "scheduled").length;
  const completed = visits.filter((v: any) => v.status === "completed").length;
  const pendingReport = visits.filter((v: any) => v.report_status === "pending").length;

  const handleCreate = async () => {
    if (!form.customer_name || !form.scheduled_date) { toast.error("Preencha cliente e data"); return; }
    try {
      await createVisita.mutateAsync({
        scheduled_date: new Date(form.scheduled_date).toISOString(),
        customer_name: form.customer_name,
        customer_address: form.customer_address,
        type: form.type,
        description: form.description,
        technician_name: form.technician_name || "Não atribuído",
        job_code: form.job_code ? parseInt(form.job_code) : undefined,
      });
      toast.success("Visita agendada!");
      setCreateOpen(false);
      setForm({ scheduled_date: "", customer_name: "", customer_address: "", type: "preventive_maintenance", description: "", technician_name: "", job_code: "" });
    } catch { toast.error("Erro ao criar visita"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? "🟢 Dados reais" : "🟡 Dados mock (demo)"}
        </Badge>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Visita</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Agendar Visita Técnica</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                <div><Label>Data/Hora *</Label><Input type="datetime-local" value={form.scheduled_date} onChange={e => setForm(f => ({ ...f, scheduled_date: e.target.value }))} /></div>
              </div>
              <div><Label>Endereço</Label><Input value={form.customer_address} onChange={e => setForm(f => ({ ...f, customer_address: e.target.value }))} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="preventive_maintenance">Preventiva</SelectItem>
                      <SelectItem value="warranty_repair">Garantia</SelectItem>
                      <SelectItem value="acceptance_inspection">Vistoria Aceite</SelectItem>
                      <SelectItem value="relationship">Relacionamento</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Técnico</Label><Input value={form.technician_name} onChange={e => setForm(f => ({ ...f, technician_name: e.target.value }))} /></div>
              </div>
              <div><Label>Job Code</Label><Input value={form.job_code} onChange={e => setForm(f => ({ ...f, job_code: e.target.value }))} placeholder="Opcional" /></div>
              <div><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <Button onClick={handleCreate} disabled={createVisita.isPending} className="w-full">
                {createVisita.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Agendar Visita
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Agendadas", value: String(scheduled), icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Realizadas (mês)", value: String(completed), icon: CheckCircle, bg: "bg-green-50", color: "text-green-600" },
          { label: "Pendentes de Laudo", value: String(pendingReport), icon: FileText, bg: "bg-yellow-50", color: "text-yellow-600" },
          { label: "Total", value: String(visits.length), icon: MapPin, bg: "bg-blue-50", color: "text-blue-600" },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div><div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-sm font-bold">{k.value}</p></div></CardContent></Card>
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
                <TableHead>Status</TableHead>
                <TableHead>Laudo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma visita encontrada. Clique em "Nova Visita" para agendar.</TableCell></TableRow>
              ) : filtered.map((v: any) => (
                <TableRow key={v.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(v)}>
                  <TableCell className="font-bold">{v.id}</TableCell>
                  <TableCell className="whitespace-nowrap">{formatDateTime(v.scheduled_date)}</TableCell>
                  <TableCell>{v.customerName}</TableCell>
                  <TableCell><Badge className={typeCfg[v.type]?.className || ""}>{typeCfg[v.type]?.label || v.type}</Badge></TableCell>
                  <TableCell>{v.technicianName}</TableCell>
                  <TableCell>{v.jobCode ? `#${v.jobCode}` : "—"}</TableCell>
                  <TableCell><Badge className={statusCfg[v.status]?.className || ""}>{statusCfg[v.status]?.label || v.status}</Badge></TableCell>
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
                  <Badge className={typeCfg[selected.type]?.className || ""}>{typeCfg[selected.type]?.label || selected.type}</Badge>
                  <Badge className={statusCfg[selected.status]?.className || ""}>{statusCfg[selected.status]?.label || selected.status}</Badge>
                </div>
                <Separator />
                <div className="text-sm space-y-2">
                  <p><strong>Data/Hora:</strong> {formatDateTime(selected.scheduled_date)}</p>
                  <p><strong>Endereço:</strong> {selected.customerAddress || "—"}</p>
                  <p><strong>Técnico:</strong> {selected.technicianName}</p>
                  {selected.jobCode && <p><strong>Job:</strong> #{selected.jobCode}</p>}
                  {selected.duration_minutes && <p><strong>Duração:</strong> {selected.duration_minutes} minutos</p>}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">Descrição</h4>
                  <p className="text-sm text-muted-foreground">{selected.description || "—"}</p>
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
