import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Bell, ChevronDown, ChevronUp, Heart, MessageSquarePlus, CalendarPlus, PhoneCall, Loader2 } from "lucide-react";
import { LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { mockAlerts, mockTasks, mockWSCustomers } from "./workspaceData";
import { npsEvolution, deliveryChartData } from "./mockData";
import CSMeetingDialog from "./CSMeetingDialog";
import type { CSSectionId, CSWorkspaceCustomer } from "./types";
import type { CSHoldprintData } from "@/hooks/useCSHoldprintData";

const severityStyles: Record<string, string> = {
  critical: "bg-red-50 border-l-4 border-l-red-500",
  high: "bg-orange-50 border-l-4 border-l-orange-500",
  medium: "bg-yellow-50 border-l-4 border-l-yellow-500",
  info: "bg-blue-50 border-l-4 border-l-blue-500",
};

const taskIcons: Record<string, string> = { call: "📞", email: "📧", visit: "🏠", review: "📝", followup: "🔄" };
const priorityColors: Record<string, string> = { high: "bg-red-100 text-red-700", medium: "bg-yellow-100 text-yellow-700", low: "bg-muted text-muted-foreground" };

interface Props {
  onNavigate: (section: CSSectionId) => void;
  holdprintData?: CSHoldprintData | null;
  wsCustomers?: CSWorkspaceCustomer[] | null;
  isLoading?: boolean;
}

const CSResumoSection: React.FC<Props> = ({ onNavigate, holdprintData, wsCustomers, isLoading }) => {
  const [alertsExpanded, setAlertsExpanded] = useState(true);
  const [dismissedAlerts, setDismissedAlerts] = useState<Set<string>>(new Set());
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set(mockTasks.filter(t => t.completed).map(t => t.id)));

  const customers = wsCustomers && wsCustomers.length > 0 ? wsCustomers : mockWSCustomers;
  const isRealData = wsCustomers && wsCustomers.length > 0;

  const visibleAlerts = mockAlerts.filter(a => !dismissedAlerts.has(a.id));
  const totalTasks = mockTasks.length;
  const doneTasks = completedTasks.size;

  const npsSparkData = npsEvolution.slice(-6);
  const deliveryOnTime = deliveryChartData.reduce((s, d) => s + d.onTime, 0);
  const deliveryTotal = deliveryChartData.reduce((s, d) => s + d.total, 0);
  const deliveryPct = Math.round((deliveryOnTime / deliveryTotal) * 100);

  const scheduleItems = mockTasks.filter(t => !completedTasks.has(t.id)).map(t => ({ time: t.dueTime, icon: taskIcons[t.type], label: `${t.customerName.split(" ")[0]} (${t.type})` }));

  // Compute health score stats from real data
  const avgHealth = customers.length > 0 ? Math.round(customers.reduce((s, c) => s + c.healthScore, 0) / customers.length) : 68;
  const excellentCount = customers.filter(c => c.healthScore >= 90).length;
  const goodCount = customers.filter(c => c.healthScore >= 70 && c.healthScore < 90).length;
  const attentionCount = customers.filter(c => c.healthScore >= 50 && c.healthScore < 70).length;
  const riskCount = customers.filter(c => c.healthScore < 50).length;
  const totalCustomers = customers.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* Left Column (3/5) */}
      <div className="lg:col-span-3 space-y-6">
        {/* Data source indicator */}
        <div className="flex items-center gap-2">
          <Badge variant={isRealData ? "default" : "outline"} className="text-[10px]">
            {isLoading ? <><Loader2 className="h-3 w-3 animate-spin mr-1" /> Carregando Holdprint...</> : isRealData ? `🟢 ${totalCustomers} clientes Holdprint` : "🟡 Dados demo"}
          </Badge>
          {holdprintData?.fetchedAt && (
            <span className="text-[10px] text-muted-foreground">
              Atualizado: {new Date(holdprintData.fetchedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Alerts */}
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
                      <div className="flex-1">
                        <p className="text-sm font-medium">{alert.title} — <span className="font-normal text-muted-foreground">{alert.customerName}</span></p>
                        <p className="text-xs text-muted-foreground mt-0.5">{alert.description}</p>
                      </div>
                      <Button size="sm" variant="outline" className="h-7 text-xs flex-shrink-0" onClick={() => onNavigate(alert.actionTarget as CSSectionId)}>{alert.actionLabel}</Button>
                      <button onClick={() => setDismissedAlerts(prev => new Set(prev).add(alert.id))} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
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
            <div className="space-y-2">
              {mockTasks.map((task) => {
                const done = completedTasks.has(task.id);
                return (
                  <div key={task.id} className={`flex items-center gap-3 p-2 rounded-lg hover:bg-muted/30 transition-colors ${done ? "opacity-50" : ""}`}>
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

        {/* Health Score Overview */}
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => onNavigate("health")}>
          <CardContent className="p-4">
            <h3 className="font-semibold text-sm mb-3">Health Score Overview {isRealData && <span className="text-[10px] text-muted-foreground font-normal">(calculado da Holdprint)</span>}</h3>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className={`h-16 w-16 rounded-full flex items-center justify-center ${avgHealth >= 70 ? "bg-green-500" : avgHealth >= 50 ? "bg-yellow-500" : "bg-red-500"}`}>
                  <span className="text-2xl font-bold text-white">{avgHealth}</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">Score Médio</p>
              </div>
              <div className="grid grid-cols-2 gap-2 flex-1">
                {[
                  { label: "Excelente", count: excellentCount, color: "bg-green-700" },
                  { label: "Bom", count: goodCount, color: "bg-green-500" },
                  { label: "Atenção", count: attentionCount, color: "bg-yellow-500" },
                  { label: "Risco", count: riskCount, color: "bg-red-500" },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${item.color}`} />
                    <span className="text-xs">{item.label}: <strong>{item.count}</strong></span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column (2/5) */}
      <div className="lg:col-span-2 space-y-6">
        {/* Schedule */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm">Agenda do Dia</h3>
              <CSMeetingDialog trigger={<button className="text-xs text-primary hover:underline">+ Reunião</button>} />
            </div>
            <div className="space-y-1">
              {["08:00", "09:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((time) => {
                const event = scheduleItems.find(s => s.time === time);
                const isNow = time === "09:00";
                return (
                  <div key={time} className={`flex items-center gap-2 py-1 text-xs ${isNow ? "border-l-2 border-l-primary pl-2 bg-primary/5 rounded-r" : "pl-3"}`}>
                    <span className="w-10 text-muted-foreground font-mono">{time}</span>
                    {event ? (
                      <span className="text-foreground">{event.icon} {event.label}</span>
                    ) : (
                      <span className="text-muted-foreground/30">────</span>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Mini Reports */}
        <div className="grid grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">NPS (6m)</p>
              <ResponsiveContainer width="100%" height={50}>
                <LineChart data={npsSparkData}>
                  <Line type="monotone" dataKey="nps" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-lg font-bold text-green-600">72</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <p className="text-[10px] text-muted-foreground mb-1">Entregas on-time</p>
              <ResponsiveContainer width="100%" height={50}>
                <PieChart>
                  <Pie data={[{ v: deliveryPct }, { v: 100 - deliveryPct }]} cx="50%" cy="50%" innerRadius={15} outerRadius={22} dataKey="v" startAngle={90} endAngle={-270}>
                    <Cell fill="hsl(142 71% 45%)" />
                    <Cell fill="hsl(0 0% 90%)" />
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <p className="text-lg font-bold text-green-600">{deliveryPct}%</p>
            </CardContent>
          </Card>
        </div>

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
  );
};

export default CSResumoSection;
