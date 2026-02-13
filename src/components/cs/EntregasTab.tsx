import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, ThumbsUp, ThumbsDown, Hourglass, Search, Shield, Clock, Calendar, Wrench, Star } from "lucide-react";
import { mockDeliveries, mockWarranties } from "./mockData";
import type { Delivery, WarrantyRecord } from "./types";

const statusConfig = {
  on_time: { label: "✅ No Prazo", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  slight_delay: { label: "⚠️ Leve Atraso", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  late: { label: "❌ Atrasado", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  awaiting_acceptance: { label: "⏳ Aguardando", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
};

const warrantyStatusCfg: Record<string, { label: string; className: string }> = {
  active: { label: "🟢 Ativa", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  expiring_30: { label: "🟡 Expirando 30d", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  expiring_90: { label: "🔵 Expirando 90d", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  expired: { label: "⚪ Expirada", className: "bg-muted text-muted-foreground hover:bg-muted" },
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const renderStars = (n: number) => "⭐".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

const EntregasTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<Delivery | null>(null);
  const [warrantySearch, setWarrantySearch] = useState("");
  const [warrantyStatusFilter, setWarrantyStatusFilter] = useState("all");

  const filteredDeliveries = mockDeliveries.filter((d) => {
    if (statusFilter !== "all" && d.deliveryStatus !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.job.title.toLowerCase().includes(s) || d.job.customerName.toLowerCase().includes(s) || String(d.job.code).includes(s);
    }
    return true;
  });

  const filteredWarranties = mockWarranties.filter((w) => {
    if (warrantyStatusFilter !== "all" && w.status !== warrantyStatusFilter) return false;
    if (warrantySearch) {
      const s = warrantySearch.toLowerCase();
      return w.customerName.toLowerCase().includes(s) || w.product.toLowerCase().includes(s) || String(w.jobCode).includes(s);
    }
    return true;
  });

  const activeWarranties = mockWarranties.filter((w) => w.status === "active").length;
  const expiring30 = mockWarranties.filter((w) => w.status === "expiring_30").length;
  const expiring90 = mockWarranties.filter((w) => w.status === "expiring_90").length;
  const serviceCallsTotal = mockWarranties.reduce((s, w) => s + w.serviceCalls, 0);

  return (
    <div ref={ref} className="space-y-6">
      <Tabs defaultValue="deliveries">
        <TabsList>
          <TabsTrigger value="deliveries" className="gap-1.5"><Truck className="h-4 w-4" /> Entregas</TabsTrigger>
          <TabsTrigger value="warranties" className="gap-1.5"><Shield className="h-4 w-4" /> Garantias</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Entregas (mês)", value: "18", icon: Truck, bg: "bg-muted", color: "text-muted-foreground" },
              { label: "Dentro do Prazo", value: "14", icon: ThumbsUp, bg: "bg-green-50", color: "text-green-600" },
              { label: "Fora do Prazo", value: "3", icon: ThumbsDown, bg: "bg-red-50", color: "text-red-600" },
              { label: "Aguardando Aceite", value: "1", icon: Hourglass, bg: "bg-yellow-50", color: "text-yellow-600" },
            ].map((k) => (
              <Card key={k.label}><CardContent className="p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div><div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div></CardContent></Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="on_time">No Prazo</SelectItem>
                <SelectItem value="slight_delay">Leve Atraso</SelectItem>
                <SelectItem value="late">Atrasado</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por job, cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Entrega</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Valor</TableHead>
                    <TableHead>Satisfação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.map((d) => (
                    <TableRow key={d.job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(d)}>
                      <TableCell className="font-bold">#{d.job.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.job.title}</TableCell>
                      <TableCell>{d.job.customerName}</TableCell>
                      <TableCell>{d.job.deliveryDate ? formatDate(d.job.deliveryDate) : "—"}</TableCell>
                      <TableCell>{formatDate(d.job.deliveryNeeded)}</TableCell>
                      <TableCell><Badge className={statusConfig[d.deliveryStatus].className}>{statusConfig[d.deliveryStatus].label}</Badge></TableCell>
                      <TableCell className="text-right">{formatCurrency(d.job.totalPrice)}</TableCell>
                      <TableCell>{renderStars(d.satisfaction.overall)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="warranties" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Garantias Ativas", value: String(activeWarranties), icon: Shield, bg: "bg-green-50", color: "text-green-600" },
              { label: "Expirando em 30d", value: String(expiring30), icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
              { label: "Expirando em 90d", value: String(expiring90), icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Chamados em Garantia", value: String(serviceCallsTotal), icon: Wrench, bg: "bg-red-50", color: "text-red-600" },
            ].map((k) => (
              <Card key={k.label}><CardContent className="p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div><div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div></CardContent></Card>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <Select value={warrantyStatusFilter} onValueChange={setWarrantyStatusFilter}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="active">Ativas</SelectItem>
                <SelectItem value="expiring_30">Expirando 30d</SelectItem>
                <SelectItem value="expiring_90">Expirando 90d</SelectItem>
                <SelectItem value="expired">Expiradas</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por cliente, produto..." value={warrantySearch} onChange={(e) => setWarrantySearch(e.target.value)} className="pl-9" />
            </div>
          </div>

          <Card>
            <div className="overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Produto</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Início</TableHead>
                    <TableHead>Vencimento</TableHead>
                    <TableHead>Dias Rest.</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Chamados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredWarranties.map((w) => (
                    <TableRow key={w.jobCode} className="hover:bg-muted/50">
                      <TableCell className="font-bold">#{w.jobCode}</TableCell>
                      <TableCell>{w.customerName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{w.product}</TableCell>
                      <TableCell className="text-xs">{w.type}</TableCell>
                      <TableCell>{formatDate(w.startDate)}</TableCell>
                      <TableCell className={w.daysRemaining < 30 ? "text-red-600 font-bold" : ""}>{formatDate(w.endDate)}</TableCell>
                      <TableCell className={w.daysRemaining < 30 ? "text-red-600 font-bold" : w.daysRemaining < 90 ? "text-yellow-600" : ""}>{w.daysRemaining}</TableCell>
                      <TableCell><Badge className={warrantyStatusCfg[w.status]?.className || ""}>{warrantyStatusCfg[w.status]?.label || w.status}</Badge></TableCell>
                      <TableCell className={w.serviceCalls > 0 ? "text-red-600 font-bold" : ""}>{w.serviceCalls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Delivery Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>Job #{selected.job.code} — {selected.job.customerName}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div>
                  <h4 className="font-semibold text-sm mb-2">👤 Cliente</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{selected.job.customerName}</p>
                    <p>CNPJ: {selected.job.customerDocument}</p>
                    <p>Contato: {selected.job.customerContact} • {selected.job.customerPhone}</p>
                    <p>Email: {selected.job.customerEmail}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">📦 Entrega</h4>
                  <div className="text-sm space-y-1">
                    <p>Prazo: {formatDate(selected.job.deliveryNeeded)} | Entregue: {selected.job.deliveryDate ? formatDate(selected.job.deliveryDate) : "Pendente"}</p>
                    <p>Status: <Badge className={statusConfig[selected.deliveryStatus].className}>{statusConfig[selected.deliveryStatus].label}</Badge> ({selected.daysVariance > 0 ? `+${selected.daysVariance}d` : `${selected.daysVariance}d`})</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">🛡️ Garantia</h4>
                  <div className="text-sm space-y-1">
                    <p>{selected.warranty.type}</p>
                    <p>{formatDate(selected.warranty.startDate)} → {formatDate(selected.warranty.endDate)} ({selected.warranty.daysRemaining}d restantes)</p>
                    <p className="text-xs text-muted-foreground">Cobertura: {selected.warranty.coverage}</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">📋 Produtos</h4>
                  {selected.job.products.map((p, i) => (
                    <div key={i} className="text-sm ml-2 mb-1">
                      <p>• <strong>{p.name}</strong> ({p.quantity}x) — {formatCurrency(p.totalValue)}</p>
                    </div>
                  ))}
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">⭐ Satisfação</h4>
                  <div className="text-sm space-y-1">
                    <p>Geral: {renderStars(selected.satisfaction.overall)} ({selected.satisfaction.overall}/5)</p>
                    {selected.satisfaction.feedback && <p className="italic text-muted-foreground">"{selected.satisfaction.feedback}"</p>}
                    {selected.satisfaction.npsScore !== null && <p>NPS: {selected.satisfaction.npsScore} ({selected.satisfaction.npsCategory})</p>}
                  </div>
                </div>
                <Separator />
                <div>
                  <h4 className="font-semibold text-sm mb-2">📝 Histórico</h4>
                  {selected.history.map((h, i) => (
                    <div key={i} className="text-sm flex gap-2"><span className="text-muted-foreground whitespace-nowrap">{formatDate(h.date)}</span><span>— {h.event}</span></div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

EntregasTab.displayName = "EntregasTab";
export default EntregasTab;
