import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle, AlertTriangle, Shield, MessageSquare, Clock, Star, RefreshCw } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { deliveryChartData, complaintCategoryData, npsData, topComplaintClients } from "./mockData";

const kpiLine1 = [
  { label: "Entregas no Mês", value: "18", icon: Package, color: "text-green-600", bg: "bg-green-50" },
  { label: "No Prazo", value: "14 (77,8%)", icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  { label: "Atrasadas", value: "3 (16,7%)", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
  { label: "Em Garantia", value: "6", icon: Shield, color: "text-blue-600", bg: "bg-blue-50" },
];

const kpiLine2 = [
  { label: "Reclamações Abertas", value: "4", icon: MessageSquare, color: "text-yellow-600", bg: "bg-yellow-50" },
  { label: "Tempo Médio Resolução", value: "2,3 dias", icon: Clock, color: "text-muted-foreground", bg: "bg-muted" },
  { label: "NPS Score", value: "72", icon: Star, color: "text-green-600", bg: "bg-green-50" },
  { label: "Taxa Recompra", value: "68%", icon: RefreshCw, color: "text-blue-600", bg: "bg-blue-50" },
];

const CSDashboardTab = React.forwardRef<HTMLDivElement>((_, ref) => {
  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR")}`;

  return (
    <div ref={ref} className="space-y-6">
      {/* KPI Line 1 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiLine1.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
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

      {/* KPI Line 2 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiLine2.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-lg ${kpi.bg} flex items-center justify-center`}>
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

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery On Time vs Late */}
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
                <Bar dataKey="onTime" name="No Prazo" fill="hsl(142 71% 45%)" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="late" name="Atrasadas" fill="hsl(0 84% 60%)" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Complaints by Category */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Reclamações por Categoria</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={complaintCategoryData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} fontSize={11}>
                  {complaintCategoryData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NPS Evolution */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Evolução NPS</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={npsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" fontSize={12} />
                <YAxis domain={[0, 100]} fontSize={12} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="nps" name="NPS" stroke="hsl(142 71% 45%)" strokeWidth={3} dot={{ r: 5 }} />
                <Line type="monotone" dataKey="promoters" name="Promotores %" stroke="hsl(142 71% 45%)" strokeDasharray="5 5" />
                <Line type="monotone" dataKey="detractors" name="Detratores %" stroke="hsl(0 84% 60%)" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Complaint Clients */}
        <Card>
          <CardContent className="p-4">
            <h3 className="font-semibold mb-4">Top 5 Clientes com Mais Reclamações</h3>
            <ResponsiveContainer width="100%" height={280}>
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
    </div>
  );
});

CSDashboardTab.displayName = "CSDashboardTab";
export default CSDashboardTab;
