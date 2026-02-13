import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Heart, Star, AlertTriangle, Truck, Target, Shield, Clock, MessageSquare, AlertOctagon, Wrench, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend, ReferenceLine } from "recharts";
import { deliveryChartData, complaintCategoryData, npsEvolution, topComplaintClients, healthScoreDistribution, satisfactionHeatmap, activeAlerts } from "./mockData";

const kpiLine1 = [
  { label: "Clientes Ativos", value: "42", icon: Users, color: "text-muted-foreground", bg: "bg-muted" },
  { label: "Health Score Médio", value: "78/100", icon: Heart, color: "text-green-600", bg: "bg-green-50" },
  { label: "NPS Geral", value: "72", icon: Star, color: "text-green-600", bg: "bg-green-50" },
  { label: "Churn Risk", value: "3 clientes", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
];
const kpiLine2 = [
  { label: "Entregas no Mês", value: "18", icon: Truck, color: "text-muted-foreground", bg: "bg-muted" },
  { label: "% No Prazo", value: "82,4%", icon: Target, color: "text-green-600", bg: "bg-green-50" },
  { label: "Garantias Ativas", value: "34", icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Garantias Expirando (30d)", value: "5", icon: Clock, color: "text-yellow-600", bg: "bg-yellow-50" },
];
const kpiLine3 = [
  { label: "Reclamações Abertas", value: "4", icon: MessageSquare, color: "text-red-600", bg: "bg-red-50" },
  { label: "SLA Estourado", value: "1", icon: AlertOctagon, color: "text-red-600", bg: "bg-red-50", pulse: true },
  { label: "Visitas Agendadas", value: "3", icon: Wrench, color: "text-blue-600", bg: "bg-blue-50" },
  { label: "Oportunidades Upsell", value: "7", icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
];

const alertBg: Record<string, string> = { critical: "bg-red-50 border-red-200", high: "bg-yellow-50 border-yellow-200", medium: "bg-blue-50 border-blue-200" };

const heatColor = (v: number) => {
  if (v >= 4.5) return "bg-green-700 text-white";
  if (v >= 4.0) return "bg-green-400 text-white";
  if (v >= 3.5) return "bg-yellow-400 text-black";
  return "bg-red-500 text-white";
};

const CSDashboardTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const renderKpiRow = (kpis: typeof kpiLine1) => (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {kpis.map((kpi) => (
        <Card key={kpi.label}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center ${(kpi as any).pulse ? "animate-pulse" : ""}`}>
              <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{kpi.label}</p>
              <p className="text-lg font-bold">{kpi.value}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div ref={ref} className="space-y-6">
      {/* Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          {activeAlerts.map((alert, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${alertBg[alert.priority]}`}>
              <span className="text-xl">{alert.icon}</span>
              <p className="text-sm flex-1">{alert.message}</p>
              <Badge variant="outline" className="text-xs cursor-pointer hover:bg-background">{alert.action}</Badge>
            </div>
          ))}
        </div>
      )}

      {renderKpiRow(kpiLine1)}
      {renderKpiRow(kpiLine2)}
      {renderKpiRow(kpiLine3)}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Distribuição Health Score</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={healthScoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="count" name="Clientes" radius={[4, 4, 0, 0]}>
                  {healthScoreDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Evolução NPS (12 meses)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={npsEvolution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={11} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <ReferenceLine y={50} stroke="hsl(45 93% 47%)" strokeDasharray="5 5" label={{ value: "Zona 50", fontSize: 10 }} />
                <ReferenceLine y={75} stroke="hsl(142 71% 45%)" strokeDasharray="5 5" label={{ value: "Zona 75", fontSize: 10 }} />
                <Line type="monotone" dataKey="nps" name="NPS" stroke="hsl(142 71% 45%)" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Entregas no Prazo vs Atrasadas</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={deliveryChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="onTime" name="No Prazo" fill="hsl(142 71% 45%)" stackId="a" />
                <Bar dataKey="late" name="Atrasadas" fill="hsl(0 84% 60%)" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Reclamações por Categoria</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={complaintCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} fontSize={11}>
                  {complaintCategoryData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Mapa de Calor — Satisfação por Tipo de Serviço</h3>
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <th className="text-left p-2 font-medium">Serviço</th>
                  <th className="text-center p-2 font-medium">Qualidade</th>
                  <th className="text-center p-2 font-medium">Prazo</th>
                  <th className="text-center p-2 font-medium">Atendimento</th>
                  <th className="text-center p-2 font-medium">Preço</th>
                </tr>
              </thead>
              <tbody>
                {satisfactionHeatmap.map((row) => (
                  <tr key={row.service}>
                    <td className="p-2 font-medium">{row.service}</td>
                    {[row.quality, row.prazo, row.atendimento, row.preco].map((v, i) => (
                      <td key={i} className="p-1 text-center">
                        <span className={`inline-block px-3 py-1 rounded font-bold text-xs ${heatColor(v)}`}>{v.toFixed(1)}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Top Complaint Clients */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold mb-4">Top 5 Clientes com Mais Reclamações</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topComplaintClients} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis dataKey="name" type="category" width={160} fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Reclamações" fill="hsl(0 84% 60%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
});

CSDashboardTab.displayName = "CSDashboardTab";
export default CSDashboardTab;
