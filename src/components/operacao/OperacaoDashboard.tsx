import { useMemo } from "react";
import { Job, formatCurrency, formatDate, getAllTasks, chargeStatusMap } from "./types";
import { mockJobs } from "./mockData";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Briefcase, Play, CheckCircle, DollarSign, TrendingUp, Calendar, AlertTriangle, CreditCard } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";

const COLORS = { Finalized: "#22C55E", InProgress: "#3B82F6", Paused: "#F59E0B", NotStarted: "#94A3B8", Cancelled: "#EF4444" };

const OperacaoDashboard = () => {
  const jobs = mockJobs;

  const kpis = useMemo(() => {
    const inProduction = jobs.filter(j => j.production.status === "Started" && !j.isFinalized).length;
    const finalized = jobs.filter(j => j.isFinalized).length;
    const totalRevenue = jobs.reduce((s, j) => s + j.totalPrice, 0);
    const realizedJobs = jobs.filter(j => j.costs.realized.ProfitPercentual > 0);
    const avgMargin = realizedJobs.length ? realizedJobs.reduce((s, j) => s + j.costs.realized.ProfitPercentual, 0) / realizedJobs.length : 0;
    const overdue = jobs.filter(j => j.deliveryNeeded && new Date(j.deliveryNeeded) < new Date() && !j.isFinalized).length;
    const chargePending = jobs.filter(j => j.jobChargeStatus === "Pending" || j.jobChargeStatus === "Overdue").length;

    return { total: jobs.length, inProduction, finalized, totalRevenue, avgMargin, overdue, chargePending };
  }, [jobs]);

  // Tasks distribution for pie
  const taskDist = useMemo(() => {
    const allTasks = jobs.flatMap(j => getAllTasks(j));
    const counts: Record<string, number> = { Finalized: 0, InProgress: 0, Paused: 0, NotStarted: 0, Cancelled: 0 };
    allTasks.forEach(t => { counts[t.productionStatus] = (counts[t.productionStatus] || 0) + 1; });
    return Object.entries(counts).filter(([, v]) => v > 0).map(([name, value]) => ({ name: { Finalized: "Finalizados", InProgress: "Em Produção", Paused: "Pausados", NotStarted: "Não Iniciados", Cancelled: "Cancelados" }[name] || name, value, fill: COLORS[name as keyof typeof COLORS] }));
  }, [jobs]);

  // Cost comparison bar chart
  const costComparison = useMemo(() => jobs.map(j => ({
    name: `#${j.code}`,
    Orçado: j.costs.budgeted.ProductionCost,
    Realizado: j.costs.realized.ProductionCost,
  })), [jobs]);

  // Margin bar chart
  const marginData = useMemo(() =>
    jobs.filter(j => j.costs.realized.ProfitPercentual > 0)
      .map(j => ({ name: `#${j.code}`, margin: j.costs.realized.ProfitPercentual }))
      .sort((a, b) => b.margin - a.margin),
  [jobs]);

  const kpiCards = [
    { label: "Jobs Total", value: kpis.total.toString(), icon: Briefcase, badge: "bg-muted text-muted-foreground" },
    { label: "Em Produção", value: kpis.inProduction.toString(), icon: Play, badge: "bg-blue-100 text-blue-700" },
    { label: "Finalizados", value: kpis.finalized.toString(), icon: CheckCircle, badge: "bg-emerald-100 text-emerald-700" },
    { label: "Receita Total", value: formatCurrency(kpis.totalRevenue), icon: DollarSign, badge: "bg-muted text-muted-foreground" },
    { label: "Margem Média", value: `${kpis.avgMargin.toFixed(1)}%`, icon: TrendingUp, badge: "bg-emerald-100 text-emerald-700" },
    { label: "Prazo Médio", value: "12 dias", icon: Calendar, badge: "bg-muted text-muted-foreground" },
    { label: "Jobs Atrasados", value: kpis.overdue.toString(), icon: AlertTriangle, badge: "bg-red-100 text-red-700" },
    { label: "Cobrança Pendente", value: kpis.chargePending.toString(), icon: CreditCard, badge: "bg-amber-100 text-amber-700" },
  ];

  return (
    <div className="space-y-6">
      {/* KPI Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {kpiCards.map(kpi => {
          const Icon = kpi.icon;
          return (
            <Card key={kpi.label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${kpi.badge}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="text-lg font-bold">{kpi.value}</p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pie - Tasks por Status */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Tasks por Status de Produção</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={taskDist} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={90} paddingAngle={2}>
                  {taskDist.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar - Custo Orçado vs Realizado */}
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm">Custo Orçado vs Realizado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={costComparison}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={10} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Legend />
                <Bar dataKey="Orçado" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                <Bar dataKey="Realizado" fill="#22C55E" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Horizontal Bar - Margem por Job */}
        <Card className="md:col-span-2">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Margem Realizada por Job</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={marginData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" domain={[0, 60]} tickFormatter={v => `${v}%`} fontSize={11} />
                <YAxis type="category" dataKey="name" width={60} fontSize={12} />
                <Tooltip formatter={(v: number) => `${v.toFixed(1)}%`} />
                <Bar dataKey="margin" radius={[0, 4, 4, 0]}>
                  {marginData.map((e, i) => <Cell key={i} fill={e.margin >= 40 ? "#22C55E" : e.margin >= 30 ? "#3B82F6" : "#F59E0B"} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Últimos Jobs Table */}
      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-sm">Últimos Jobs</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-muted-foreground text-xs">
                  <th className="text-left py-2 px-2">Job</th>
                  <th className="text-left py-2 px-2">Título</th>
                  <th className="text-left py-2 px-2">Cliente</th>
                  <th className="text-left py-2 px-2">Progresso</th>
                  <th className="text-left py-2 px-2">Entrega</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-left py-2 px-2">Cobrança</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(j => {
                  const pct = j.production.progressPercentage ?? 0;
                  return (
                    <tr key={j.id} className="border-b hover:bg-muted/50">
                      <td className="py-2 px-2 font-bold text-primary">#{j.code}</td>
                      <td className="py-2 px-2 max-w-[200px] truncate">{j.title}</td>
                      <td className="py-2 px-2">{j.customerName}</td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5 w-24">
                          <Progress value={pct} className="h-1.5 flex-1" />
                          <span className="text-[10px]">{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-xs">{formatDate(j.deliveryNeeded)}</td>
                      <td className="py-2 px-2 text-right text-xs">{formatCurrency(j.totalPrice)}</td>
                      <td className="py-2 px-2">
                        <Badge className={`text-[10px] ${chargeStatusMap[j.jobChargeStatus]?.color}`}>{chargeStatusMap[j.jobChargeStatus]?.label}</Badge>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default OperacaoDashboard;
