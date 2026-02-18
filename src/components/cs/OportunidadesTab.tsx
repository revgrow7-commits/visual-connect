import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Lightbulb, DollarSign, CheckCircle, Target, Search, Plus, Loader2 } from "lucide-react";
import { useCSOpportunities, useCreateCSOpportunity, useUpdateCSOpportunity } from "@/hooks/useCSData";
import { mockOpportunities } from "./mockData";
import { toast } from "sonner";

const typeCfg: Record<string, { label: string; className: string }> = {
  upsell: { label: "💎 Upsell", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  cross_sell: { label: "🔀 Cross-sell", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  reorder: { label: "🔄 Recompra", className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100" },
  maintenance_contract: { label: "🔧 Contrato Manutenção", className: "bg-purple-100 text-purple-800 hover:bg-purple-100" },
  warranty_renewal: { label: "🛡️ Renovação Garantia", className: "bg-orange-100 text-orange-800 hover:bg-orange-100" },
  referral: { label: "🤝 Indicação", className: "bg-pink-100 text-pink-800 hover:bg-pink-100" },
};

const borderColors: Record<string, string> = {
  upsell: "border-l-4 border-l-green-500", cross_sell: "border-l-4 border-l-blue-500",
  reorder: "border-l-4 border-l-cyan-500", maintenance_contract: "border-l-4 border-l-purple-500",
  warranty_renewal: "border-l-4 border-l-orange-500", referral: "border-l-4 border-l-pink-500",
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const OportunidadesTab = () => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ type: "upsell", customer_name: "", estimated_value: "", description: "", context: "", next_step: "", timing: "", responsible_name: "" });

  const { data: dbOpps, isLoading } = useCSOpportunities();
  const createOpp = useCreateCSOpportunity();
  const updateOpp = useUpdateCSOpportunity();

  const opportunities = dbOpps && dbOpps.length > 0 ? dbOpps.map(o => ({
    id: o.id,
    type: o.type,
    customerName: o.customer_name,
    healthScore: o.health_score || 0,
    estimatedValue: Number(o.estimated_value) || 0,
    description: o.description,
    context: o.context || "",
    nextStep: o.next_step || "",
    timing: o.timing || "",
    status: o.status,
    createdDate: o.created_at,
    responsibleName: o.responsible_name,
    relatedJobCode: o.related_job_code,
    _isDb: true,
  })) : mockOpportunities;

  const isRealData = dbOpps && dbOpps.length > 0;

  const filtered = opportunities.filter((o: any) => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.customerName.toLowerCase().includes(s) || o.description.toLowerCase().includes(s);
    }
    return true;
  });

  const active = opportunities.filter((o: any) => o.status === "active");
  const totalValue = active.reduce((sum: number, o: any) => sum + o.estimatedValue, 0);
  const converted = opportunities.filter((o: any) => o.status === "converted").length;

  const handleCreate = async () => {
    if (!form.customer_name || !form.description) { toast.error("Preencha cliente e descrição"); return; }
    try {
      await createOpp.mutateAsync({
        type: form.type,
        customer_name: form.customer_name,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
        description: form.description,
        context: form.context,
        next_step: form.next_step,
        timing: form.timing,
        responsible_name: form.responsible_name || "Não atribuído",
      });
      toast.success("Oportunidade criada!");
      setCreateOpen(false);
      setForm({ type: "upsell", customer_name: "", estimated_value: "", description: "", context: "", next_step: "", timing: "", responsible_name: "" });
    } catch { toast.error("Erro ao criar oportunidade"); }
  };

  const handleStatusChange = async (id: string, status: string, isDb: boolean) => {
    if (!isDb) { toast.info("Não é possível alterar dados mock"); return; }
    try {
      await updateOpp.mutateAsync({ id, status });
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
            <Button size="sm" className="gap-1"><Plus className="h-4 w-4" /> Nova Oportunidade</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Oportunidade</DialogTitle></DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Cliente *</Label><Input value={form.customer_name} onChange={e => setForm(f => ({ ...f, customer_name: e.target.value }))} /></div>
                <div><Label>Tipo</Label>
                  <Select value={form.type} onValueChange={v => setForm(f => ({ ...f, type: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="upsell">Upsell</SelectItem>
                      <SelectItem value="cross_sell">Cross-sell</SelectItem>
                      <SelectItem value="reorder">Recompra</SelectItem>
                      <SelectItem value="maintenance_contract">Contrato Manutenção</SelectItem>
                      <SelectItem value="warranty_renewal">Renovação Garantia</SelectItem>
                      <SelectItem value="referral">Indicação</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Valor Estimado (R$)</Label><Input type="number" value={form.estimated_value} onChange={e => setForm(f => ({ ...f, estimated_value: e.target.value }))} /></div>
                <div><Label>Responsável</Label><Input value={form.responsible_name} onChange={e => setForm(f => ({ ...f, responsible_name: e.target.value }))} /></div>
              </div>
              <div><Label>Descrição *</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
              <div><Label>Contexto</Label><Textarea value={form.context} onChange={e => setForm(f => ({ ...f, context: e.target.value }))} rows={2} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><Label>Próximo Passo</Label><Input value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} /></div>
                <div><Label>Timing</Label><Input value={form.timing} onChange={e => setForm(f => ({ ...f, timing: e.target.value }))} placeholder="Ex: Março 2026" /></div>
              </div>
              <Button onClick={handleCreate} disabled={createOpp.isPending} className="w-full">
                {createOpp.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}Criar Oportunidade
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Oportunidades Ativas", value: String(active.length), icon: Lightbulb, bg: "bg-green-50", color: "text-green-600" },
          { label: "Valor Potencial", value: formatCurrency(totalValue), icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
          { label: "Convertidas (mês)", value: String(converted), icon: CheckCircle, bg: "bg-blue-50", color: "text-blue-600" },
          { label: "Taxa Conversão", value: `${opportunities.length > 0 ? Math.round((converted / opportunities.length) * 100) : 0}%`, icon: Target, bg: "bg-muted", color: "text-muted-foreground" },
        ].map((k) => (
          <Card key={k.label}><CardContent className="p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div><div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div></CardContent></Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="upsell">Upsell</SelectItem>
            <SelectItem value="cross_sell">Cross-sell</SelectItem>
            <SelectItem value="reorder">Recompra</SelectItem>
            <SelectItem value="maintenance_contract">Contrato Manutenção</SelectItem>
            <SelectItem value="warranty_renewal">Renovação Garantia</SelectItem>
            <SelectItem value="referral">Indicação</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativa</SelectItem>
            <SelectItem value="converted">Convertida</SelectItem>
            <SelectItem value="postponed">Adiada</SelectItem>
            <SelectItem value="discarded">Descartada</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, descrição..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma oportunidade encontrada. Clique em "Nova Oportunidade" para adicionar.</CardContent></Card>
        ) : filtered.map((opp: any) => (
          <Card key={opp.id} className={`${borderColors[opp.type] || ""} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge className={typeCfg[opp.type]?.className || ""}>{typeCfg[opp.type]?.label || opp.type}</Badge>
                  <h4 className="font-semibold text-sm mt-1">{opp.description}</h4>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{opp.status === "active" ? "🟢" : opp.status === "converted" ? "✅" : "⏸️"}</Badge>
              </div>
              <div className="text-sm space-y-1">
                <p>👤 <strong>{opp.customerName}</strong></p>
                <p>💰 Valor estimado: <strong>{formatCurrency(opp.estimatedValue)}</strong></p>
                {opp.timing && <p>📅 Timing: {opp.timing}</p>}
              </div>
              {opp.context && <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded"><p><strong>Contexto:</strong> {opp.context}</p></div>}
              {opp.nextStep && <div className="text-xs p-2 bg-blue-50/50 rounded"><p>🎯 <strong>Próximo passo:</strong> {opp.nextStep}</p></div>}
              <div className="text-xs text-muted-foreground">Responsável: {opp.responsibleName}</div>
              {opp.status === "active" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" className="h-7 text-xs" onClick={() => handleStatusChange(opp.id, "converted", opp._isDb)}>✅ Converter</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => handleStatusChange(opp.id, "postponed", opp._isDb)}>⏭️ Adiar</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600" onClick={() => handleStatusChange(opp.id, "discarded", opp._isDb)}>❌ Descartar</Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default OportunidadesTab;
