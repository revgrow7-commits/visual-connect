import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp } from "lucide-react";

interface SectorChartsProps {
  sector: string;
  sectorLabel: string;
  rawData: Record<string, any[]> | undefined;
}

const COLORS = [
  "hsl(142, 71%, 45%)", // green
  "hsl(0, 84%, 60%)",   // red
  "hsl(217, 91%, 60%)", // blue
  "hsl(45, 93%, 47%)",  // amber
  "hsl(270, 70%, 60%)", // purple
  "hsl(190, 80%, 45%)", // cyan
];

function getMonthLabel(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "N/A";
    return d.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
  } catch {
    return "N/A";
  }
}

function extractDate(item: any): string | null {
  const rd = item.raw_data;
  return rd?.date || rd?.createdAt || rd?.created_at || rd?.issueDate || rd?.dueDate || rd?.lastSynced || null;
}

function groupByMonth(items: any[], valueKey?: string): { month: string; total: number; count: number }[] {
  const map = new Map<string, { total: number; count: number }>();

  for (const item of items) {
    const dateStr = extractDate(item);
    const label = dateStr ? getMonthLabel(dateStr) : "Outros";
    const val = valueKey
      ? (Number(item.raw_data?.[valueKey]) || 0)
      : (Number(item.raw_data?.amount || item.raw_data?.value) || 0);

    const existing = map.get(label) || { total: 0, count: 0 };
    existing.total += val;
    existing.count += 1;
    map.set(label, existing);
  }

  return Array.from(map.entries())
    .map(([month, data]) => ({ month, ...data }))
    .slice(-6); // last 6 months
}

