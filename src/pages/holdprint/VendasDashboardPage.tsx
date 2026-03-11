import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, TrendingUp, DollarSign, Users, ShoppingCart,
  Target, RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area,
} from "recharts";
import { holdprintList, setHoldprintUnidade, type HoldprintUnidade } from "@/services/holdprint/api";
import type { HoldprintBudget, HoldprintProcess } from "@/services/holdprint/types";

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtK(v: number) {
  if (v >= 1_000_000) return `R$ ${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$ ${(v / 1_000).toFixed(0)}k`;
  return fmtBRL(v);
}

const COLORS = [
  "hsl(350 67% 37%)", "hsl(320 43% 22%)", "hsl(217 91% 60%)",
  "hsl(142 71% 45%)", "hsl(38 92% 50%)", "hsl(270 60% 50%)",
  "hsl(190 80% 45%)", "hsl(0 84% 60%)",
];

const BUDGET_STATES: Record<number, string> = {
  0: "Rascunho",
  1: "Enviado",
  2: "Ganho",
  3: "Perdido",
  4: "Cancelado",
};

function useSalesData(unidade: HoldprintUnidade) {
  setHoldprintUnidade(unidade);

  const budgets = useQuery({
    queryKey: ["holdprint-budgets-dashboard", unidade],
    queryFn: async () => {
      const pages = [];
      for (let p = 0; p < 10; p++) {
        const res = await holdprintList<HoldprintBudget>("budgets", { skip: p * 50, take: 50 });
        pages.push(...res.data);
        if (res.data.length < 50) break;
      }
      return pages;
    },
    staleTime: 5 * 60_000,
  });

  const jobs = useQuery({
    queryKey: ["holdprint-jobs-dashboard", unidade],
    queryFn: async () => {
      const pages = [];
      for (let p = 0; p < 10; p++) {
        const res = await holdprintList<HoldprintProcess>("jobs", { skip: p * 50, take: 50 });
        pages.push(...res.data);
        if (res.data.length < 50) break;
      }
      return pages;
    },
    staleTime: 5 * 60_000,
  });

  return { budgets, jobs };
}

