import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { opportunitiesService } from "@/services/holdprint";
import type { HoldprintBudget, BudgetStepOrder } from "@/services/holdprint/types";
import { getHoldprintSettings } from "@/services/holdprint/api";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search, AlertCircle, Settings, Target, LayoutGrid, List,
  DollarSign, TrendingUp, BarChart3, Ticket,
} from "lucide-react";
import { Link } from "react-router-dom";

const COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
  "bg-teal-100 border-teal-300 text-teal-800",
  "bg-green-100 border-green-300 text-green-800",
  "bg-yellow-100 border-yellow-300 text-yellow-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-red-100 border-red-300 text-red-800",
];

export default function HoldprintOportunidadesPage() {
  const settings = getHoldprintSettings();
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [search, setSearch] = useState("");

  const { data: steps, isLoading: stepsLoading } = useQuery({
    queryKey: ["holdprint-step-orders"],
    queryFn: () => opportunitiesService.stepOrders(),
    enabled: !!settings?.token,
  });

  const { data: budgets, isLoading: budgetsLoading } = useQuery({
    queryKey: ["holdprint-budgets", search],
    queryFn: () =>
      opportunitiesService.budgetsSearch({
        skip: 0,
        take: 200,
        order: { createdAt: "DESC" },
        filter: search ? { customerName: { $regex: search, $options: "i" } } : {},
      }),
    enabled: !!settings?.token,
  });

  if (!settings?.token) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium">Configure seu token Holdprint</p>
        <Button asChild>
          <Link to="/holdprint/configuracoes"><Settings className="mr-2 h-4 w-4" /> Configurações</Link>
        </Button>
      </div>
    );
  }

  const isLoading = stepsLoading || budgetsLoading;
  const allBudgets = budgets?.data || [];
  const sortedSteps = (steps || []).sort((a, b) => (a.order || 0) - (b.order || 0));

  const getStepBudgets = (stepId: string) =>
    allBudgets.filter((b) => b.step === stepId);

  const totalValue = allBudgets.reduce(
    (acc, b) => acc + (b.budgetedTotalPrice || b.approvedTotalPrice || b.totalPrice || 0),
    0
  );
  const avgTicket = allBudgets.length > 0 ? totalValue / allBudgets.length : 0;

  const fmt = (v: number) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Target className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Oportunidades</h1>
          <p className="text-muted-foreground text-sm">Pipeline CRM do Holdprint</p>
        </div>
      </div>

      {/* KPIs */}
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
          <CardContent><p className="text-2xl font-bold">—</p></CardContent>
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

      {/* Controls */}
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
          {sortedSteps.map((step, idx) => {
            const stepBudgets = getStepBudgets(step._id);
            const stepTotal = stepBudgets.reduce(
              (acc, b) => acc + (b.budgetedTotalPrice || b.approvedTotalPrice || b.totalPrice || 0),
              0
            );
            const colorClass = COLORS[idx % COLORS.length];

            return (
              <div key={step._id} className="min-w-[260px] flex-shrink-0">
                <div className={`rounded-t-lg border px-3 py-2 ${colorClass}`}>
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-sm">{step.name}</span>
                    <Badge variant="outline" className="text-xs">{stepBudgets.length}</Badge>
                  </div>
                  <p className="text-xs mt-0.5 opacity-80">{fmt(stepTotal)}</p>
                </div>
                <div className="border border-t-0 rounded-b-lg bg-muted/30 p-2 space-y-2 min-h-[120px]">
                  {stepBudgets.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">Sem oportunidades</p>
                  ) : (
                    stepBudgets.map((b) => (
                      <Card key={b._id} className="shadow-sm">
                        <CardContent className="p-3 space-y-1">
                          <p className="font-medium text-sm truncate">
                            {b.customer?.fullName || b.customerName || "Cliente"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {fmt(b.budgetedTotalPrice || b.approvedTotalPrice || b.totalPrice || 0)}
                          </p>
                          {b.code && <p className="text-[10px] text-muted-foreground">#{b.code}</p>}
                        </CardContent>
                      </Card>
                    ))
                  )}
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
                <TableHead>Cliente</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="hidden md:table-cell">Código</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allBudgets.map((b) => (
                <TableRow key={b._id}>
                  <TableCell className="font-medium">
                    {b.customer?.fullName || b.customerName || "—"}
                  </TableCell>
                  <TableCell>{fmt(b.budgetedTotalPrice || b.approvedTotalPrice || b.totalPrice || 0)}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{b.stepName || b.step || "—"}</Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground">#{b.code}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
