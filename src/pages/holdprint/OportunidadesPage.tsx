import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { opportunitiesService } from "@/services/holdprint";
import type { HoldprintBudget } from "@/services/holdprint/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, AlertCircle, Target, LayoutGrid, List,
  DollarSign, TrendingUp, BarChart3, Ticket,
} from "lucide-react";

const BUDGET_STATES: Record<number, string> = {
  0: "Aberto",
  1: "Enviado",
  2: "Em Negociação",
  3: "Ganho",
  4: "Perdido",
  5: "Cancelado",
};

const STATE_COLORS: Record<number, string> = {
  0: "bg-blue-100 border-blue-300 text-blue-800",
  1: "bg-cyan-100 border-cyan-300 text-cyan-800",
  2: "bg-yellow-100 border-yellow-300 text-yellow-800",
  3: "bg-green-100 border-green-300 text-green-800",
  4: "bg-red-100 border-red-300 text-red-800",
  5: "bg-gray-100 border-gray-300 text-gray-800",
};

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

function getBudgetValue(b: HoldprintBudget): number {
  return b.proposes?.[0]?.totalPrice || 0;
}

export default function HoldprintOportunidadesPage() {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");

  const { data: budgets, isLoading } = useQuery({
    queryKey: ["holdprint-budgets", search],
    queryFn: () =>
      opportunitiesService.budgetsSearch({
        skip: 0,
        take: 200,
        order: { createdAt: "DESC" },
      }),
  });

  const allBudgets = (budgets?.data || []).filter(
    (b) => !search || (b.customerName || b.title || "").toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = allBudgets.reduce((acc, b) => acc + getBudgetValue(b), 0);
  const avgTicket = allBudgets.length > 0 ? totalValue / allBudgets.length : 0;
  const wonCount = allBudgets.filter((b) => b.budgetState === 3).length;
  const conversionRate = allBudgets.length > 0 ? ((wonCount / allBudgets.length) * 100).toFixed(1) : "—";

  // Group by budgetState for kanban
  const stateGroups = Object.entries(BUDGET_STATES).map(([stateNum, label]) => {
    const state = Number(stateNum);
    const items = allBudgets.filter((b) => b.budgetState === state);
    return { state, label, items, total: items.reduce((a, b2) => a + getBudgetValue(b2), 0) };
  }).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
          <p className="text-muted-foreground text-sm">Pipeline CRM do Holdprint</p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <BarChart3 className="h-3 w-3" /> Oportunidades
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{allBudgets.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <DollarSign className="h-3 w-3" /> Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(totalValue)}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Conversão
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{conversionRate}%</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1">
              <Ticket className="h-3 w-3" /> Ticket Médio
            </CardTitle>
          </CardHeader>
          <CardContent><p className="text-2xl font-bold">{fmt(avgTicket)}</p></CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Tabs value={view} onValueChange={(v) => setView(v as "kanban" | "list")}>
          <TabsList>
            <TabsTrigger value="kanban"><LayoutGrid className="h-4 w-4 mr-1" /> Kanban</TabsTrigger>
            <TabsTrigger value="list"><List className="h-4 w-4 mr-1" /> Lista</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
        </div>
      ) : view === "kanban" ? (
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
                  <TableCell>
                    <Badge variant="outline">{BUDGET_STATES[b.budgetState ?? 0] || "—"}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
