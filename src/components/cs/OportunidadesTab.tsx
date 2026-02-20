import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Lightbulb, DollarSign, CheckCircle, Target, Search, Plus, Loader2,
  LayoutGrid, List, BarChart3, TrendingUp, Ticket,
} from "lucide-react";
import { useCSOpportunities, useCreateCSOpportunity, useUpdateCSOpportunity } from "@/hooks/useCSData";
import { opportunitiesService } from "@/services/holdprint";
import type { HoldprintBudget } from "@/services/holdprint/types";
import { mockOpportunities } from "./mockData";
import { toast } from "sonner";

// === Holdprint Budget Pipeline Config ===
const BUDGET_STATES: Record<number, string> = {
  0: "Aberto", 1: "Enviado", 2: "Em Negociação", 3: "Ganho", 4: "Perdido", 5: "Cancelado",
};
const STATE_COLORS: Record<number, string> = {
  0: "bg-blue-100 border-blue-300 text-blue-800",
  1: "bg-cyan-100 border-cyan-300 text-cyan-800",
  2: "bg-yellow-100 border-yellow-300 text-yellow-800",
  3: "bg-green-100 border-green-300 text-green-800",
  4: "bg-red-100 border-red-300 text-red-800",
  5: "bg-gray-100 border-gray-300 text-gray-800",
};

// === CS Opportunity Config ===
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