export default function VendasDashboardPage() {
  const [unidade, setUnidade] = useState<HoldprintUnidade>("poa");
  const { budgets, jobs } = useSalesData(unidade);

  const isLoading = budgets.isLoading || jobs.isLoading;
  const isFetching = budgets.isFetching || jobs.isFetching;

  const analytics = useMemo(() => {
    const b = budgets.data || [];
    const j = jobs.data || [];

    // KPIs
    const totalBudgets = b.length;
    const wonBudgets = b.filter((x) => x.budgetState === 2);
    const lostBudgets = b.filter((x) => x.budgetState === 3);
    const openBudgets = b.filter((x) => x.budgetState === 0 || x.budgetState === 1);
    const conversionRate = totalBudgets > 0 ? (wonBudgets.length / totalBudgets) * 100 : 0;

    const totalRevenue = wonBudgets.reduce((s, x) => {
      const price = x.proposes?.[0]?.totalPrice || 0;
      return s + price;
    }, 0);

    const avgTicket = wonBudgets.length > 0 ? totalRevenue / wonBudgets.length : 0;

    const totalJobs = j.length;
    const activeJobs = j.filter((x) => !x.isFinalized && x.status !== "cancelled").length;

    // Monthly revenue chart
    const monthlyMap = new Map<string, { receita: number; orcamentos: number; ganhos: number }>();
    for (const x of b) {
      const d = x.wonDate || x.creationDate;
      if (!d) continue;
      const dt = new Date(d);
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      const entry = monthlyMap.get(key) || { receita: 0, orcamentos: 0, ganhos: 0 };
      entry.orcamentos++;
      if (x.budgetState === 2) {
        entry.receita += x.proposes?.[0]?.totalPrice || 0;
        entry.ganhos++;
      }
      monthlyMap.set(key, entry);
    }
    const monthlyData = Array.from(monthlyMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => ({
        mes: key.replace(/^(\d{4})-(\d{2})$/, "$2/$1"),
        ...val,
      }));

    // Pipeline by state
    const pipelineData = Object.entries(
      b.reduce<Record<string, number>>((acc, x) => {
        const state = BUDGET_STATES[x.budgetState ?? 0] || "Outro";
        acc[state] = (acc[state] || 0) + 1;
        return acc;
      }, {})
    ).map(([name, value]) => ({ name, value }));

    // Top customers by revenue
    const customerMap = new Map<string, number>();
    for (const x of wonBudgets) {
      const name = x.customerName || "Sem nome";
      customerMap.set(name, (customerMap.get(name) || 0) + (x.proposes?.[0]?.totalPrice || 0));
    }
    const topCustomers = Array.from(customerMap.entries())
      .map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "…" : name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);

    // Margin distribution
    const marginBuckets = { "< 10%": 0, "10–20%": 0, "20–30%": 0, "30–40%": 0, "> 40%": 0 };
    for (const x of wonBudgets) {
      const margin = x.proposes?.[0]?.totalProfitPercentual || 0;
      if (margin < 10) marginBuckets["< 10%"]++;
      else if (margin < 20) marginBuckets["10–20%"]++;
      else if (margin < 30) marginBuckets["20–30%"]++;
      else if (margin < 40) marginBuckets["30–40%"]++;
      else marginBuckets["> 40%"]++;
    }
    const marginData = Object.entries(marginBuckets).map(([name, value]) => ({ name, value }));

    return {
      totalBudgets, wonBudgets: wonBudgets.length, lostBudgets: lostBudgets.length,
      openBudgets: openBudgets.length, conversionRate, totalRevenue, avgTicket,
      totalJobs, activeJobs, monthlyData, pipelineData, topCustomers, marginData,
    };
  }, [budgets.data, jobs.data]);

  const handleRefresh = () => {
    budgets.refetch();
    jobs.refetch();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <BarChart3 className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold tracking-tight">Dashboard de Vendas</h1>
        <Badge variant="outline" className="text-xs">{unidade.toUpperCase()}</Badge>
        <div className="ml-auto flex gap-2 items-center">
          <Select value={unidade} onValueChange={(v) => setUnidade(v as HoldprintUnidade)}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="poa">POA</SelectItem>
              <SelectItem value="sp">SP</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={handleRefresh} disabled={isFetching}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isFetching ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-24" />)}
          </div>
          <Skeleton className="h-80" />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <KPICard icon={DollarSign} label="Receita Total" value={fmtK(analytics.totalRevenue)} color="text-primary" />
            <KPICard icon={ShoppingCart} label="Orçamentos" value={String(analytics.totalBudgets)} sub={`${analytics.openBudgets} em aberto`} />
            <KPICard icon={Target} label="Taxa de Conversão" value={`${analytics.conversionRate.toFixed(1)}%`} color="text-green-600" sub={`${analytics.wonBudgets} ganhos`} positive />
            <KPICard icon={TrendingUp} label="Ticket Médio" value={fmtK(analytics.avgTicket)} color="text-blue-600" />
            <KPICard icon={ArrowUpRight} label="Ganhos" value={String(analytics.wonBudgets)} color="text-green-600" positive />
            <KPICard icon={ArrowDownRight} label="Perdidos" value={String(analytics.lostBudgets)} color="text-destructive" />
            <KPICard icon={Users} label="Total Jobs" value={String(analytics.totalJobs)} />
            <KPICard icon={BarChart3} label="Jobs Ativos" value={String(analytics.activeJobs)} color="text-blue-600" />
          </div>

          {/* Charts Row 1 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Monthly Revenue */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Receita Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <AreaChart data={analytics.monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip formatter={(v: number) => fmtBRL(v)} />
                    <Area type="monotone" dataKey="receita" fill="hsl(350 67% 37% / 0.2)" stroke="hsl(350 67% 37%)" strokeWidth={2} name="Receita" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Pipeline Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Pipeline</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={analytics.pipelineData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, value }) => `${name} (${value})`}
                    >
                      {analytics.pipelineData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row 2 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top Customers */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Top 10 Clientes por Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.topCustomers} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" tickFormatter={(v) => fmtK(v)} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 10 }} className="fill-muted-foreground" />
                    <Tooltip formatter={(v: number) => fmtBRL(v)} />
                    <Bar dataKey="value" fill="hsl(350 67% 37%)" radius={[0, 4, 4, 0]} name="Receita" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Margin Distribution */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Distribuição de Margem</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.marginData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                    <Tooltip />
                    <Bar dataKey="value" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} name="Orçamentos" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Conversion Trend */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Orçamentos vs Ganhos por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={analytics.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="mes" tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <YAxis tick={{ fontSize: 11 }} className="fill-muted-foreground" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="orcamentos" stroke="hsl(217 91% 60%)" strokeWidth={2} name="Orçamentos" dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="ganhos" stroke="hsl(142 71% 45%)" strokeWidth={2} name="Ganhos" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function KPICard({
  icon: Icon, label, value, sub, color, positive,
}: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string; positive?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-4 pb-3 px-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className={`h-4 w-4 ${color || "text-muted-foreground"}`} />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className={`text-xl font-bold ${color || ""}`}>{value}</p>
        {sub && <p className="text-[11px] text-muted-foreground mt-0.5">{sub}</p>}
      </CardContent>
    </Card>
  );
}
