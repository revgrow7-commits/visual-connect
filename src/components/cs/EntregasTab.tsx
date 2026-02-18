import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Truck, ThumbsUp, ThumbsDown, Hourglass, Search, Shield, Clock, Calendar, Wrench, Loader2 } from "lucide-react";
import { mockDeliveries, mockWarranties } from "./mockData";
import type { HoldprintJob } from "@/hooks/useCSHoldprintData";

const statusConfig: Record<string, { label: string; className: string }> = {
  on_time: { label: "✅ No Prazo", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  slight_delay: { label: "⚠️ Leve Atraso", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  late: { label: "❌ Atrasado", className: "bg-red-100 text-red-800 hover:bg-red-100" },
  awaiting_acceptance: { label: "⏳ Aguardando", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  in_progress: { label: "🔄 Em Produção", className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
  delivered: { label: "✅ Entregue", className: "bg-green-100 text-green-800 hover:bg-green-100" },
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (d: string) => d ? new Date(d).toLocaleDateString("pt-BR") : "—";

interface EntregasTabProps {
  holdprintJobs?: HoldprintJob[];
  isLoading?: boolean;
}

function getDeliveryStatus(job: HoldprintJob): string {
  if (!job.deliveryNeeded && !job.deliveryDate) return "in_progress";
  if (job.deliveryDate && job.deliveryNeeded) {
    const delivered = new Date(job.deliveryDate);
    const needed = new Date(job.deliveryNeeded);
    const diff = Math.floor((delivered.getTime() - needed.getTime()) / (1000 * 60 * 60 * 24));
    if (diff <= 0) return "on_time";
    if (diff <= 3) return "slight_delay";
    return "late";
  }
  if (job.deliveryDate) return "delivered";
  return "awaiting_acceptance";
}

const EntregasTab = React.forwardRef<HTMLDivElement, EntregasTabProps>(({ holdprintJobs, isLoading }, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  // Transform Holdprint jobs to delivery format
  const holdprintDeliveries = holdprintJobs && holdprintJobs.length > 0
    ? holdprintJobs.map(j => ({
        job: {
          id: String(j.id),
          code: j.code || j.id,
          title: j.title || "Sem título",
          customerName: j.customer?.fantasyName || j.customer?.name || "—",
          totalPrice: j.totalPrice || 0,
          deliveryNeeded: j.deliveryNeeded || "",
          deliveryDate: j.deliveryDate || null,
        },
        deliveryStatus: getDeliveryStatus(j),
        progressPercentage: j.progressPercentage || 0,
        _unidade: j._unidade,
      }))
    : null;

  const deliveries = holdprintDeliveries || mockDeliveries;
  const isRealData = !!holdprintDeliveries;

  const filteredDeliveries = deliveries.filter((d: any) => {
    if (statusFilter !== "all" && d.deliveryStatus !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.job.title?.toLowerCase().includes(s) || d.job.customerName?.toLowerCase().includes(s) || String(d.job.code).includes(s);
    }
    return true;
  });

  const onTime = deliveries.filter((d: any) => d.deliveryStatus === "on_time" || d.deliveryStatus === "delivered").length;
  const late = deliveries.filter((d: any) => d.deliveryStatus === "late").length;
  const awaiting = deliveries.filter((d: any) => d.deliveryStatus === "awaiting_acceptance" || d.deliveryStatus === "in_progress").length;

  return (
    <div ref={ref} className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? `🟢 ${deliveries.length} jobs Holdprint` : "🟡 Dados mock (demo)"}
        </Badge>
      </div>

      <Tabs defaultValue="deliveries">
        <TabsList>
          <TabsTrigger value="deliveries" className="gap-1.5"><Truck className="h-4 w-4" /> Entregas</TabsTrigger>
          <TabsTrigger value="warranties" className="gap-1.5"><Shield className="h-4 w-4" /> Garantias</TabsTrigger>
        </TabsList>

        <TabsContent value="deliveries" className="mt-4 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Entregas", value: String(deliveries.length), icon: Truck, bg: "bg-muted", color: "text-muted-foreground" },
              { label: "Dentro do Prazo", value: String(onTime), icon: ThumbsUp, bg: "bg-green-50", color: "text-green-600" },
              { label: "Fora do Prazo", value: String(late), icon: ThumbsDown, bg: "bg-red-50", color: "text-red-600" },
              { label: "Em Andamento", value: String(awaiting), icon: Hourglass, bg: "bg-yellow-50", color: "text-yellow-600" },
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
                <SelectItem value="in_progress">Em Produção</SelectItem>
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
                    {isRealData && <TableHead>Unidade</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDeliveries.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Nenhuma entrega encontrada.</TableCell></TableRow>
                  ) : filteredDeliveries.map((d: any) => (
                    <TableRow key={d.job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(d)}>
                      <TableCell className="font-bold">#{d.job.code}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{d.job.title}</TableCell>
                      <TableCell>{d.job.customerName}</TableCell>
                      <TableCell>{d.job.deliveryDate ? formatDate(d.job.deliveryDate) : "—"}</TableCell>
                      <TableCell>{d.job.deliveryNeeded ? formatDate(d.job.deliveryNeeded) : "—"}</TableCell>
                      <TableCell><Badge className={statusConfig[d.deliveryStatus]?.className || ""}>{statusConfig[d.deliveryStatus]?.label || d.deliveryStatus}</Badge></TableCell>
                      <TableCell className="text-right">{formatCurrency(d.job.totalPrice)}</TableCell>
                      {isRealData && <TableCell className="text-xs text-muted-foreground">{d._unidade}</TableCell>}
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
              { label: "Garantias Ativas", value: String(mockWarranties.filter(w => w.status === "active").length), icon: Shield, bg: "bg-green-50", color: "text-green-600" },
              { label: "Expirando em 30d", value: String(mockWarranties.filter(w => w.status === "expiring_30").length), icon: Clock, bg: "bg-yellow-50", color: "text-yellow-600" },
              { label: "Expirando em 90d", value: String(mockWarranties.filter(w => w.status === "expiring_90").length), icon: Calendar, bg: "bg-blue-50", color: "text-blue-600" },
              { label: "Chamados em Garantia", value: String(mockWarranties.reduce((s, w) => s + w.serviceCalls, 0)), icon: Wrench, bg: "bg-red-50", color: "text-red-600" },
            ].map((k) => (
              <Card key={k.label}><CardContent className="p-4 flex items-center gap-3"><div className={`h-10 w-10 rounded-lg ${k.bg} flex items-center justify-center`}><k.icon className={`h-5 w-5 ${k.color}`} /></div><div><p className="text-xs text-muted-foreground">{k.label}</p><p className="text-lg font-bold">{k.value}</p></div></CardContent></Card>
            ))}
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
                  {mockWarranties.map((w) => (
                    <TableRow key={w.jobCode} className="hover:bg-muted/50">
                      <TableCell className="font-bold">#{w.jobCode}</TableCell>
                      <TableCell>{w.customerName}</TableCell>
                      <TableCell className="max-w-[200px] truncate">{w.product}</TableCell>
                      <TableCell className="text-xs">{w.type}</TableCell>
                      <TableCell>{formatDate(w.startDate)}</TableCell>
                      <TableCell className={w.daysRemaining < 30 ? "text-red-600 font-bold" : ""}>{formatDate(w.endDate)}</TableCell>
                      <TableCell className={w.daysRemaining < 30 ? "text-red-600 font-bold" : w.daysRemaining < 90 ? "text-yellow-600" : ""}>{w.daysRemaining}</TableCell>
                      <TableCell><Badge className={statusConfig[w.status]?.className || ""}>{w.status}</Badge></TableCell>
                      <TableCell className={w.serviceCalls > 0 ? "text-red-600 font-bold" : ""}>{w.serviceCalls}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader><SheetTitle>Job #{selected.job.code} — {selected.job.customerName}</SheetTitle></SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="flex flex-wrap gap-2">
                  <Badge className={statusConfig[selected.deliveryStatus]?.className || ""}>{statusConfig[selected.deliveryStatus]?.label || selected.deliveryStatus}</Badge>
                  {selected._unidade && <Badge variant="outline">{selected._unidade}</Badge>}
                </div>
                <Separator />
                <div className="text-sm space-y-1">
                  <p><strong>Título:</strong> {selected.job.title}</p>
                  <p><strong>Prazo:</strong> {selected.job.deliveryNeeded ? formatDate(selected.job.deliveryNeeded) : "—"}</p>
                  <p><strong>Entrega:</strong> {selected.job.deliveryDate ? formatDate(selected.job.deliveryDate) : "Pendente"}</p>
                  <p><strong>Valor:</strong> {formatCurrency(selected.job.totalPrice)}</p>
                  {selected.progressPercentage !== undefined && <p><strong>Progresso:</strong> {selected.progressPercentage}%</p>}
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
