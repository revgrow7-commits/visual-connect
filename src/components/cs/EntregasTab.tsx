import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Truck, ThumbsUp, ThumbsDown, Hourglass, Search, Star } from "lucide-react";
import { mockDeliveries } from "./mockData";
import type { Delivery } from "./types";

const statusConfig = {
  on_time: { label: "✅ No Prazo", variant: "default" as const, className: "bg-green-100 text-green-800 hover:bg-green-100" },
  slight_delay: { label: "⚠️ Leve Atraso", variant: "default" as const, className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  late: { label: "❌ Atrasado", variant: "default" as const, className: "bg-red-100 text-red-800 hover:bg-red-100" },
  awaiting_acceptance: { label: "⏳ Aguardando Aceite", variant: "default" as const, className: "bg-blue-100 text-blue-800 hover:bg-blue-100" },
};

const warrantyConfig = {
  active: { label: "🛡️ Em Garantia", className: "bg-green-100 text-green-800 hover:bg-green-100" },
  expiring: { label: "⚠️ Expirando", className: "bg-yellow-100 text-yellow-800 hover:bg-yellow-100" },
  expired: { label: "Expirada", className: "bg-muted text-muted-foreground hover:bg-muted" },
  none: { label: "Sem Garantia", className: "bg-muted/50 text-muted-foreground hover:bg-muted/50" },
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatDate = (d: string) => new Date(d).toLocaleDateString("pt-BR");
const renderStars = (n: number) => "⭐".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

const EntregasTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [warrantyFilter, setWarrantyFilter] = useState("all");
  const [selected, setSelected] = useState<Delivery | null>(null);

  const filtered = mockDeliveries.filter((d) => {
    if (statusFilter !== "all" && d.deliveryStatus !== statusFilter) return false;
    if (warrantyFilter !== "all" && d.warranty.status !== warrantyFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return d.job.title.toLowerCase().includes(s) || d.job.customerName.toLowerCase().includes(s) || String(d.job.code).includes(s);
    }
    return true;
  });

  const kpis = [
    { label: "Total Entregas (mês)", value: "18", icon: Truck, bg: "bg-muted", color: "text-muted-foreground" },
    { label: "Dentro do Prazo", value: "14", icon: ThumbsUp, bg: "bg-green-50", color: "text-green-600" },
    { label: "Fora do Prazo", value: "3", icon: ThumbsDown, bg: "bg-red-50", color: "text-red-600" },
    { label: "Aguardando Aceite", value: "1", icon: Hourglass, bg: "bg-yellow-50", color: "text-yellow-600" },
  ];

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
        <div className="w-48">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status Entrega" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="on_time">No Prazo</SelectItem>
              <SelectItem value="slight_delay">Leve Atraso</SelectItem>
              <SelectItem value="late">Atrasado</SelectItem>
              <SelectItem value="awaiting_acceptance">Aguardando Aceite</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-48">
          <Select value={warrantyFilter} onValueChange={setWarrantyFilter}>
            <SelectTrigger><SelectValue placeholder="Garantia" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="active">Em Garantia</SelectItem>
              <SelectItem value="expiring">Expirando</SelectItem>
              <SelectItem value="expired">Expirada</SelectItem>
              <SelectItem value="none">Sem Garantia</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por job, cliente, produto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Table */}
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
                <TableHead>Garantia</TableHead>
                <TableHead>Satisfação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((d) => (
                <TableRow key={d.job.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(d)}>
                  <TableCell className="font-bold">#{d.job.code}</TableCell>
                  <TableCell className="max-w-[200px] truncate">{d.job.title}</TableCell>
                  <TableCell>{d.job.customerName}</TableCell>
                  <TableCell>{d.job.deliveryDate ? formatDate(d.job.deliveryDate) : "—"}</TableCell>
                  <TableCell>{formatDate(d.job.deliveryNeeded)}</TableCell>
                  <TableCell>
                    <Badge className={statusConfig[d.deliveryStatus].className}>{statusConfig[d.deliveryStatus].label}</Badge>
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(d.job.totalPrice)}</TableCell>
                  <TableCell>
                    <Badge className={warrantyConfig[d.warranty.status].className}>{warrantyConfig[d.warranty.status].label}</Badge>
                  </TableCell>
                  <TableCell>{renderStars(d.satisfaction.overall)}</TableCell>
                </TableRow>
              ))}
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
                <SheetTitle>Job #{selected.job.code} — {selected.job.customerName}</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                {/* Client */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">👤 Cliente</h4>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p>{selected.job.customerName}</p>
                    <p>CNPJ: {selected.job.customerDocument}</p>
                    <p>Contato: {selected.job.customerContact}</p>
                    <p>Tel: {selected.job.customerPhone}</p>
                    <p>Email: {selected.job.customerEmail}</p>
                  </div>
                </div>
                <Separator />

                {/* Delivery */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">📦 Entrega</h4>
                  <div className="text-sm space-y-1">
                    <p>Prazo original: {formatDate(selected.job.deliveryNeeded)}</p>
                    <p>Data entrega: {selected.job.deliveryDate ? formatDate(selected.job.deliveryDate) : "Pendente"}</p>
                    <p>Status: <Badge className={statusConfig[selected.deliveryStatus].className}>{statusConfig[selected.deliveryStatus].label}</Badge> ({selected.daysVariance > 0 ? `+${selected.daysVariance} dias` : `${selected.daysVariance} dias`})</p>
                    <p>Responsável: {selected.job.responsibleName}</p>
                  </div>
                </div>
                <Separator />

                {/* Warranty */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">🛡️ Garantia</h4>
                  <div className="text-sm space-y-1">
                    <p>Tipo: {selected.warranty.type}</p>
                    <p>Início: {formatDate(selected.warranty.startDate)}</p>
                    <p>Vencimento: {formatDate(selected.warranty.endDate)}</p>
                    <p>Status: <Badge className={warrantyConfig[selected.warranty.status].className}>{warrantyConfig[selected.warranty.status].label}</Badge> ({selected.warranty.daysRemaining} dias restantes)</p>
                    <p>Cobertura: {selected.warranty.coverage}</p>
                    <p>Exclusões: {selected.warranty.exclusions}</p>
                  </div>
                </div>
                <Separator />

                {/* Products */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">📋 Produtos Entregues</h4>
                  {selected.job.products.map((p, i) => (
                    <div key={i} className="text-sm ml-2 mb-2">
                      <p>• <strong>{p.name}</strong> ({p.quantity}x)</p>
                      <p className="text-muted-foreground ml-3">{p.description}</p>
                      <p className="text-muted-foreground ml-3">Valor: {formatCurrency(p.totalValue)}</p>
                    </div>
                  ))}
                </div>
                <Separator />

                {/* Satisfaction */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">⭐ Satisfação do Cliente</h4>
                  <div className="text-sm space-y-1">
                    <p>Geral: {renderStars(selected.satisfaction.overall)} ({selected.satisfaction.overall}/5)</p>
                    <p>Qualidade: {renderStars(selected.satisfaction.quality)}</p>
                    <p>Prazo: {renderStars(selected.satisfaction.deadline)}</p>
                    <p>Atendimento: {renderStars(selected.satisfaction.service)}</p>
                    {selected.satisfaction.feedback && <p className="italic text-muted-foreground mt-2">"{selected.satisfaction.feedback}"</p>}
                    {selected.satisfaction.npsScore !== null && <p>NPS: {selected.satisfaction.npsScore} ({selected.satisfaction.npsCategory})</p>}
                  </div>
                </div>
                <Separator />

                {/* Complaints */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">📢 Reclamações ({selected.complaints.length})</h4>
                  {selected.complaints.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma reclamação registrada.</p>
                  ) : (
                    selected.complaints.map((c) => (
                      <div key={c.id} className="text-sm bg-muted/50 rounded-lg p-3 mb-2">
                        <p className="font-medium">{c.id} — {c.category}</p>
                        <p className="text-muted-foreground">{c.description}</p>
                        {c.resolution && <p className="text-green-700 mt-1">Resolução: {c.resolution}</p>}
                      </div>
                    ))
                  )}
                </div>
                <Separator />

                {/* History */}
                <div>
                  <h4 className="font-semibold text-sm mb-2">📝 Histórico</h4>
                  <div className="space-y-2">
                    {selected.history.map((h, i) => (
                      <div key={i} className="text-sm flex gap-2">
                        <span className="text-muted-foreground whitespace-nowrap">{formatDate(h.date)}</span>
                        <span>— {h.event}</span>
                      </div>
                    ))}
                  </div>
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
