import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, TrendingUp, Repeat, AlertTriangle, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell } from "recharts";
import { mockWSCustomers, revenueMonthlyData } from "./workspaceData";
import type { CSWorkspaceCustomer } from "./types";
import type { CSHoldprintData } from "@/hooks/useCSHoldprintData";

const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

interface CSReceitaSectionProps {
  holdprintData?: CSHoldprintData | null;
  wsCustomers?: CSWorkspaceCustomer[] | null;
  isLoading?: boolean;
}

const scoreColor = (s: number) => {
  if (s >= 70) return "bg-green-500";
  if (s >= 50) return "bg-yellow-500";
  return "bg-red-500";
};

const CSReceitaSection: React.FC<CSReceitaSectionProps> = ({ holdprintData, wsCustomers: realCustomers, isLoading }) => {
  const customers = realCustomers && realCustomers.length > 0 ? realCustomers : mockWSCustomers;
  const isRealData = realCustomers && realCustomers.length > 0;

  // Build monthly revenue from incomes if we have real data
  const monthlyData = holdprintData?.incomes && holdprintData.incomes.length > 0
    ? (() => {
        const byMonth: Record<string, number> = {};
        holdprintData.incomes.forEach(inc => {
          const d = inc.dueDate || inc.paidDate;
          if (!d) return;
          const date = new Date(d as string);
          const key = `${date.toLocaleString("pt-BR", { month: "short" })}/${String(date.getFullYear()).slice(-2)}`;
          byMonth[key] = (byMonth[key] || 0) + (inc.amount || inc.value || 0);
        });
        return Object.entries(byMonth).map(([month, revenue]) => ({ month, revenue, forecast: null }));
      })()
    : revenueMonthlyData;

  const topClients = [...customers].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
  const totalRevenue = customers.reduce((s, c) => s + c.totalRevenue, 0);
  const avgRevenue = customers.length > 0 ? Math.round(totalRevenue / customers.length) : 0;
  const recurrentClients = customers.filter(c => c.totalJobs >= 3).length;
  const revenueAtRisk = customers.filter(c => c.healthScore < 50).reduce((s, c) => s + c.totalRevenue, 0);

  const top3Revenue = topClients.slice(0, 3).reduce((s, c) => s + c.totalRevenue, 0);
  const concentrationData = [
    { name: "Top 3", value: top3Revenue, fill: "hsl(350 67% 37%)" },
    { name: "Outros", value: totalRevenue - top3Revenue, fill: "hsl(0 0% 80%)" },
  ];

  const kpis = [
    { label: "Receita Total (12m)", value: formatCurrency(totalRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-50", extra: isRealData ? "Holdprint" : "▲ 12%" },
    { label: "Receita Média/Cliente", value: formatCurrency(avgRevenue), icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Clientes Recorrentes", value: customers.length > 0 ? `${recurrentClients} (${Math.round((recurrentClients / customers.length) * 100)}%)` : "0", icon: Repeat, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Revenue at Risk", value: formatCurrency(revenueAtRisk), icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando...</> : isRealData ? "🟢 Dados Holdprint (tempo real)" : "🟡 Dados mock (demo)"}
        </Badge>
      </div>

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
                {k.extra && <p className="text-xs text-green-600">{k.extra}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Top 10 Clientes por Receita</h3>
            <ResponsiveContainer width="100%" height={320}>
              <BarChart data={topClients} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <YAxis dataKey="name" type="category" width={140} fontSize={10} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="totalRevenue" name="Receita" fill="hsl(350 67% 37%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Receita Mensal {isRealData ? "(Holdprint)" : "+ Previsão"}</h3>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={10} />
                <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} fontSize={11} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Area type="monotone" dataKey="revenue" name="Receita" stroke="hsl(350 67% 37%)" fill="hsl(350 67% 37% / 0.2)" strokeWidth={2} />
                <Area type="monotone" dataKey="forecast" name="Previsão" stroke="hsl(350 67% 37%)" fill="none" strokeWidth={2} strokeDasharray="5 5" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Concentração de Receita</h3>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={concentrationData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                  {concentrationData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
              </PieChart>
            </ResponsiveContainer>
            {totalRevenue > 0 && Math.round((top3Revenue / totalRevenue) * 100) > 60 && (
              <p className="text-xs text-red-600 text-center mt-2">⚠️ Top 3 concentra {Math.round((top3Revenue / totalRevenue) * 100)}% da receita</p>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Receita por Cliente</h3>
            <div className="overflow-auto max-h-[400px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-center">HS</TableHead>
                    <TableHead className="text-right">Receita 12m</TableHead>
                    <TableHead className="text-center">Jobs</TableHead>
                    <TableHead className="text-right">Ticket Médio</TableHead>
                    <TableHead>Frequência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topClients.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium text-sm">{c.name}</TableCell>
                      <TableCell className="text-center">
                        <div className={`inline-flex h-7 w-7 rounded-full items-center justify-center text-xs font-bold text-white ${scoreColor(c.healthScore)}`}>{c.healthScore}</div>
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(c.totalRevenue)}</TableCell>
                      <TableCell className="text-center">{c.totalJobs}</TableCell>
                      <TableCell className="text-right">{c.totalJobs > 0 ? formatCurrency(Math.round(c.totalRevenue / c.totalJobs)) : "—"}</TableCell>
                      <TableCell className="text-xs capitalize">{c.frequency}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CSReceitaSection;
