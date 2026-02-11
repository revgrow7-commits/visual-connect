import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const barData = [
  { name: "Comercial", value: 12 },
  { name: "Produção", value: 8 },
  { name: "Logística", value: 6 },
  { name: "RH", value: 4 },
  { name: "Instalação", value: 10 },
];

const pieData = [
  { name: "POA", value: 65 },
  { name: "SP", value: 35 },
];

const COLORS = ["hsl(350,67%,37%)", "hsl(320,43%,22%)"];

const kpis = [
  { label: "Incidentes Críticos Abertos", value: "3" },
  { label: "SLA Vencidos", value: "1" },
  { label: "Top Tema", value: "Retrabalho" },
  { label: "Tendência Mensal", value: "↓ 12%" },
];

const OuvidoriaDashboard = () => (
  <section className="space-y-4">
    <h2 className="text-xl font-bold text-foreground">Visão Executiva</h2>
    <p className="text-sm text-muted-foreground">O Bruno visualiza:</p>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {kpis.map((k) => (
        <Card key={k.label}>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">{k.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{k.label}</p>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Volume por Setor</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={barData}>
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(350,67%,37%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Volume por Unidade</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center">
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={70} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  </section>
);

export default OuvidoriaDashboard;