const fmt = (v: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getBudgetValue(b: HoldprintBudget): number {
  return b.proposes?.[0]?.totalPrice || 0;
}

const OportunidadesTab = () => {
  const [mainTab, setMainTab] = useState("pipeline");
  const [pipelineView, setPipelineView] = useState<"kanban" | "list">("kanban");
  const [pipelineSearch, setPipelineSearch] = useState("");

  // CS manual opportunities state
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ type: "upsell", customer_name: "", estimated_value: "", description: "", context: "", next_step: "", timing: "", responsible_name: "" });

  // Holdprint budgets
  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ["holdprint-budgets-cs"],
    queryFn: () => opportunitiesService.budgetsSearch({ skip: 0, take: 200, order: { createdAt: "DESC" } }),
  });

  // CS manual opportunities
  const { data: dbOpps, isLoading: oppsLoading } = useCSOpportunities();
  const createOpp = useCreateCSOpportunity();
  const updateOpp = useUpdateCSOpportunity();

  // === Pipeline (Holdprint) ===
  const allBudgets = (budgets?.data || []).filter(
    (b) => !pipelineSearch || (b.customerName || b.title || "").toLowerCase().includes(pipelineSearch.toLowerCase())
  );
  const pipelineTotal = allBudgets.reduce((acc, b) => acc + getBudgetValue(b), 0);
  const avgTicket = allBudgets.length > 0 ? pipelineTotal / allBudgets.length : 0;
  const wonCount = allBudgets.filter((b) => b.budgetState === 3).length;
  const conversionRate = allBudgets.length > 0 ? ((wonCount / allBudgets.length) * 100).toFixed(1) : "—";

  const stateGroups = Object.entries(BUDGET_STATES).map(([stateNum, label]) => {
    const state = Number(stateNum);
    const items = allBudgets.filter((b) => b.budgetState === state);
    return { state, label, items, total: items.reduce((a, b2) => a + getBudgetValue(b2), 0) };
  }).filter((g) => g.items.length > 0);

  // === CS Opportunities ===
  const opportunities = dbOpps && dbOpps.length > 0 ? dbOpps.map(o => ({
    id: o.id, type: o.type, customerName: o.customer_name, healthScore: o.health_score || 0,
    estimatedValue: Number(o.estimated_value) || 0, description: o.description,
    context: o.context || "", nextStep: o.next_step || "", timing: o.timing || "",
    status: o.status, createdDate: o.created_at, responsibleName: o.responsible_name,
    relatedJobCode: o.related_job_code, _isDb: true,
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
  const csTotal = active.reduce((sum: number, o: any) => sum + o.estimatedValue, 0);
  const converted = opportunities.filter((o: any) => o.status === "converted").length;

  const handleCreate = async () => {
    if (!form.customer_name || !form.description) { toast.error("Preencha cliente e descrição"); return; }
    try {
      await createOpp.mutateAsync({
        type: form.type, customer_name: form.customer_name,
        estimated_value: form.estimated_value ? parseFloat(form.estimated_value) : 0,
        description: form.description, context: form.context, next_step: form.next_step,
        timing: form.timing, responsible_name: form.responsible_name || "Não atribuído",
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
      {/* Main Tabs: Pipeline CRM vs CS Opportunities */}
      <Tabs value={mainTab} onValueChange={setMainTab}>
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="pipeline" className="gap-1"><Target className="h-4 w-4" /> Pipeline CRM</TabsTrigger>
            <TabsTrigger value="cs" className="gap-1"><Lightbulb className="h-4 w-4" /> Oportunidades CS</TabsTrigger>
          </TabsList>
          {mainTab === "cs" && (
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
          )}
        </div>

        {/* ========== PIPELINE CRM (Holdprint) ========== */}
        <TabsContent value="pipeline" className="space-y-6 mt-4">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><BarChart3 className="h-3 w-3" /> Orçamentos</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{allBudgets.length}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" /> Pipeline</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmt(pipelineTotal)}</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><TrendingUp className="h-3 w-3" /> Conversão</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{conversionRate}%</p></CardContent></Card>
            <Card><CardHeader className="pb-2"><CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1"><Ticket className="h-3 w-3" /> Ticket Médio</CardTitle></CardHeader><CardContent><p className="text-2xl font-bold">{fmt(avgTicket)}</p></CardContent></Card>
          </div>

          {/* Search + View Toggle */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente..." value={pipelineSearch} onChange={(e) => setPipelineSearch(e.target.value)} className="pl-9" />
            </div>
            <Tabs value={pipelineView} onValueChange={(v) => setPipelineView(v as "kanban" | "list")}>
              <TabsList>
                <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4 mr-1" /> Kanban</TabsTrigger>
                <TabsTrigger value="list"><List className="h-4 w-4 mr-1" /> Lista</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {budgetsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
          ) : pipelineView === "kanban" ? (
            <div className="flex gap-4 overflow-x-auto pb-4">
              {stateGroups.map((group) => {
                const colorClass = STATE_COLORS[group.state] || STATE_COLORS[0];
                return (
                  <div key={group.state} className="min-w-[260px] flex-shrink-0">
                    <div className={`rounded-t-lg border px-3 py-2 ${colorClass}`}>
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-sm">{group.label}</span>
                        <Badge variant="outline" className="text-xs">{group.items.length}</Badge>
                      </div>
                      <p className="text-xs mt-0.5 opacity-80">{fmt(group.total)}</p>
                    </div>
                    <div className="border border-t-0 rounded-b-lg bg-muted/30 p-2 space-y-2 min-h-[120px]">
                      {group.items.map((b) => (
                        <Card key={b.code} className="shadow-sm">
                          <CardContent className="p-3 space-y-1">
                            <p className="font-medium text-sm truncate">{b.customerName || b.title || "Cliente"}</p>
                            <p className="text-xs text-muted-foreground">{fmt(getBudgetValue(b))}</p>
                            <p className="text-[10px] text-muted-foreground">#{b.code}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                );
              })}
              {stateGroups.length === 0 && (
                <div className="text-center text-muted-foreground py-12 w-full">Nenhum orçamento encontrado</div>
              )}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Título / Cliente</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allBudgets.map((b) => (
                    <TableRow key={b.code}>
                      <TableCell className="font-mono text-xs">#{b.code}</TableCell>
                      <TableCell className="font-medium">{b.title || b.customerName || "—"}</TableCell>
                      <TableCell className="text-right">{fmt(getBudgetValue(b))}</TableCell>
                      <TableCell><Badge variant="outline">{BUDGET_STATES[b.budgetState ?? 0] || "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* ========== OPORTUNIDADES CS (Manual/Supabase) ========== */}
        <TabsContent value="cs" className="space-y-6 mt-4">
          <div className="flex items-center gap-2">
            <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
              {oppsLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? "🟢 Dados reais" : "🟡 Dados mock (demo)"}
            </Badge>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Oportunidades Ativas", value: String(active.length), icon: Lightbulb, bg: "bg-green-50", color: "text-green-600" },
              { label: "Valor Potencial", value: fmt(csTotal), icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
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
              <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">Nenhuma oportunidade encontrada.</CardContent></Card>
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
                    <p>💰 Valor estimado: <strong>{fmt(opp.estimatedValue)}</strong></p>
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
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OportunidadesTab;
