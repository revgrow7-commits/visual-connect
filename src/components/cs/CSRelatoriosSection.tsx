import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { npsEvolution, healthScoreDistribution, deliveryChartData, complaintCategoryData } from "./mockData";
import { revenueMonthlyData, mockWSCustomers } from "./workspaceData";
import { HelpCircle, Maximize2 } from "lucide-react";

const resolutionTimeData = [
  { month: "Set/25", days: 3.5 }, { month: "Out/25", days: 2.8 },
  { month: "Nov/25", days: 3.2 }, { month: "Dez/25", days: 2.5 },
  { month: "Jan/26", days: 2.1 }, { month: "Fev/26", days: 2.3 },
];

const slaComplianceData = [
  { type: "Crítica", compliance: 75 },
  { type: "Alta", compliance: 85 },
  { type: "Média", compliance: 92 },
  { type: "Baixa", compliance: 100 },
];

const quickAnswers = [
  { q: "Quanto tempo demora em média para resolver reclamações?", a: "2,3 dias em fevereiro/2026, com tendência de queda (-34% desde set/25)." },
  { q: "Qual o NPS médio dos últimos 6 meses?", a: "Média de 59, com tendência ascendente. Atual: 72 (fev/26)." },
  { q: "Quantas reclamações foram criadas por categoria?", a: "Atraso: 35%, Defeito: 25%, Divergência: 20%, Instalação: 12%, Outros: 8%." },
  { q: "Qual a taxa de resolução no primeiro contato?", a: "35% — 2 de cada 6 reclamações resolvidas sem escalonamento." },
  { q: "Qual o tempo médio entre pedidos por cliente?", a: "87 dias. Recorrentes (3+ jobs): 45 dias. Únicos: 180+ dias." },
];

const formatCurrency = (v: number) => `R$${(v / 1000).toFixed(0)}k`;

const CSRelatoriosSection = () => {
  const [expandedAnswer, setExpandedAnswer] = useState<number | null>(null);
  const [expandedChart, setExpandedChart] = useState<string | null>(null);

  const reports = [
    {
      id: "nps", title: "NPS Trend (12 meses)",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={npsEvolution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={10} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="nps" stroke="hsl(142 71% 45%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "hs", title: "Health Score Distribution",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={healthScoreDistribution}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="range" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Bar dataKey="count" name="Clientes" radius={[4, 4, 0, 0]}>
              {healthScoreDistribution.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "complaints", title: "Reclamações por Status",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <PieChart>
            <Pie data={complaintCategoryData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} fontSize={10}>
              {complaintCategoryData.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "sla", title: "SLA Compliance por Prioridade",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <BarChart data={slaComplianceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="type" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip />
            <Bar dataKey="compliance" name="% Compliance" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "revenue", title: "Receita por Cliente (Top 10)",
      chart: (h: number) => {
        const top = [...mockWSCustomers].sort((a, b) => b.totalRevenue - a.totalRevenue).slice(0, 10);
        return (
          <ResponsiveContainer width="100%" height={h}>
            <BarChart data={top} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={formatCurrency} fontSize={10} />
              <YAxis dataKey="name" type="category" width={120} fontSize={9} />
              <Tooltip formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR")}` } />
              <Bar dataKey="totalRevenue" name="Receita" fill="hsl(350 67% 37%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
    {
      id: "delivery", title: "Entregas On-Time (6 meses)",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <AreaChart data={deliveryChartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis domain={[0, 100]} fontSize={11} />
            <Tooltip />
            <Area type="monotone" dataKey="percentage" name="% On-time" stroke="hsl(142 71% 45%)" fill="hsl(142 71% 45% / 0.2)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "resolution", title: "Tempo Médio de Resolução",
      chart: (h: number) => (
        <ResponsiveContainer width="100%" height={h}>
          <LineChart data={resolutionTimeData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={11} />
            <YAxis fontSize={11} />
            <Tooltip />
            <Line type="monotone" dataKey="days" name="Dias" stroke="hsl(217 91% 60%)" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      ),
    },
    {
      id: "risk", title: "Clientes por Risco (HS)",
      chart: (h: number) => {
        const data = [
          { category: "Excelente (90+)", count: mockWSCustomers.filter(c => c.healthScore >= 90).length, fill: "hsl(142 71% 35%)" },
          { category: "Bom (70-89)", count: mockWSCustomers.filter(c => c.healthScore >= 70 && c.healthScore < 90).length, fill: "hsl(142 71% 55%)" },
          { category: "Atenção (50-69)", count: mockWSCustomers.filter(c => c.healthScore >= 50 && c.healthScore < 70).length, fill: "hsl(45 93% 47%)" },
          { category: "Risco (<50)", count: mockWSCustomers.filter(c => c.healthScore < 50).length, fill: "hsl(0 84% 60%)" },
        ];
        return (
          <ResponsiveContainer width="100%" height={h}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" fontSize={10} />
              <YAxis fontSize={11} />
              <Tooltip />
              <Bar dataKey="count" name="Clientes" radius={[4, 4, 0, 0]}>
                {data.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Quick Answers */}
      <Card>
        <CardContent className="p-4">
          <h3 className="font-semibold text-sm mb-3 flex items-center gap-2"><HelpCircle className="h-4 w-4" /> Respostas Rápidas</h3>
          <div className="space-y-2">
            {quickAnswers.map((qa, i) => (
              <div key={i}>
                <button onClick={() => setExpandedAnswer(expandedAnswer === i ? null : i)} className="w-full text-left p-2 rounded-lg hover:bg-muted/50 transition-colors">
                  <p className="text-sm text-primary font-medium">{qa.q}</p>
                </button>
                {expandedAnswer === i && (
                  <p className="text-sm text-muted-foreground px-2 pb-2">{qa.a}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Reports Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {reports.map((report) => (
          <Card key={report.id} className={expandedChart === report.id ? "lg:col-span-2" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">{report.title}</h3>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setExpandedChart(expandedChart === report.id ? null : report.id)}>
                  <Maximize2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              {report.chart(expandedChart === report.id ? 400 : 220)}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CSRelatoriosSection;
