import { useParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useCSHoldprintData } from "@/hooks/useCSHoldprintData";
import { BarChart3, ArrowLeft, TrendingUp, TrendingDown, DollarSign, Minus } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, AreaChart, Area,
} from "recharts";
import { useMemo } from "react";

const titles: Record<string, string> = {
  "fluxo-caixa": "Fluxo de Caixa",
  "notas-fiscais": "Notas Fiscais",
  comissoes: "Controle de Comissões",
  "vendas-periodo": "Vendas por Período",
  "vendas-analise": "Análise e Estatística",
  lucratividade: "Lucratividade por Produto",
  "ponto-equilibrio": "Ponto de Equilíbrio",
  checkup: "Check-UP",
  "pagos-recebidos": "Pagos x Recebidos",
  dre: "DRE",
};

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--accent))",
  "hsl(210, 70%, 50%)",
  "hsl(150, 60%, 45%)",
  "hsl(40, 80%, 55%)",
  "hsl(0, 65%, 55%)",
  "hsl(270, 50%, 55%)",
  "hsl(180, 50%, 45%)",
];

function fmt(v: number) {
  if (v >= 1_000_000) return `R$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `R$${(v / 1_000).toFixed(1)}K`;
  return `R$${v.toFixed(0)}`;
}

function fmtFull(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function KPICard({ title, value, subtitle, trend }: { title: string; value: string; subtitle?: string; trend?: "up" | "down" | "neutral" }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-2xl font-bold">{value}</span>
          {trend === "up" && <TrendingUp className="h-4 w-4 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-4 w-4 text-red-500" />}
          {trend === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
        </div>
        {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
      </CardContent>
    </Card>
  );
}

function groupByMonth(items: Array<{ date?: string; value?: number }>) {
  const map = new Map<string, number>();
  items.forEach(({ date, value }) => {
    if (!date || !value) return;
    const key = date.slice(0, 7); // YYYY-MM
    map.set(key, (map.get(key) || 0) + value);
  });
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, total]) => ({
      month: month.slice(5) + "/" + month.slice(2, 4),
      total,
    }));
}

// ============ REPORT RENDERERS ============

function FluxoCaixa({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { incomes, expenses } = data;

  const monthlyIncomes = groupByMonth(
    incomes.map(i => ({ date: i.dueDate || i.paidDate, value: i.amount || i.value || 0 }))
  );
  const monthlyExpenses = groupByMonth(
    expenses.map(e => ({ date: e.dueDate || e.paidDate, value: e.amount || e.value || 0 }))
  );

  const allMonths = [...new Set([...monthlyIncomes.map(m => m.month), ...monthlyExpenses.map(m => m.month)])].sort();
  const chartData = allMonths.map(month => ({
    month,
    receitas: monthlyIncomes.find(m => m.month === month)?.total || 0,
    despesas: monthlyExpenses.find(m => m.month === month)?.total || 0,
  }));

  const totalIn = incomes.reduce((s, i) => s + (i.amount || i.value || 0), 0);
  const totalOut = expenses.reduce((s, e) => s + (e.amount || e.value || 0), 0);
  const saldo = totalIn - totalOut;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Receitas" value={fmt(totalIn)} trend="up" />
        <KPICard title="Total Despesas" value={fmt(totalOut)} trend="down" />
        <KPICard title="Saldo" value={fmt(saldo)} trend={saldo >= 0 ? "up" : "down"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Receitas vs Despesas (Mensal)</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Legend />
              <Bar dataKey="receitas" fill="hsl(150, 60%, 45%)" name="Receitas" />
              <Bar dataKey="despesas" fill="hsl(0, 65%, 55%)" name="Despesas" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function VendasPeriodo({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { budgets } = data;

  const monthlyData = useMemo(() => {
    const map = new Map<string, { count: number; total: number }>();
    budgets.forEach(b => {
      const date = b.createdAt || "";
      if (!date) return;
      const key = date.slice(0, 7);
      const entry = map.get(key) || { count: 0, total: 0 };
      entry.count++;
      entry.total += b.totalPrice || 0;
      map.set(key, entry);
    });
    return Array.from(map.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, d]) => ({
        month: month.slice(5) + "/" + month.slice(2, 4),
        orcamentos: d.count,
        valor: d.total,
      }));
  }, [budgets]);

  const totalVendas = budgets.reduce((s, b) => s + (b.totalPrice || 0), 0);
  const aprovados = budgets.filter(b => String(b.budgetState || b.state || "").toLowerCase().includes("approv"));

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Total Orçamentos" value={String(budgets.length)} />
        <KPICard title="Valor Total" value={fmt(totalVendas)} trend="up" />
        <KPICard title="Aprovados" value={String(aprovados.length)} subtitle={`${budgets.length > 0 ? ((aprovados.length / budgets.length) * 100).toFixed(0) : 0}% de conversão`} />
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução de Orçamentos por Mês</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" tickFormatter={fmt} />
              <Tooltip formatter={(v: number, name: string) => name === "valor" ? fmtFull(v) : v} />
              <Legend />
              <Area yAxisId="left" type="monotone" dataKey="orcamentos" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" name="Qtd Orçamentos" />
              <Line yAxisId="right" type="monotone" dataKey="valor" stroke="hsl(150, 60%, 45%)" name="Valor (R$)" />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function VendasAnalise({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { budgets } = data;

  const statusMap = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    budgets.forEach(b => {
      const status = String(b.budgetState || b.state || "Indefinido");
      const entry = map.get(status) || { count: 0, value: 0 };
      entry.count++;
      entry.value += b.totalPrice || 0;
      map.set(status, entry);
    });
    return Array.from(map.entries()).map(([name, d]) => ({ name, ...d }));
  }, [budgets]);

  const avgTicket = budgets.length > 0
    ? budgets.reduce((s, b) => s + (b.totalPrice || 0), 0) / budgets.length
    : 0;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Ticket Médio" value={fmt(avgTicket)} />
        <KPICard title="Total Orçamentos" value={String(budgets.length)} />
        <KPICard title="Status Distintos" value={String(statusMap.length)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Distribuição por Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={statusMap} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {statusMap.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip formatter={(v: number) => fmtFull(v)} />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function PagosRecebidos({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { incomes, expenses } = data;

  const paidIncome = incomes.filter(i => i.paidDate).reduce((s, i) => s + (i.amount || i.value || 0), 0);
  const pendingIncome = incomes.filter(i => !i.paidDate).reduce((s, i) => s + (i.amount || i.value || 0), 0);
  const paidExpense = expenses.filter(e => e.paidDate).reduce((s, e) => s + (e.amount || e.value || 0), 0);
  const pendingExpense = expenses.filter(e => !e.paidDate).reduce((s, e) => s + (e.amount || e.value || 0), 0);

  const chartData = [
    { name: "Recebido", valor: paidIncome },
    { name: "A Receber", valor: pendingIncome },
    { name: "Pago", valor: paidExpense },
    { name: "A Pagar", valor: pendingExpense },
  ];

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Recebido" value={fmt(paidIncome)} trend="up" />
        <KPICard title="A Receber" value={fmt(pendingIncome)} trend="neutral" />
        <KPICard title="Pago" value={fmt(paidExpense)} trend="down" />
        <KPICard title="A Pagar" value={fmt(pendingExpense)} trend="neutral" />
      </div>
      <Card>
        <CardHeader><CardTitle>Comparativo Pagos x Recebidos</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" width={100} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Bar dataKey="valor" fill="hsl(var(--primary))">
                {chartData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function DRE({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { incomes, expenses, jobs } = data;

  const receita = incomes.reduce((s, i) => s + (i.amount || i.value || 0), 0);
  const custos = expenses.reduce((s, e) => s + (e.amount || e.value || 0), 0);
  const jobRevenue = jobs.reduce((s, j) => s + (j.totalPrice || j.costs?.budgetedTotalPrice || 0), 0);
  const receitaTotal = receita > 0 ? receita : jobRevenue;
  const lucro = receitaTotal - custos;
  const margem = receitaTotal > 0 ? (lucro / receitaTotal) * 100 : 0;

  const dreData = [
    { item: "Receita Bruta", valor: receitaTotal },
    { item: "(-) Custos", valor: -custos },
    { item: "= Lucro Bruto", valor: lucro },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <KPICard title="Receita Bruta" value={fmt(receitaTotal)} trend="up" />
        <KPICard title="Custos Totais" value={fmt(custos)} trend="down" />
        <KPICard title="Lucro Bruto" value={fmt(lucro)} trend={lucro >= 0 ? "up" : "down"} />
        <KPICard title="Margem Bruta" value={`${margem.toFixed(1)}%`} trend={margem >= 0 ? "up" : "down"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Demonstrativo de Resultados</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {dreData.map((row) => (
              <div key={row.item} className={`flex justify-between py-2 px-3 rounded ${row.item.startsWith("=") ? "bg-muted font-bold" : ""}`}>
                <span>{row.item}</span>
                <span className={row.valor < 0 ? "text-red-500" : "text-green-600"}>{fmtFull(Math.abs(row.valor))}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function CheckUp({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { jobs, customers, budgets, suppliers } = data;

  const activeJobs = jobs.filter(j => !j.isFinalized).length;
  const finishedJobs = jobs.filter(j => j.isFinalized).length;
  const activeCustomers = customers.filter(c => c.active !== false).length;

  const statusData = useMemo(() => {
    const map = new Map<string, number>();
    jobs.forEach(j => {
      const s = j.productionStatus || j.status || "Indefinido";
      map.set(s, (map.get(s) || 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [jobs]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard title="Jobs Ativos" value={String(activeJobs)} />
        <KPICard title="Jobs Finalizados" value={String(finishedJobs)} />
        <KPICard title="Clientes Ativos" value={String(activeCustomers)} />
        <KPICard title="Fornecedores" value={String(suppliers.length)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Distribuição de Jobs por Status</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function Lucratividade({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { jobs } = data;

  const jobsWithCosts = useMemo(() => {
    return jobs
      .filter(j => j.costs && (j.costs.budgetedTotalPrice || j.totalPrice))
      .map(j => ({
        name: (j.title || j.description || `Job ${j.code || j.id}`).slice(0, 30),
        receita: j.costs?.budgetedTotalPrice || j.totalPrice || 0,
        custo: j.costs?.realizedTotalPrice || 0,
        margem: ((j.costs?.budgetedTotalPrice || j.totalPrice || 0) - (j.costs?.realizedTotalPrice || 0)),
      }))
      .sort((a, b) => b.receita - a.receita)
      .slice(0, 15);
  }, [jobs]);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Jobs Analisados" value={String(jobsWithCosts.length)} />
        <KPICard title="Maior Receita" value={fmt(jobsWithCosts[0]?.receita || 0)} />
        <KPICard title="Receita Média" value={fmt(jobsWithCosts.length > 0 ? jobsWithCosts.reduce((s, j) => s + j.receita, 0) / jobsWithCosts.length : 0)} />
      </div>
      <Card>
        <CardHeader><CardTitle>Top 15 Jobs por Receita</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={jobsWithCosts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={fmt} />
              <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Legend />
              <Bar dataKey="receita" fill="hsl(150, 60%, 45%)" name="Receita" />
              <Bar dataKey="custo" fill="hsl(0, 65%, 55%)" name="Custo Realizado" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function PontoEquilibrio({ data }: { data: NonNullable<ReturnType<typeof useCSHoldprintData>["data"]> }) {
  const { incomes, expenses } = data;

  const monthlyData = useMemo(() => {
    const incMap = new Map<string, number>();
    const expMap = new Map<string, number>();
    incomes.forEach(i => {
      const d = i.dueDate || i.paidDate || "";
      if (!d) return;
      const key = d.slice(0, 7);
      incMap.set(key, (incMap.get(key) || 0) + (i.amount || i.value || 0));
    });
    expenses.forEach(e => {
      const d = e.dueDate || e.paidDate || "";
      if (!d) return;
      const key = d.slice(0, 7);
      expMap.set(key, (expMap.get(key) || 0) + (e.amount || e.value || 0));
    });
    const months = [...new Set([...incMap.keys(), ...expMap.keys()])].sort();
    let acumulado = 0;
    return months.map(m => {
      const rec = incMap.get(m) || 0;
      const desp = expMap.get(m) || 0;
      acumulado += rec - desp;
      return {
        month: m.slice(5) + "/" + m.slice(2, 4),
        receitas: rec,
        despesas: desp,
        acumulado,
      };
    });
  }, [incomes, expenses]);

  const breakEvenMonth = monthlyData.find(m => m.acumulado >= 0);

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KPICard title="Meses Analisados" value={String(monthlyData.length)} />
        <KPICard title="Saldo Acumulado" value={fmt(monthlyData[monthlyData.length - 1]?.acumulado || 0)} trend={monthlyData[monthlyData.length - 1]?.acumulado >= 0 ? "up" : "down"} />
        <KPICard title="Break-even" value={breakEvenMonth?.month || "Não atingido"} />
      </div>
      <Card>
        <CardHeader><CardTitle>Evolução do Saldo Acumulado</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis tickFormatter={fmt} />
              <Tooltip formatter={(v: number) => fmtFull(v)} />
              <Legend />
              <Line type="monotone" dataKey="acumulado" stroke="hsl(var(--primary))" strokeWidth={2} name="Saldo Acumulado" />
              <Line type="monotone" dataKey="receitas" stroke="hsl(150, 60%, 45%)" strokeDasharray="5 5" name="Receitas" />
              <Line type="monotone" dataKey="despesas" stroke="hsl(0, 65%, 55%)" strokeDasharray="5 5" name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </>
  );
}

function GenericPlaceholder({ title }: { title: string }) {
  return (
    <Card>
      <CardContent className="py-16 text-center">
        <p className="text-muted-foreground">O relatório <strong>{title}</strong> requer dados específicos que ainda não estão disponíveis na API. Em breve será habilitado.</p>
      </CardContent>
    </Card>
  );
}

// ============ ENDPOINT MAP PER REPORT ============

const endpointsBySlug: Record<string, string[]> = {
  "fluxo-caixa": ["incomes", "expenses"],
  "vendas-periodo": ["budgets"],
  "vendas-analise": ["budgets"],
  "pagos-recebidos": ["incomes", "expenses"],
  dre: ["incomes", "expenses", "jobs"],
  checkup: ["jobs", "customers", "budgets", "suppliers"],
  lucratividade: ["jobs"],
  "ponto-equilibrio": ["incomes", "expenses"],
};

// ============ MAIN COMPONENT ============

export default function HoldprintRelatorioDetalhe() {
  const { slug } = useParams();
  const title = titles[slug || ""] || "Relatório";
  const endpoints = endpointsBySlug[slug || ""] || ["customers", "jobs"];
  const { data, isLoading, error } = useCSHoldprintData(endpoints);

  const renderReport = () => {
    if (!data) return null;
    switch (slug) {
      case "fluxo-caixa": return <FluxoCaixa data={data} />;
      case "vendas-periodo": return <VendasPeriodo data={data} />;
      case "vendas-analise": return <VendasAnalise data={data} />;
      case "pagos-recebidos": return <PagosRecebidos data={data} />;
      case "dre": return <DRE data={data} />;
      case "checkup": return <CheckUp data={data} />;
      case "lucratividade": return <Lucratividade data={data} />;
      case "ponto-equilibrio": return <PontoEquilibrio data={data} />;
      case "notas-fiscais": return <GenericPlaceholder title={title} />;
      case "comissoes": return <GenericPlaceholder title={title} />;
      default: return <GenericPlaceholder title={title} />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/holdprint/relatorios">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <BarChart3 className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          <p className="text-muted-foreground text-sm">
            {isLoading ? "Carregando dados..." : error ? "Erro ao carregar dados" : `Dados atualizados — ${data?.fetchedAt ? new Date(data.fetchedAt).toLocaleString("pt-BR") : ""}`}
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-lg" />)}
          </div>
          <Skeleton className="h-72 rounded-lg" />
        </div>
      ) : (
        <div className="space-y-6">{renderReport()}</div>
      )}
    </div>
  );
}
