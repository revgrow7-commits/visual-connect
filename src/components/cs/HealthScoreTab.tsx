import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, TrendingUp, TrendingDown, Minus, Loader2 } from "lucide-react";
import { mockHealthScores } from "./mockData";
import type { CSWorkspaceCustomer } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

const scoreColor = (s: number) => {
  if (s >= 90) return "bg-green-700 text-white";
  if (s >= 70) return "bg-green-500 text-white";
  if (s >= 50) return "bg-yellow-500 text-white";
  if (s >= 30) return "bg-orange-500 text-white";
  return "bg-red-600 text-white";
};

const scoreLabel = (s: number) => {
  if (s >= 90) return "Excelente";
  if (s >= 70) return "Bom";
  if (s >= 50) return "Atenção";
  if (s >= 30) return "Crítico";
  return "Risco de Churn";
};

const riskBg: Record<string, string> = {
  none: "", low: "border-l-4 border-l-yellow-300", medium: "border-l-4 border-l-orange-400",
  high: "border-l-4 border-l-red-400", critical: "border-l-4 border-l-red-600 bg-red-50/30",
};

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface HealthScoreTabProps {
  wsCustomers?: CSWorkspaceCustomer[] | null;
  isLoading?: boolean;
}

const HealthScoreTab: React.FC<HealthScoreTabProps> = ({ wsCustomers, isLoading }) => {
  const [search, setSearch] = useState("");
  const [scoreFilter, setScoreFilter] = useState("all");
  const [trendFilter, setTrendFilter] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  // Transform wsCustomers to health score cards or fallback to mock
  const customers = wsCustomers && wsCustomers.length > 0
    ? wsCustomers.map(c => ({
        id: c.id,
        name: c.name,
        document: c.document,
        contact_person: c.contact_person,
        phone: c.phone,
        email: c.email,
        healthScore: c.healthScore,
        previousScore: c.previousScore,
        trend: c.trend,
        totalJobs: c.totalJobs,
        totalRevenue: c.totalRevenue,
        complaintCount: c.openComplaints,
        openComplaints: c.openComplaints,
        lastJobDate: c.lastJobDate,
        riskLevel: c.riskLevel,
        frequency: c.frequency,
        suggestedAction: c.riskLevel === "critical" ? "⚠️ Risco de churn — Agendar reunião urgente" : c.riskLevel === "high" ? "Contato prioritário necessário" : null,
      }))
    : mockHealthScores;

  const isRealData = wsCustomers && wsCustomers.length > 0;

  const filtered = customers.filter((c: any) => {
    if (scoreFilter === "excellent" && c.healthScore < 90) return false;
    if (scoreFilter === "good" && (c.healthScore < 70 || c.healthScore >= 90)) return false;
    if (scoreFilter === "attention" && (c.healthScore < 50 || c.healthScore >= 70)) return false;
    if (scoreFilter === "critical" && c.healthScore >= 50) return false;
    if (trendFilter !== "all" && c.trend !== trendFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.name.toLowerCase().includes(s) || c.document?.includes(s);
    }
    return true;
  }).sort((a: any, b: any) => a.healthScore - b.healthScore);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? `🟢 ${customers.length} clientes Holdprint` : "🟡 Dados mock (demo)"}
        </Badge>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-end">
        <Select value={scoreFilter} onValueChange={setScoreFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Health Score" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="excellent">Excelente (90+)</SelectItem>
            <SelectItem value="good">Bom (70-89)</SelectItem>
            <SelectItem value="attention">Atenção (50-69)</SelectItem>
            <SelectItem value="critical">Crítico (&lt;50)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={trendFilter} onValueChange={setTrendFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Tendência" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="up">Subindo</SelectItem>
            <SelectItem value="down">Caindo</SelectItem>
            <SelectItem value="stable">Estável</SelectItem>
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome, CNPJ..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <Card className="col-span-full"><CardContent className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</CardContent></Card>
        ) : filtered.map((c: any) => (
          <Card key={c.id} className={`cursor-pointer hover:shadow-md transition-shadow ${riskBg[c.riskLevel] || ""}`} onClick={() => setSelected(c)}>
            <CardContent className="p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className={`h-14 w-14 rounded-xl ${scoreColor(c.healthScore)} flex flex-col items-center justify-center flex-shrink-0`}>
                  <span className="text-lg font-bold leading-none">{c.healthScore}</span>
                  <span className="text-[10px] opacity-80">/100</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1">
                    <p className="font-bold text-sm truncate">{c.name}</p>
                    {c.trend === "up" && <TrendingUp className="h-4 w-4 text-green-600 flex-shrink-0" />}
                    {c.trend === "down" && <TrendingDown className="h-4 w-4 text-red-600 flex-shrink-0" />}
                    {c.trend === "stable" && <Minus className="h-4 w-4 text-muted-foreground flex-shrink-0" />}
                    <span className={`text-xs ${c.trend === "up" ? "text-green-600" : c.trend === "down" ? "text-red-600" : "text-muted-foreground"}`}>
                      {c.healthScore - c.previousScore > 0 ? "+" : ""}{c.healthScore - c.previousScore}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{c.contact_person} • {c.phone}</p>
                  <Badge variant="outline" className="text-[10px] mt-1">{scoreLabel(c.healthScore)}</Badge>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span>📊 {c.totalJobs} jobs</span>
                <span>💰 {formatCurrency(c.totalRevenue)}</span>
                {c.frequency && <span>📅 {c.frequency}</span>}
              </div>

              {c.suggestedAction && (
                <p className="text-xs mt-2 p-2 bg-muted/50 rounded text-muted-foreground italic">{c.suggestedAction}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <div className={`h-10 w-10 rounded-lg ${scoreColor(selected.healthScore)} flex items-center justify-center text-sm font-bold`}>{selected.healthScore}</div>
                  {selected.name}
                </SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="text-sm space-y-1 text-muted-foreground">
                  {selected.document && <p>CNPJ: {selected.document}</p>}
                  <p>Contato: {selected.contact_person}</p>
                  <p>Email: {selected.email}</p>
                  <p>Telefone: {selected.phone}</p>
                </div>
                <Separator />
                <div className="grid grid-cols-2 gap-3">
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Jobs</p><p className="text-xl font-bold">{selected.totalJobs}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Receita Total</p><p className="text-lg font-bold">{formatCurrency(selected.totalRevenue)}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Frequência</p><p className="text-lg font-bold">{selected.frequency || "—"}</p></CardContent></Card>
                  <Card><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Risco</p><Badge className={`${selected.riskLevel === "critical" ? "bg-red-600 text-white" : selected.riskLevel === "high" ? "bg-orange-500 text-white" : selected.riskLevel === "medium" ? "bg-yellow-500 text-white" : "bg-green-500 text-white"}`}>{selected.riskLevel}</Badge></CardContent></Card>
                </div>
                {selected.suggestedAction && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Ação Sugerida</h4>
                      <p className="text-sm bg-muted/50 p-3 rounded">{selected.suggestedAction}</p>
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

export default HealthScoreTab;
