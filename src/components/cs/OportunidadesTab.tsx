import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Lightbulb, DollarSign, CheckCircle, Target, Search } from "lucide-react";
import { mockOpportunities } from "./mockData";
import type { Opportunity } from "./types";

const typeCfg: Record<string, { label: string; className: string }> = {
  upsell: { label: "💎 Upsell", className: "bg-green-100 text-green-800 hover:bg-green-100 border-l-green-500" },
  cross_sell: { label: "🔀 Cross-sell", className: "bg-blue-100 text-blue-800 hover:bg-blue-100 border-l-blue-500" },
  reorder: { label: "🔄 Recompra", className: "bg-cyan-100 text-cyan-800 hover:bg-cyan-100 border-l-cyan-500" },
  maintenance_contract: { label: "🔧 Contrato Manutenção", className: "bg-purple-100 text-purple-800 hover:bg-purple-100 border-l-purple-500" },
  warranty_renewal: { label: "🛡️ Renovação Garantia", className: "bg-orange-100 text-orange-800 hover:bg-orange-100 border-l-orange-500" },
  referral: { label: "🤝 Indicação", className: "bg-pink-100 text-pink-800 hover:bg-pink-100 border-l-pink-500" },
};

const borderColors: Record<string, string> = {
  upsell: "border-l-4 border-l-green-500",
  cross_sell: "border-l-4 border-l-blue-500",
  reorder: "border-l-4 border-l-cyan-500",
  maintenance_contract: "border-l-4 border-l-purple-500",
  warranty_renewal: "border-l-4 border-l-orange-500",
  referral: "border-l-4 border-l-pink-500",
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const scoreColor = (s: number) => {
  if (s >= 70) return "text-green-600";
  if (s >= 50) return "text-yellow-600";
  return "text-red-600";
};

const OportunidadesTab = () => {
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = mockOpportunities.filter((o) => {
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return o.customerName.toLowerCase().includes(s) || o.description.toLowerCase().includes(s);
    }
    return true;
  });

  const active = mockOpportunities.filter((o) => o.status === "active");
  const totalValue = active.reduce((sum, o) => sum + o.estimatedValue, 0);
  const converted = mockOpportunities.filter((o) => o.status === "converted").length;

  const kpis = [
    { label: "Oportunidades Ativas", value: String(active.length), icon: Lightbulb, bg: "bg-green-50", color: "text-green-600" },
    { label: "Valor Potencial", value: formatCurrency(totalValue), icon: DollarSign, bg: "bg-green-50", color: "text-green-600" },
    { label: "Convertidas (mês)", value: String(converted), icon: CheckCircle, bg: "bg-blue-50", color: "text-blue-600" },
    { label: "Taxa Conversão", value: `${mockOpportunities.length > 0 ? Math.round((converted / mockOpportunities.length) * 100) : 0}%`, icon: Target, bg: "bg-muted", color: "text-muted-foreground" },
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
                <p className="text-lg font-bold">{k.value}</p>
              </div>
            </CardContent>
          </Card>
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
        {filtered.map((opp) => (
          <Card key={opp.id} className={`${borderColors[opp.type]} hover:shadow-md transition-shadow`}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <Badge className={typeCfg[opp.type].className}>{typeCfg[opp.type].label}</Badge>
                  <h4 className="font-semibold text-sm mt-1">{opp.description}</h4>
                </div>
                <Badge variant="outline" className="text-xs flex-shrink-0">{opp.status === "active" ? "🟢" : opp.status === "converted" ? "✅" : "⏸️"}</Badge>
              </div>

              <div className="text-sm space-y-1">
                <p>👤 <strong>{opp.customerName}</strong></p>
                <p>📊 Health Score: <span className={`font-bold ${scoreColor(opp.healthScore)}`}>{opp.healthScore}</span></p>
                <p>💰 Valor estimado: <strong>{formatCurrency(opp.estimatedValue)}</strong></p>
                <p>📅 Timing: {opp.timing}</p>
              </div>

              <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                <p className="mb-1"><strong>Contexto:</strong> {opp.context}</p>
              </div>

              <div className="text-xs p-2 bg-blue-50/50 rounded">
                <p>🎯 <strong>Próximo passo:</strong> {opp.nextStep}</p>
              </div>

              <div className="text-xs text-muted-foreground">Responsável: {opp.responsibleName}{opp.relatedJobCode ? ` • Job #${opp.relatedJobCode}` : ""}</div>

              {opp.status === "active" && (
                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="default" className="h-7 text-xs">✅ Converter</Button>
                  <Button size="sm" variant="outline" className="h-7 text-xs">⏭️ Adiar</Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs text-red-600">❌ Descartar</Button>
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
