import { Scale, AlertTriangle, Clock, DollarSign, Users, TrendingUp, Calendar, Shield, FileCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { BancoHorasRow } from "./BancoHorasTable";

interface CLTDashboardProps {
  data: BancoHorasRow[];
  competencia: string;
}

// CCT EAA × SESCON-SP 2025/2026 - Cláusula 10
const SALARIO_BASE = 2500;
const CARGA_MENSAL = 220;
const VALOR_HORA = SALARIO_BASE / CARGA_MENSAL;
const ADIC_60 = 0.60; // Cl. 10.1 — até 2h
const ADIC_80 = 0.80; // Cl. 10.2 — excedente 2h
const ADIC_100 = 1.00; // Cl. 10.3 — dom/fer
const INSS_PATRONAL = 0.288; // 20% + RAT + Terceiros
const FGTS = 0.08;
const ENCARGOS = 1 + INSS_PATRONAL + FGTS; // ~1.368

function parseHoras(val: string): number {
  if (!val || val === "00:00") return 0;
  const neg = val.startsWith("-");
  const clean = val.replace("-", "");
  const [h, m] = clean.split(":").map(Number);
  const total = (h || 0) + (m || 0) / 60;
  return neg ? -total : total;
}

// CCT Cl. 41.2 — Vencimento por quinzena (60 dias corridos)
function calcVencimentoCCT(competencia: string): { diasRestantes: number; dataVencimento: string } {
  const [y, m] = competencia.split("-").map(Number);
  // Assume quinzena 15 do mês da competência como referência conservadora
  const inicioQuinzena = new Date(y, m - 1, 15);
  const vencimento = new Date(inicioQuinzena);
  vencimento.setDate(vencimento.getDate() + 60);
  const hoje = new Date();
  const dias = Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
  return {
    diasRestantes: dias,
    dataVencimento: vencimento.toISOString().split("T")[0],
  };
}

// Status CCT: NO PRAZO (>15d), URGENTE (≤15d), VENCIDO (<0d)
function classificarStatusCCT(diasRestantes: number): "no_prazo" | "urgente" | "vencido" {
  if (diasRestantes < 0) return "vencido";
  if (diasRestantes <= 15) return "urgente";
  return "no_prazo";
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const BancoHorasCLTDashboard = ({ data, competencia }: CLTDashboardProps) => {
  const vencCCT = calcVencimentoCCT(competencia);
  const statusGeral = classificarStatusCCT(vencCCT.diasRestantes);

  // Cálculos financeiros com adicionais CCT (Cl. 10)
  const classificados = data.map((c) => {
    const horasEx60 = parseHoras(c.ex60);
    const horasEx80 = parseHoras(c.ex80);
    const horasEx100 = parseHoras(c.ex100);

    // Passivo CCT
    const custoEx60 = horasEx60 * VALOR_HORA * (1 + ADIC_60);
    const custoEx80 = horasEx80 * VALOR_HORA * (1 + ADIC_80);
    const custoEx100 = horasEx100 * VALOR_HORA * (1 + ADIC_100);
    const custoBruto = custoEx60 + custoEx80 + custoEx100;
    const custoTotal = custoBruto * ENCARGOS;

    return {
      ...c,
      horasEx60,
      horasEx80,
      horasEx100,
      custoEx60,
      custoEx80,
      custoEx100,
      custoBruto,
      custoTotal,
    };
  });

  // Totais financeiros
  const totalCustoEx60 = classificados.reduce((a, c) => a + c.custoEx60, 0);
  const totalCustoEx80 = classificados.reduce((a, c) => a + c.custoEx80, 0);
  const totalCustoEx100 = classificados.reduce((a, c) => a + c.custoEx100, 0);
  const totalBruto = classificados.reduce((a, c) => a + c.custoBruto, 0);
  const totalINSS = totalBruto * INSS_PATRONAL;
  const totalFGTS = totalBruto * FGTS;
  const passivoTotal = totalBruto * ENCARGOS;

  // Saldos
  const saldoTotal = data.reduce((a, c) => a + c.saldoDecimal, 0);
  const saldoPositivos = data.filter((c) => c.saldoDecimal > 0).length;
  const saldoNegativos = data.filter((c) => c.saldoDecimal < 0).length;

  // Conformidade: colaboradores com saldo ≤ 20h e sem horas vencidas
  const conformes = classificados.filter((c) => Math.abs(c.saldoDecimal) <= 20).length;
  const alertas = classificados.filter((c) => Math.abs(c.saldoDecimal) > 20 && Math.abs(c.saldoDecimal) <= 40).length;
  const criticos = classificados.filter((c) => Math.abs(c.saldoDecimal) > 40).length;
  const conformidade = data.length > 0 ? Math.round((conformes / data.length) * 100) : 0;

  // Risco visual (donut)
  const riskData = [
    { name: "🟢 No Prazo", value: conformes, color: "#10b981" },
    { name: "🟡 Urgente", value: alertas, color: "#f59e0b" },
    { name: "🔴 Vencido/Crítico", value: criticos, color: "#ef4444" },
  ].filter((d) => d.value > 0);

  // Agrupamento por departamento
  const porDepto = classificados.reduce<Record<string, { total: number; criticos: number; saldo: number; passivo: number }>>((acc, c) => {
    const d = c.departamento || "Sem setor";
    if (!acc[d]) acc[d] = { total: 0, criticos: 0, saldo: 0, passivo: 0 };
    acc[d].total++;
    if (Math.abs(c.saldoDecimal) > 40) acc[d].criticos++;
    acc[d].saldo += c.saldoDecimal;
    acc[d].passivo += c.custoTotal;
    return acc;
  }, {});

  // Top alertas individuais
  const topAlertas = classificados
    .filter((c) => Math.abs(c.saldoDecimal) > 20)
    .sort((a, b) => Math.abs(b.saldoDecimal) - Math.abs(a.saldoDecimal))
    .slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">Dashboard Conformidade — CCT EAA × SESCON-SP 2025/2026</h3>
          <p className="text-xs text-muted-foreground">Cl. 41 (Compensação) · Cl. 10 (Adicionais 60%/80%/100%) · Cl. 7 (Reflexos) · Cl. 58 (Multa)</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Conformidade CCT */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-muted-foreground">Conformidade CCT</p>
            </div>
            <p className={`text-2xl font-bold ${conformidade >= 95 ? "text-emerald-600" : conformidade >= 70 ? "text-amber-600" : "text-destructive"}`}>
              {conformidade}%
            </p>
            <Progress value={conformidade} className="mt-2 h-1.5" />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5">✅ {conformes}</Badge>
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5">⚠️ {alertas}</Badge>
              <Badge className="bg-destructive/10 text-destructive text-[10px] px-1.5">🔴 {criticos}</Badge>
            </div>
            <p className="text-[9px] text-muted-foreground mt-1">Meta: ≥ 95%</p>
          </CardContent>
        </Card>

        {/* Passivo Projetado CCT */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-destructive/10 p-1.5">
                <DollarSign className="h-4 w-4 text-destructive" />
              </div>
              <p className="text-[11px] text-muted-foreground">Passivo Projetado</p>
            </div>
            <p className="text-xl font-bold text-destructive">{formatCurrency(passivoTotal)}</p>
            <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
              <p>60%: {formatCurrency(totalCustoEx60)} · 80%: {formatCurrency(totalCustoEx80)} · 100%: {formatCurrency(totalCustoEx100)}</p>
              <p>INSS: {formatCurrency(totalINSS)} · FGTS: {formatCurrency(totalFGTS)}</p>
            </div>
          </CardContent>
        </Card>

        {/* Saldo Geral */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
              <p className="text-[11px] text-muted-foreground">Saldo Geral</p>
            </div>
            <p className={`text-2xl font-bold ${saldoTotal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
              {saldoTotal >= 0 ? "+" : ""}{saldoTotal.toFixed(1)}h
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              {saldoPositivos} positivos · {saldoNegativos} negativos
            </p>
          </CardContent>
        </Card>

        {/* Prazo Compensação CCT */}
        <Card className={statusGeral === "vencido" ? "border-destructive/50" : statusGeral === "urgente" ? "border-amber-500/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`rounded-lg p-1.5 ${statusGeral === "vencido" ? "bg-destructive/10" : statusGeral === "urgente" ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                <Calendar className={`h-4 w-4 ${statusGeral === "vencido" ? "text-destructive" : statusGeral === "urgente" ? "text-amber-600" : "text-primary"}`} />
              </div>
              <p className="text-[11px] text-muted-foreground">Prazo Compensação</p>
            </div>
            <p className={`text-2xl font-bold ${statusGeral === "vencido" ? "text-destructive" : statusGeral === "urgente" ? "text-amber-600" : "text-emerald-600"}`}>
              {vencCCT.diasRestantes}d
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              CCT Cl. 41.2 — 60 dias por quinzena
            </p>
            <p className="text-[9px] text-muted-foreground">Vence: {vencCCT.dataVencimento}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Distribuição de Risco CCT</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={riskData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {riskData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">Passivo por Departamento (CCT)</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart
                data={Object.entries(porDepto)
                  .map(([dept, info]) => ({
                    dept: dept.length > 12 ? dept.slice(0, 12) + "…" : dept,
                    passivo: Math.round(info.passivo * 100) / 100,
                    saldo: Math.round(info.saldo * 10) / 10,
                  }))
                  .sort((a, b) => b.passivo - a.passivo)}
                margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted/30" />
                <XAxis dataKey="dept" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(value: number, name: string) => name === "passivo" ? formatCurrency(value) : `${value}h`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="passivo" name="Passivo R$ (CCT)" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="saldo" name="Saldo (h)" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Alertas */}
      {topAlertas.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Conformidade ({topAlertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {topAlertas.map((c) => {
                const isCritico = Math.abs(c.saldoDecimal) > 40;
                return (
                  <div
                    key={c.id}
                    className={`rounded-lg border p-3 text-sm ${isCritico ? "border-destructive/20 bg-destructive/5" : "border-amber-500/20 bg-amber-500/5"}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs truncate">
                          {isCritico ? "🔴" : "⚠️"} {c.nome}
                        </p>
                        <p className="text-[10px] text-muted-foreground">{c.cargo} · {c.departamento}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-mono text-xs font-bold ${c.saldoDecimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {c.bSaldo}
                        </span>
                        <p className="text-[9px] text-destructive font-mono">{formatCurrency(c.custoTotal)}</p>
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {isCritico
                        ? "Saldo excede 40h — pagar como extras com adicionais CCT (Cl. 10) até 2ª folha (Cl. 41.3)"
                        : "Saldo >20h — agendar compensação FIFO. Prazo: 60 dias/quinzena (Cl. 41.2)"}
                    </p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela por Departamento */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Análise por Departamento
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="text-xs">Departamento</TableHead>
                  <TableHead className="text-right text-xs">Colab.</TableHead>
                  <TableHead className="text-right text-xs">Críticos</TableHead>
                  <TableHead className="text-right text-xs">Saldo Total</TableHead>
                  <TableHead className="text-right text-xs">Passivo CCT</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(porDepto)
                  .sort((a, b) => b[1].passivo - a[1].passivo)
                  .map(([dept, info]) => {
                    const riskLevel = info.criticos > 0 ? "vencido" : Math.abs(info.saldo) > 20 * info.total ? "urgente" : "no_prazo";
                    return (
                      <TableRow key={dept}>
                        <TableCell className="text-xs font-medium py-2">{dept}</TableCell>
                        <TableCell className="text-right text-xs py-2">{info.total}</TableCell>
                        <TableCell className="text-right text-xs py-2">
                          {info.criticos > 0 ? (
                            <span className="text-destructive font-bold">{info.criticos}</span>
                          ) : (
                            <span className="text-muted-foreground">0</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-right font-mono text-xs font-bold py-2 ${info.saldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                          {info.saldo >= 0 ? "+" : ""}{info.saldo.toFixed(1)}h
                        </TableCell>
                        <TableCell className="text-right font-mono text-xs py-2 text-destructive">
                          {formatCurrency(info.passivo)}
                        </TableCell>
                        <TableCell className="py-2">
                          {riskLevel === "vencido" ? (
                            <Badge variant="destructive" className="text-[10px]">🔴 Crítico</Badge>
                          ) : riskLevel === "urgente" ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">🟡 Urgente</Badge>
                          ) : (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]">🟢 Normal</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Legislação Aplicada */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Legislação Aplicada — CCT prevalece (Art. 620 CLT)
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-3 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground text-[11px] mb-1">CCT EAA × SESCON-SP 2025/2026</p>
              <p><strong className="text-foreground">Cl. 41.1</strong> — Manifestação escrita obrigatória</p>
              <p><strong className="text-foreground">Cl. 41.2</strong> — 60 dias por quinzena (dia 15 ou 30)</p>
              <p><strong className="text-foreground">Cl. 41.3</strong> — Pagar até 2ª folha após vencimento</p>
              <p><strong className="text-foreground">Cl. 41.6</strong> — Dias-ponte: máx 2h/dia</p>
              <p><strong className="text-foreground">Cl. 10.1</strong> — Adicional 60% (até 2h)</p>
              <p><strong className="text-foreground">Cl. 10.2</strong> — Adicional 80% (excedente 2h)</p>
              <p><strong className="text-foreground">Cl. 10.3</strong> — Adicional 100% (dom/fer)</p>
              <p><strong className="text-foreground">Cl. 7</strong> — Reflexo HE em férias, 13º, DSR</p>
              <p><strong className="text-foreground">Cl. 58</strong> — Multa: 5% do maior piso</p>
            </div>
            <div className="space-y-1.5">
              <p className="font-semibold text-foreground text-[11px] mb-1">CLT (base subsidiária)</p>
              <p><strong className="text-foreground">Art. 58</strong> — Jornada: 8h/dia, 44h/semana</p>
              <p><strong className="text-foreground">Art. 59</strong> — Máx 2h extras/dia (10h total)</p>
              <p><strong className="text-foreground">Art. 59 §5º</strong> — Acordo individual: 6 meses</p>
              <p><strong className="text-foreground">Art. 59-B</strong> — HE habitual não descaracteriza banco</p>
              <p><strong className="text-foreground">Art. 59 §3º</strong> — Rescisão: pagar como extras</p>
              <p><strong className="text-foreground">Art. 7º XVI CF</strong> — Mínimo 50% (CCT eleva)</p>
              <p><strong className="text-foreground">Lei 605/49</strong> — Dom/feriados: 100%</p>
              <p><strong className="text-foreground">Art. 73</strong> — Noturno: 20% (52min30s)</p>
              <p><strong className="text-foreground">Art. 620</strong> — CCT prevalece se mais favorável</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BancoHorasCLTDashboard;
