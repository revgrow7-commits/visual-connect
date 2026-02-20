import React, { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  X, Bell, ChevronDown, ChevronUp, MessageSquarePlus, CalendarPlus,
  PhoneCall, Loader2, Users, Heart, TrendingUp, TrendingDown,
  AlertTriangle, DollarSign, Package, Clock, Target, BarChart3,
  Minus, ArrowUpRight, ArrowDownRight
} from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { mockTasks } from "./workspaceData";
import CSMeetingDialog from "./CSMeetingDialog";
import type { CSSectionId, CSWorkspaceCustomer } from "./types";
import type { CSHoldprintData } from "@/hooks/useCSHoldprintData";
import { useCSTickets } from "@/hooks/useCSData";

const taskIcons: Record<string, string> = { call: "📞", email: "📧", visit: "🏠", review: "📝", followup: "🔄" };
const priorityColors: Record<string, string> = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-muted text-muted-foreground" };

interface Props {
  onNavigate: (section: CSSectionId) => void;
  holdprintData?: CSHoldprintData | null;
  wsCustomers?: CSWorkspaceCustomer[] | null;
  isLoading?: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 }).format(v);

const CSResumoSection: React.FC<Props> = ({ onNavigate, holdprintData, wsCustomers, isLoading }) => {
  const [alertsExpanded, setAlertsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(mockTasks.filter(t => t.completed).map(t => t.id)));

  const { data: tickets } = useCSTickets();

  const isRealData = wsCustomers && wsCustomers.length > 0;
  const customers = wsCustomers || [];
  const jobs = holdprintData?.jobs || [];
  const budgets = holdprintData?.budgets || [];
  const incomes = holdprintData?.incomes || [];

  // === COMPUTED KPIs ===
  const kpis = useMemo(() => {
    const totalClients = customers.length;
    const avgHealth = totalClients > 0 ? Math.round(customers.reduce((s, c) => s + c.healthScore, 0) / totalClients) : 0;
    const churnRisk = customers.filter(c => c.riskLevel === "critical" || c.riskLevel === "high").length;

    // Revenue from jobs
    const totalRevenue = customers.reduce((s, c) => s + c.totalRevenue, 0);
    const totalJobs = jobs.length;

    // Delivery stats from jobs
    const recentJobs = jobs.filter(j => j.isFinalized);
    const onTimeJobs = recentJobs.filter(j => {
      if (!j.deliveryNeeded || !j.finalizedTime) return true;
      return new Date(j.finalizedTime) <= new Date(j.deliveryNeeded);
    });
    const deliveryPct = recentJobs.length > 0 ? Math.round((onTimeJobs.length / recentJobs.length) * 100) : 0;

    // Budget pipeline
    const openBudgets = budgets.filter(b => {
      const state = typeof b.budgetState === "number" ? b.budgetState : parseInt(String(b.budgetState || b.state || "0"));
      return state <= 2;
    });
    const pipelineValue = openBudgets.reduce((s, b) => {
      const price = b.totalPrice || (b as any).proposes?.[0]?.totalPrice || 0;
      return s + price;
    }, 0);

    // Open tickets
    const openTickets = (tickets || []).filter(t => t.status === "open" || t.status === "in_progress").length;
    const slaBreach = (tickets || []).filter(t => t.sla_resolution_breached || t.sla_response_breached).length;

    // Expenses
    const totalExpenses = (holdprintData?.expenses || []).reduce((s, e) => s + (e.amount || e.value || 0), 0);
    const totalSuppliers = (holdprintData?.suppliers || []).length;

    return {
      totalClients, avgHealth, churnRisk, totalRevenue, totalJobs,
      deliveryPct, pipelineValue, openBudgets: openBudgets.length,
      openTickets, slaBreach, totalExpenses, totalSuppliers,
      recentJobsCount: recentJobs.length
    };
  }, [customers, jobs, budgets, tickets, holdprintData]);

  // === SMART ALERTS from real data ===
  const smartAlerts = useMemo(() => {
    const alerts: Array<{
      id: string;
      severity: "critical" | "high" | "medium" | "info";
      title: string;
      description: string;
      actionLabel: string;
      actionTarget: CSSectionId;
    }> = [];

    // SLA breaches from real tickets
    const breachedTickets = (tickets || []).filter(t => (t.sla_resolution_breached || t.sla_response_breached) && t.status !== "resolved" && t.status !== "cancelled");
    if (breachedTickets.length > 0) {
      alerts.push({
        id: "sla-breach",
        severity: "critical",
        title: `${breachedTickets.length} SLA${breachedTickets.length > 1 ? "s" : ""} Estourado${breachedTickets.length > 1 ? "s" : ""}`,
        description: breachedTickets.slice(0, 2).map(t => `${t.code} — ${t.customer_name}`).join("; "),
        actionLabel: "Ver tickets",
        actionTarget: "tickets",
      });
    }

    // Churn risk from health score
    const riskCustomers = customers.filter(c => c.riskLevel === "critical" || c.riskLevel === "high");
    if (riskCustomers.length > 0) {
      alerts.push({
        id: "churn-risk",
        severity: "high",
        title: `${riskCustomers.length} Cliente${riskCustomers.length > 1 ? "s" : ""} em Risco`,
        description: riskCustomers.slice(0, 3).map(c => `${c.name} (HS: ${c.healthScore})`).join(", "),
        actionLabel: "Ver clientes",
        actionTarget: "health",
      });
    }

    // Open tickets high priority
    const urgentTickets = (tickets || []).filter(t => (t.priority === "critical" || t.priority === "high") && t.status === "open");
    if (urgentTickets.length > 0) {
      alerts.push({
        id: "urgent-tickets",
        severity: "high",
        title: `${urgentTickets.length} Ticket${urgentTickets.length > 1 ? "s" : ""} Urgente${urgentTickets.length > 1 ? "s" : ""}`,
        description: urgentTickets.slice(0, 2).map(t => `${t.code} — ${t.customer_name}`).join("; "),
        actionLabel: "Ver tickets",
        actionTarget: "tickets",
      });
    }

    // Customers declining (health score dropping)
    const declining = customers.filter(c => c.trend === "down" && c.healthScore < 70);
    if (declining.length > 0) {
      alerts.push({
        id: "declining-health",
        severity: "medium",
        title: `${declining.length} Score${declining.length > 1 ? "s" : ""} em Queda`,
        description: declining.slice(0, 2).map(c => c.name).join(", "),
        actionLabel: "Ver health",
        actionTarget: "health",
      });
    }

    return alerts;
  }, [customers, tickets]);

  const visibleAlerts = smartAlerts.filter(a => !dismissedAlerts.has(a.id));
  const totalTasks = mockTasks.length;
  const doneTasks = completedTasks.size;

  // Health distribution for mini chart
  const healthDist = useMemo(() => {
    if (customers.length === 0) return [];
    return [
      { name: "90+", value: customers.filter(c => c.healthScore >= 90).length, fill: "hsl(142 71% 35%)" },
      { name: "70-89", value: customers.filter(c => c.healthScore >= 70 && c.healthScore < 90).length, fill: "hsl(142 71% 55%)" },
      { name: "50-69", value: customers.filter(c => c.healthScore >= 50 && c.healthScore < 70).length, fill: "hsl(45 93% 47%)" },
      { name: "<50", value: customers.filter(c => c.healthScore < 50).length, fill: "hsl(0 84% 60%)" },
    ].filter(d => d.value > 0);
  }, [customers]);

  // Revenue by month for mini chart
  const revenueByMonth = useMemo(() => {
    if (jobs.length === 0) return [];
    const monthMap = new Map<string, number>();
    jobs.forEach(j => {
      const date = j.finalizedTime || j.createdAt || j.creationTime;
      if (!date) return;
      const d = new Date(date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const val = j.costs?.budgetedTotalPrice || j.costs?.approvedTotalPrice || j.totalPrice || 0;
      monthMap.set(key, (monthMap.get(key) || 0) + val);
    });
    return Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([month, revenue]) => ({
        month: month.split("-").reverse().join("/"),
        revenue,
      }));
  }, [jobs]);

  const severityStyles: Record<string, string> = {
    critical: "bg-red-50 border-l-4 border-l-red-500 dark:bg-red-950/30",
    high: "bg-orange-50 border-l-4 border-l-orange-500 dark:bg-orange-950/30",
    medium: "bg-yellow-50 border-l-4 border-l-yellow-400 dark:bg-yellow-950/30",
    info: "bg-blue-50 border-l-4 border-l-blue-500 dark:bg-blue-950/30",
  };

  const scheduleItems = mockTasks.filter(t => !completedTasks.has(t.id)).map(t => ({
    time: t.dueTime,
    icon: taskIcons[t.type],
    label: `${t.customerName.split(" ")[0]} (${t.type})`,
  }));

  return (
    <div className="space-y-6">
      {/* Data source */}
      <div className="flex items-center gap-2">
        <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
          {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando Holdprint...</> : isRealData ? `🟢 ${kpis.totalClients} clientes • ${kpis.totalJobs} jobs • ${kpis.openBudgets} orçamentos abertos` : "🟡 Dados demo"}
        </Badge>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <KpiCard icon={Users} label="Clientes" value={String(kpis.totalClients)} onClick={() => onNavigate("clientes")} />
        <KpiCard icon={Heart} label="Health Score" value={String(kpis.avgHealth)} sub="/100" color={kpis.avgHealth >= 70 ? "text-green-600" : kpis.avgHealth >= 50 ? "text-yellow-600" : "text-red-600"} onClick={() => onNavigate("health")} />
        <KpiCard icon={AlertTriangle} label="Churn Risk" value={String(kpis.churnRisk)} color={kpis.churnRisk > 0 ? "text-red-600" : "text-green-600"} onClick={() => onNavigate("health")} />
        <KpiCard icon={Package} label="Entregas on-time" value={`${kpis.deliveryPct}%`} color={kpis.deliveryPct >= 80 ? "text-green-600" : "text-yellow-600"} onClick={() => onNavigate("entregas")} />
        <KpiCard icon={Target} label="Pipeline" value={fmt(kpis.pipelineValue)} sub={`${kpis.openBudgets} abertos`} onClick={() => onNavigate("upsell")} />
        <KpiCard icon={DollarSign} label="Receita Total" value={fmt(kpis.totalRevenue)} onClick={() => onNavigate("receita")} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left Column (3/5) */}
        <div className="lg:col-span-3 space-y-5">
          {/* Smart Alerts */}
          {visibleAlerts.length > 0 && (
            <Card>
              <CardContent className="p-4">
                <button onClick={() => setAlertsExpanded(!alertsExpanded)} className="w-full flex items-center gap-2 mb-3">
                  <Bell className="h-4 w-4 text-red-500" />
                  <span className="font-semibold text-sm">Alertas Ativos ({visibleAlerts.length})</span>
                  {alertsExpanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
                </button>
                {alertsExpanded && (
                  <div className="space-y-2">
                    {visibleAlerts.map((alert) => (
                      <div key={alert.id} className={`flex items-start gap-3 p-3 rounded-lg ${severityStyles[alert.severity]} ${alert.severity === "critical" ? "animate-pulse" : ""}`}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{alert.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{alert.description}</p>
                        </div>
                        <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" onClick={() => onNavigate(alert.actionTarget)}>{alert.actionLabel}</Button>
                        <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.id))} className="text-muted-foreground hover:text-foreground flex-shrink-0"><X className="h-4 w-4" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Tasks */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Tarefas do Dia</h3>
                <span className="text-xs text-muted-foreground">{doneTasks} de {totalTasks} concluídas</span>
              </div>
              <Progress value={(doneTasks / totalTasks) * 100} className="h-2 mb-4" />
              <div className="space-y-1.5">
                {mockTasks.map((task) => {
                  const done = completedTasks.has(task.id);
                  return (
                    <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors ${done ? "opacity-40" : ""}`}>
                      <Checkbox checked={done} onCheckedChange={(checked) => {
                        const next = new Set(completedTasks);
                        if (checked) next.add(task.id); else next.delete(task.id);
                        setCompletedTasks(next);
                      }} />
                      <span className="text-sm flex-shrink-0">{taskIcons[task.type]}</span>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${done ? "line-through" : ""}`}>{task.title}</p>
                        <p className="text-[10px] text-muted-foreground">{task.dueTime} • {task.customerName}</p>
                      </div>
                      <Badge className={`text-[10px] ${priorityColors[task.priority]}`}>{task.priority}</Badge>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Health Score + Revenue Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("health")}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Health Score</h3>
                {healthDist.length > 0 ? (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width={80} height={80}>
                      <PieChart>
                        <Pie data={healthDist} cx="50%" cy="50%" innerRadius={22} outerRadius={36} dataKey="value" startAngle={90} endAngle={-270}>
                          {healthDist.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1">
                      {healthDist.map(d => (
                        <div key={d.name} className="flex items-center gap-2 text-xs">
                          <div className="h-2.5 w-2.5 rounded-full" style={{ background: d.fill }} />
                          <span className="text-muted-foreground">{d.name}</span>
                          <span className="font-bold ml-auto">{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("receita")}>
              <CardContent className="p-4">
                <h3 className="font-semibold text-sm mb-3">Receita Mensal</h3>
                {revenueByMonth.length > 0 ? (
                  <ResponsiveContainer width="100%" height={80}>
                    <BarChart data={revenueByMonth}>
                      <XAxis dataKey="month" tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">Sem dados</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Operational Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <MiniStat label="Tickets Abertos" value={kpis.openTickets} color={kpis.openTickets > 3 ? "text-red-600" : "text-foreground"} onClick={() => onNavigate("tickets")} />
            <MiniStat label="SLA Estourados" value={kpis.slaBreach} color={kpis.slaBreach > 0 ? "text-red-600" : "text-green-600"} onClick={() => onNavigate("tickets")} />
            <MiniStat label="Fornecedores" value={kpis.totalSuppliers} onClick={() => {}} />
            <MiniStat label="Jobs Finalizados" value={kpis.recentJobsCount} onClick={() => onNavigate("entregas")} />
          </div>
        </div>

        {/* Right Column (2/5) */}
        <div className="lg:col-span-2 space-y-5">
          {/* Schedule */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Agenda do Dia</h3>
                <CSMeetingDialog trigger={<button className="text-xs text-primary hover:underline">+ Reunião</button>} />
              </div>
              <div className="space-y-0.5">
                {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => {
                  const event = scheduleItems.find(s => s.time === time);
                  const isNow = time === "09:00";
                  return (
                    <div key={time} className={`flex items-center gap-2 py-1 text-xs ${isNow ? "border-l-2 border-l-primary pl-2 bg-primary/5 rounded-r" : "pl-3"}`}>
                      <span className="w-10 text-muted-foreground font-mono">{time}</span>
                      {event ? (
                        <span className="text-foreground">{event.icon} {event.label}</span>
                      ) : (
                        <span className="text-muted-foreground/20">────</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Top Clients by Revenue */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold text-sm mb-3">Top 5 Clientes</h3>
              <div className="space-y-2">
                {customers.slice(0, 5).map((c, i) => (
                  <div key={c.id} className="flex items-center gap-2 text-xs">
                    <span className="w-4 text-muted-foreground font-mono">{i + 1}.</span>
                    <span className="flex-1 truncate">{c.name}</span>
                    <div className="flex items-center gap-1">
                      {c.trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
                      {c.trend === "down" && <ArrowDownRight className="h-3 w-3 text-red-500" />}
                      {c.trend === "stable" && <Minus className="h-3 w-3 text-muted-foreground" />}
                    </div>
                    <span className="font-bold text-right w-20">{fmt(c.totalRevenue)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={() => onNavigate("tickets")}>
              <MessageSquarePlus className="h-4 w-4" /> Nova Reclamação
            </Button>
            <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={() => onNavigate("visitas")}>
              <CalendarPlus className="h-4 w-4" /> Agendar Visita
            </Button>
            <Button variant="outline" size="sm" className="gap-2 justify-start" onClick={() => onNavigate("regua")}>
              <PhoneCall className="h-4 w-4" /> Registrar Contato
            </Button>
            <CSMeetingDialog />
          </div>
        </div>
      </div>
    </div>
  );
};

// === Sub-components ===

function KpiCard({ icon: Icon, label, value, sub, color, onClick }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color?: string; onClick?: () => void;
}) {
  return (
    <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={onClick}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
        </div>
        <p className={`text-lg font-bold ${color || "text-foreground"}`}>
          {value}
          {sub && <span className="text-xs font-normal text-muted-foreground ml-1">{sub}</span>}
        </p>
      </CardContent>
    </Card>
  );
}

function MiniStat({ label, value, color, onClick }: {
  label: string; value: number; color?: string; onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="text-left p-3 rounded-lg border hover:bg-muted/30 transition-colors">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold ${color || "text-foreground"}`}>{value}</p>
    </button>
  );
}

export default CSResumoSection;
