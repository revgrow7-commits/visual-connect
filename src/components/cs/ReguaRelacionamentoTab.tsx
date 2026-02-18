import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Loader2 } from "lucide-react";
import { useCSTouchpoints, useCreateCSTouchpoint, useUpdateCSTouchpoint } from "@/hooks/useCSData";
import { mockTouchpoints } from "./mockData";
import { toast } from "sonner";

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
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ date: "", customer_name: "", type: "post_delivery_follow", channel: "phone", trigger_reason: "", responsible_name: "", notes: "" });

  const { data: dbTouchpoints, isLoading } = useCSTouchpoints();
  const createTp = useCreateCSTouchpoint();
  const updateTp = useUpdateCSTouchpoint();

  const touchpoints = dbTouchpoints && dbTouchpoints.length > 0 ? dbTouchpoints.map(t => ({
    id: t.id,
    date: t.date,
    customerName: t.customer_name,
    type: t.type,
    channel: t.channel,
    trigger: t.trigger_reason || "",
    status: t.status,
    responsibleName: t.responsible_name,
    notes: t.notes,
    _isDb: true,
  })) : mockTouchpoints;

  const isRealData = dbTouchpoints && dbTouchpoints.length > 0;

  const filtered = touchpoints.filter((t: any) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (typeFilter !== "all" && t.type !== typeFilter) return false;
    return true;
  }).sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const pending = touchpoints.filter((t: any) => t.status === "pending").length;
  const completed = touchpoints.filter((t: any) => t.status === "completed").length;

  const handleCreate = async () => {
    if (!form.customer_name || !form.date) { toast.error("Preencha cliente e data"); return; }
    try {
      await createTp.mutateAsync({
        date: new Date(form.date).toISOString(),
        customer_name: form.customer_name,
        type: form.type,
        channel: form.channel,
        trigger_reason: form.trigger_reason,
        responsible_name: form.responsible_name || "Não atribuído",
        notes: form.notes,
      });
      toast.success("Touchpoint criado!");
      setCreateOpen(false);
      setForm({ date: "", customer_name: "", type: "post_delivery_follow", channel: "phone", trigger_reason: "", responsible_name: "", notes: "" });
    } catch { toast.error("Erro ao criar touchpoint"); }
  };

  const handleAction = async (id: string, status: string, isDb: boolean) => {
    if (!isDb) { toast.info("Não é possível alterar dados mock"); return; }
    try {
      await updateTp.mutateAsync({ id, status });
      toast.success("Status atualizado!");
    } catch { toast.error("Erro ao atualizar"); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? "🟢 Dados reais" : "🟡 Dados mock (demo)"}
        </Badge>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Novo Touchpoint</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Touchpoint</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                <div><Label>Data *</Label><Input type="datetime-local" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nps_survey">Pesquisa NPS</SelectItem>
                      <SelectItem value="post_delivery_follow">Follow-up</SelectItem>
                      <SelectItem value="warranty_reminder">Lembrete Garantia</SelectItem>
                      <SelectItem value="reorder_nudge">Recompra</SelectItem>
                      <SelectItem value="churn_alert">Alerta Churn</SelectItem>
                      <SelectItem value="anniversary">Aniversário</SelectItem>
                      <SelectItem value="complaint_resolved_check">Check Resolução</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label>Canal</Label>
                  <Select value={form.channel} onValueChange={v => setForm(f => ({ ...f, channel: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="visit">Visita</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Responsável</Label><Input value={form.responsible_name} onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))} /></div>
              <div><Label>Motivo/Trigger</Label><Input value={form.trigger_reason} onChange={e => setForm(f => ({ ...f, trigger_reason: e.target.value }))} /></div>
              <div><Label>Notas</Label><Textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} /></div>
              <Button onClick={handleCreate} disabled={createTp.isPending} className="w-full">
                {createTp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar Touchpoint
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Pendentes</p><p className="text-2xl font-bold text-yellow-600">{pending}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Realizados (mês)</p><p className="text-2xl font-bold text-green-600">{completed}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Programados</p><p className="text-2xl font-bold">{touchpoints.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Taxa Execução</p><p className="text-2xl font-bold text-blue-600">{touchpoints.length > 0 ? Math.round((completed / touchpoints.length) * 100) : 0}%</p></CardContent></Card>
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
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhum touchpoint encontrado. Clique em "Novo Touchpoint" para adicionar.</TableCell></TableRow>
              ) : filtered.map((tp: any) => (
                <TableRow key={tp.id} className={tp.status === "pending" ? "bg-yellow-50/20" : ""}>
                  <TableCell className="whitespace-nowrap">{formatDate(tp.date)}</TableCell>
                  <TableCell className="font-medium">{tp.customerName}</TableCell>
                  <TableCell><Badge className={typeCfg[tp.type]?.className || ""}>{typeCfg[tp.type]?.icon || ""} {typeCfg[tp.type]?.label || tp.type}</Badge></TableCell>
                  <TableCell>{channelIcon[tp.channel] || ""} {tp.channel}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{tp.trigger}</TableCell>
                  <TableCell>{tp.responsibleName}</TableCell>
                  <TableCell><Badge className={statusCfg[tp.status]?.className || ""}>{statusCfg[tp.status]?.label || tp.status}</Badge></TableCell>
                  <TableCell>
                    {tp.status === "pending" && (
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAction(tp.id, "completed", tp._isDb)}>✅</Button>
                        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleAction(tp.id, "postponed", tp._isDb)}>⏭️</Button>
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