function groupByStatus(items: any[], statusKey: string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const status = String(item.raw_data?.[statusKey] || "Outros");
    map.set(status, (map.get(status) || 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

const formatBRL = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", notation: "compact", maximumFractionDigits: 1 }).format(v);

/* ── Chart configs per sector ── */
type ChartDef = {
  title: string;
  type: "area" | "bar" | "pie" | "stacked-bar";
  build: (data: Record<string, any[]>) => any[];
  series?: { key: string; label: string; color: string }[];
  valueFormat?: "currency" | "count";
};

function getSectorCharts(sector: string): ChartDef[] {
  switch (sector) {
    case "financeiro":
    case "contabil":
      return [
        {
          title: "Receitas vs Despesas",
          type: "stacked-bar",
          build: (data) => {
            const incByMonth = groupByMonth(data.incomes || []);
            const expByMonth = groupByMonth(data.expenses || []);
            const months = new Set([...incByMonth.map(i => i.month), ...expByMonth.map(i => i.month)]);
            return Array.from(months).map(m => ({
              month: m,
              receitas: incByMonth.find(i => i.month === m)?.total || 0,
              despesas: expByMonth.find(i => i.month === m)?.total || 0,
            }));
          },
          series: [
            { key: "receitas", label: "Receitas", color: COLORS[0] },
            { key: "despesas", label: "Despesas", color: COLORS[1] },
          ],
          valueFormat: "currency",
        },
        {
          title: "Evolução do Saldo",
          type: "area",
          build: (data) => {
            const incByMonth = groupByMonth(data.incomes || []);
            const expByMonth = groupByMonth(data.expenses || []);
            const months = new Set([...incByMonth.map(i => i.month), ...expByMonth.map(i => i.month)]);
            return Array.from(months).map(m => ({
              month: m,
              saldo: (incByMonth.find(i => i.month === m)?.total || 0) - (expByMonth.find(i => i.month === m)?.total || 0),
            }));
          },
          series: [{ key: "saldo", label: "Saldo", color: COLORS[2] }],
          valueFormat: "currency",
        },
      ];

    case "comercial":
    case "marketing":
      return [
        {
          title: "Orçamentos por Mês",
          type: "bar",
          build: (data) => groupByMonth(data.budgets || []),
          series: [{ key: "count", label: "Qtde", color: COLORS[3] }],
          valueFormat: "count",
        },
        {
          title: "Status dos Orçamentos",
          type: "pie",
          build: (data) => groupByStatus(data.budgets || [], "budgetState"),
        },
      ];

    case "operacao":
    case "cs":
      return [
        {
          title: "Jobs por Mês",
          type: "bar",
          build: (data) => groupByMonth(data.jobs || []),
          series: [{ key: "count", label: "Jobs", color: COLORS[2] }],
          valueFormat: "count",
        },
        {
          title: "Status de Produção",
          type: "pie",
          build: (data) => groupByStatus(data.jobs || [], "productionStatus"),
        },
      ];

    case "faturamento":
      return [
        {
          title: "Faturamento Mensal",
          type: "area",
          build: (data) => groupByMonth(data.incomes || []),
          series: [{ key: "total", label: "Faturamento", color: COLORS[0] }],
          valueFormat: "currency",
        },
        {
          title: "Jobs Concluídos vs Pendentes",
          type: "pie",
          build: (data) => {
            const jobs = data.jobs || [];
            const done = jobs.filter((i: any) => ["completed", "Concluído"].includes(i.raw_data?.productionStatus || i.raw_data?.status)).length;
            return [
              { name: "Concluídos", value: done },
              { name: "Pendentes", value: jobs.length - done },
            ];
          },
        },
      ];

    case "compras":
      return [
        {
          title: "Despesas de Compras por Mês",
          type: "area",
          build: (data) => groupByMonth(data.expenses || []),
          series: [{ key: "total", label: "Valor", color: COLORS[1] }],
          valueFormat: "currency",
        },
      ];

    case "fiscal":
      return [
        {
          title: "Notas por Mês",
          type: "stacked-bar",
          build: (data) => {
            const incByMonth = groupByMonth(data.incomes || []);
            const expByMonth = groupByMonth(data.expenses || []);
            const months = new Set([...incByMonth.map(i => i.month), ...expByMonth.map(i => i.month)]);
            return Array.from(months).map(m => ({
              month: m,
              entrada: incByMonth.find(i => i.month === m)?.count || 0,
              saida: expByMonth.find(i => i.month === m)?.count || 0,
            }));
          },
          series: [
            { key: "entrada", label: "Entrada", color: COLORS[0] },
            { key: "saida", label: "Saída", color: COLORS[1] },
          ],
          valueFormat: "count",
        },
      ];

    case "juridico":
      return [
        {
          title: "Distribuição Clientes vs Fornecedores",
          type: "pie",
          build: (data) => [
            { name: "Clientes", value: (data.customers || []).length },
            { name: "Fornecedores", value: (data.suppliers || []).length },
          ],
        },
      ];

    default:
      return [];
  }
}

/* ── Render helpers ── */
const CustomTooltip = ({ active, payload, label, valueFormat }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-popover border border-border rounded-lg px-3 py-2 shadow-lg">
      <p className="text-xs font-medium text-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="text-xs" style={{ color: p.color }}>
          {p.name}: {valueFormat === "currency" ? formatBRL(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

const SectorCharts = ({ sector, sectorLabel, rawData }: SectorChartsProps) => {
  const charts = useMemo(() => getSectorCharts(sector), [sector]);

  if (!rawData || charts.length === 0) return null;

  const hasAnyData = Object.values(rawData).some(arr => arr.length > 0);
  if (!hasAnyData) return null;

  return (
    <div className={`grid gap-4 ${charts.length === 1 ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-2"}`}>
      {charts.map((chart, idx) => {
        const chartData = chart.build(rawData);
        if (!chartData.length) return null;

        return (
          <Card key={idx}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                {chart.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[240px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  {chart.type === "area" ? (
                    <AreaChart data={chartData}>
                      <defs>
                        {chart.series?.map((s, i) => (
                          <linearGradient key={i} id={`gradient-${idx}-${i}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={s.color} stopOpacity={0.3} />
                            <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={chart.valueFormat === "currency" ? (v) => formatBRL(v) : undefined}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip valueFormat={chart.valueFormat} />} />
                      {chart.series?.map((s, i) => (
                        <Area
                          key={i}
                          type="monotone"
                          dataKey={s.key}
                          name={s.label}
                          stroke={s.color}
                          fill={`url(#gradient-${idx}-${i})`}
                          strokeWidth={2}
                        />
                      ))}
                    </AreaChart>
                  ) : chart.type === "bar" ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <Tooltip content={<CustomTooltip valueFormat={chart.valueFormat} />} />
                      {chart.series?.map((s, i) => (
                        <Bar key={i} dataKey={s.key} name={s.label} fill={s.color} radius={[4, 4, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : chart.type === "stacked-bar" ? (
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                      <YAxis
                        tick={{ fontSize: 11 }}
                        tickFormatter={chart.valueFormat === "currency" ? (v) => formatBRL(v) : undefined}
                        className="text-muted-foreground"
                      />
                      <Tooltip content={<CustomTooltip valueFormat={chart.valueFormat} />} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                      {chart.series?.map((s, i) => (
                        <Bar key={i} dataKey={s.key} name={s.label} fill={s.color} stackId="stack" radius={i === (chart.series!.length - 1) ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                      ))}
                    </BarChart>
                  ) : chart.type === "pie" ? (
                    <PieChart>
                      <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={90}
                        paddingAngle={3}
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {chartData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  ) : null}
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default SectorCharts;