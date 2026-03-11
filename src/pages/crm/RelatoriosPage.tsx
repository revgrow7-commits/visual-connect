import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { fmtBRL } from "@/lib/crm/mockData";

const monthlyData = [
  { mes: "Out", ganhos: 85000, perdidos: 15000 },
  { mes: "Nov", ganhos: 120000, perdidos: 25000 },
  { mes: "Dez", ganhos: 95000, perdidos: 30000 },
  { mes: "Jan", ganhos: 110000, perdidos: 20000 },
  { mes: "Fev", ganhos: 130000, perdidos: 10000 },
  { mes: "Mar", ganhos: 145000, perdidos: 15000 },
];

const topOwners = [
  { name: "Rafael Oribes", value: 420000 },
  { name: "Bruno Garbin", value: 358000 },
];

const leadSources = [
  { name: "Indicação", value: 40, color: "#3b82f6" },
  { name: "Site", value: 25, color: "#22c55e" },
  { name: "Prospecção", value: 20, color: "#f59e0b" },
  { name: "Evento", value: 15, color: "#8b5cf6" },
];

export default function CRMRelatoriosPage() {
  const [period, setPeriod] = useState("6m");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-foreground">Relatórios CRM</h1>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
            <SelectContent><SelectItem value="7d">7D</SelectItem><SelectItem value="30d">30D</SelectItem><SelectItem value="90d">90D</SelectItem><SelectItem value="6m">6M</SelectItem><SelectItem value="12m">12M</SelectItem></SelectContent>
          </Select>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> CSV</Button>
          <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> PDF</Button>
        </div>
      </div>

      <Tabs defaultValue="visao-geral">
        <TabsList className="flex-wrap"><TabsTrigger value="visao-geral">Visão Geral</TabsTrigger><TabsTrigger value="pipeline">Pipeline</TabsTrigger><TabsTrigger value="vendas">Vendas</TabsTrigger><TabsTrigger value="atividades">Atividades</TabsTrigger><TabsTrigger value="equipe">Equipe</TabsTrigger><TabsTrigger value="cs">CS</TabsTrigger><TabsTrigger value="previsao">Previsão</TabsTrigger></TabsList>

        <TabsContent value="visao-geral">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card><CardHeader><CardTitle className="text-sm">Evolução Mensal de Negócios</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={monthlyData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="mes" /><YAxis tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><Tooltip formatter={(v: number) => fmtBRL(v)} /><Line type="monotone" dataKey="ganhos" stroke="hsl(var(--primary))" strokeWidth={2} /><Line type="monotone" dataKey="perdidos" stroke="#ef4444" strokeWidth={2} /></LineChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Top Responsáveis</CardTitle></CardHeader><CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topOwners} layout="vertical"><CartesianGrid strokeDasharray="3 3" /><XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} /><YAxis dataKey="name" type="category" width={120} /><Tooltip formatter={(v: number) => fmtBRL(v)} /><Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} /></BarChart>
              </ResponsiveContainer>
            </CardContent></Card>

            <Card><CardHeader><CardTitle className="text-sm">Fonte de Leads</CardTitle></CardHeader><CardContent className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart><Pie data={leadSources} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}%`}>{leadSources.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
            </CardContent></Card>
          </div>
        </TabsContent>

        {["pipeline", "vendas", "atividades", "equipe", "cs", "previsao"].map(tab => (
          <TabsContent key={tab} value={tab}>
            <Card><CardContent className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Relatório de {tab.charAt(0).toUpperCase() + tab.slice(1)} — Em desenvolvimento</p>
            </CardContent></Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
