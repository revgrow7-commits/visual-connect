import React, { forwardRef } from "react";
import { mockBudgets, monthlyData } from "./mockData";
import { formatCurrency } from "./types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, Trophy, XCircle, DollarSign, BarChart3, TrendingUp, Wallet } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend, Cell } from "recharts";

const DashboardTab = forwardRef<HTMLDivElement>((_, ref) => {
  const total = mockBudgets.length;
  const openBudgets = mockBudgets.filter(b => b.budgetState === 1);
  const wonBudgets = mockBudgets.filter(b => b.budgetState === 3);
  const lostBudgets = mockBudgets.filter(b => b.budgetState === 2);

  const wonRevenue = wonBudgets.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);
  const avgTicket = wonBudgets.length > 0 ? wonRevenue / wonBudgets.length : 0;
  const avgMargin = wonBudgets.length > 0 ? wonBudgets.reduce((s, b) => s + b.proposals[0].totalProfitPercentual, 0) / wonBudgets.length : 0;
  const pipelineOpen = openBudgets.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);

  const kpis = [
    { label: "Total Orçamentos", value: total, icon: FileText, badge: "secondary" as const },
    { label: "Em Aberto", value: openBudgets.length, icon: Clock, badge: "secondary" as const, badgeCls: "bg-blue-100 text-blue-700" },
    { label: "Ganhos", value: wonBudgets.length, icon: Trophy, badge: "secondary" as const, badgeCls: "bg-green-100 text-green-700" },
    { label: "Perdidos", value: lostBudgets.length, icon: XCircle, badge: "secondary" as const, badgeCls: "bg-red-100 text-red-700" },
  ];

  const kpisFinancial = [
    { label: "Receita Ganha", value: formatCurrency(wonRevenue), icon: DollarSign, color: "text-green-600" },
    { label: "Ticket Médio", value: formatCurrency(avgTicket), icon: BarChart3, color: "text-foreground" },
    { label: "Margem Média", value: `${avgMargin.toFixed(1)}%`, icon: TrendingUp, color: "text-foreground" },
    { label: "Pipeline Aberto", value: formatCurrency(pipelineOpen), icon: Wallet, color: "text-blue-600" },
  ];

  // Commercial responsible data
  const commercials = ["Ana Paula Ferreira", "Roberto Lima"];
  const commercialData = commercials.map(name => {
    const budgets = mockBudgets.filter(b => b.commercialResponsible === name);
    const wonB = budgets.filter(b => b.budgetState === 3);
    const totalOrçado = budgets.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);
    const totalGanho = wonB.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);
    return { name: name.split(" ")[0] + " " + name.split(" ").slice(-1)[0], totalOrcado: totalOrçado, totalGanho, rate: budgets.length > 0 ? ((wonB.length / budgets.length) * 100).toFixed(0) + "%" : "0%" };
  });

  // Top customers
  const customerRevenue = wonBudgets.reduce((acc, b) => {
    acc[b.customerName] = (acc[b.customerName] || 0) + Math.max(...b.proposals.map(p => p.totalPrice));
    return acc;
  }, {} as Record<string, number>);
  const topCustomers = Object.entries(customerRevenue).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({ name: name.length > 20 ? name.slice(0, 20) + "..." : name, value }));

  // Funnel
  const funnelData = [
    { name: "Total", value: total, fill: "#6B7280" },
    { name: "Em Aberto", value: openBudgets.length, fill: "#3B82F6" },
    { name: "Ganhos", value: wonBudgets.length, fill: "#22C55E" },
    { name: "Perdidos", value: lostBudgets.length, fill: "#EF4444" },
  ];

  return (
    <div ref={ref} className="space-y-6">
      {/* Volume KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
              {kpi.badgeCls && <Badge className={`ml-auto ${kpi.badgeCls}`}>{kpi.value}</Badge>}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpisFinancial.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className={`text-lg font-bold ${kpi.color}`}>{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Funnel */}
        <Card>
          <CardHeader><CardTitle className="text-base">Funil de Conversão</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={funnelData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {funnelData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue by Commercial */}
        <Card>
          <CardHeader><CardTitle className="text-base">Receita por Comercial</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={commercialData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="totalOrcado" name="Orçado" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="totalGanho" name="Ganho" fill="#22C55E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Evolution */}
        <Card>
          <CardHeader><CardTitle className="text-base">Evolução Mensal</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="created" name="Criados" stroke="#3B82F6" strokeWidth={2} />
                <Line type="monotone" dataKey="won" name="Ganhos" stroke="#22C55E" strokeWidth={2} />
                <Line type="monotone" dataKey="lost" name="Perdidos" stroke="#EF4444" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card>
          <CardHeader><CardTitle className="text-base">Top Clientes por Receita</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="value" name="Receita" fill="#22C55E" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
});

DashboardTab.displayName = "DashboardTab";
export default DashboardTab;
