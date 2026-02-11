import { Scale, AlertTriangle, Clock, DollarSign, Users, TrendingUp, Calendar, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { BancoHorasRow } from "./BancoHorasTable";

interface CLTDashboardProps {
  data: BancoHorasRow[];
  competencia: string;
}

const SALARIO_BASE = 2500;
const CARGA_MENSAL = 220;
const VALOR_HORA = SALARIO_BASE / CARGA_MENSAL;
const INSS_PATRONAL = 0.28;
const FGTS = 0.08;
const ENCARGOS = 1 + INSS_PATRONAL + FGTS;

function parseHoras(val: string): number {
  if (!val || val === "00:00") return 0;
  const neg = val.startsWith("-");
  const clean = val.replace("-", "");
  const [h, m] = clean.split(":").map(Number);
  const total = (h || 0) + (m || 0) / 60;
  return neg ? -total : total;
}

function classificarRisco(saldoDecimal: number): "normal" | "atencao" | "critico" {
  const abs = Math.abs(saldoDecimal);
  if (abs > 40) return "critico";
  if (abs > 20) return "atencao";
  return "normal";
}

function calcVencimentoDias(competencia: string): number {
  const [y, m] = competencia.split("-").map(Number);
  // Acordo individual: 6 meses (Art. 59 §5º CLT)
  const vencimento = new Date(y, m - 1 + 6, 0);
  const hoje = new Date();
  return Math.ceil((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const BancoHorasCLTDashboard = ({ data, competencia }: CLTDashboardProps) => {
  const diasVencimento = calcVencimentoDias(competencia);
  const vencimentoCritico = diasVencimento <= 30;
  const vencimentoAtencao = diasVencimento <= 60;

  // Classificação de risco
  const classificados = data.map((c) => ({
    ...c,
    risco: classificarRisco(c.saldoDecimal),
    horasEx50: parseHoras(c.ex60),
    horasEx100: parseHoras(c.ex100),
  }));

  const normais = classificados.filter((c) => c.risco === "normal").length;
  const atencao = classificados.filter((c) => c.risco === "atencao").length;
  const criticos = classificados.filter((c) => c.risco === "critico").length;
  const conformidade = data.length > 0 ? Math.round((normais / data.length) * 100) : 0;

  // Cálculos financeiros CLT
  const totalEx50Horas = classificados.reduce((a, c) => a + c.horasEx50, 0);
  const totalEx100Horas = classificados.reduce((a, c) => a + c.horasEx100, 0);
  const custoEx50 = totalEx50Horas * VALOR_HORA * 1.5;
  const custoEx100 = totalEx100Horas * VALOR_HORA * 2.0;
  const custoBruto = custoEx50 + custoEx100;
  const custoINSS = custoBruto * INSS_PATRONAL;
  const custoFGTS = custoBruto * FGTS;
  const passivoTotal = custoBruto * ENCARGOS;

  // Saldo total
  const saldoTotal = data.reduce((a, c) => a + c.saldoDecimal, 0);
  const saldoPositivos = data.filter((c) => c.saldoDecimal > 0);
  const saldoNegativos = data.filter((c) => c.saldoDecimal < 0);

  // Agrupamento por departamento
  const porDepto = classificados.reduce<Record<string, { total: number; criticos: number; saldo: number; custoProj: number }>>((acc, c) => {
    const d = c.departamento || "Sem setor";
    if (!acc[d]) acc[d] = { total: 0, criticos: 0, saldo: 0, custoProj: 0 };
    acc[d].total++;
    if (c.risco === "critico") acc[d].criticos++;
    acc[d].saldo += c.saldoDecimal;
    acc[d].custoProj += (c.horasEx50 * VALOR_HORA * 1.5 + c.horasEx100 * VALOR_HORA * 2.0) * ENCARGOS;
    return acc;
  }, {});

  // Top alertas (saldo absoluto > 20h)
  const alertas = classificados
    .filter((c) => c.risco !== "normal")
    .sort((a, b) => Math.abs(b.saldoDecimal) - Math.abs(a.saldoDecimal))
    .slice(0, 10);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Scale className="h-5 w-5 text-primary" />
        <div>
          <h3 className="font-semibold text-sm">Dashboard Conformidade CLT — {competencia}</h3>
          <p className="text-xs text-muted-foreground">Art. 58, 59 CLT · Lei 605/49 · Art. 7º XVI CF/88</p>
        </div>
      </div>

      {/* KPI Cards Row 1 */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        {/* Conformidade */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-1.5">
                <Shield className="h-4 w-4 text-emerald-600" />
              </div>
              <p className="text-[11px] text-muted-foreground">Conformidade CLT</p>
            </div>
            <p className={`text-2xl font-bold ${conformidade >= 70 ? "text-emerald-600" : conformidade >= 50 ? "text-amber-600" : "text-destructive"}`}>
              {conformidade}%
            </p>
            <Progress value={conformidade} className="mt-2 h-1.5" />
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5">✅ {normais}</Badge>
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5">⚠️ {atencao}</Badge>
              <Badge className="bg-destructive/10 text-destructive text-[10px] px-1.5">🔴 {criticos}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Passivo Projetado */}
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
              <p>50%: {formatCurrency(custoEx50)} · 100%: {formatCurrency(custoEx100)}</p>
              <p>INSS: {formatCurrency(custoINSS)} · FGTS: {formatCurrency(custoFGTS)}</p>
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
              {saldoPositivos.length} positivos · {saldoNegativos.length} negativos
            </p>
          </CardContent>
        </Card>

        {/* Vencimento Compensação */}
        <Card className={vencimentoCritico ? "border-destructive/50" : vencimentoAtencao ? "border-amber-500/50" : ""}>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className={`rounded-lg p-1.5 ${vencimentoCritico ? "bg-destructive/10" : vencimentoAtencao ? "bg-amber-100 dark:bg-amber-900/30" : "bg-primary/10"}`}>
                <Calendar className={`h-4 w-4 ${vencimentoCritico ? "text-destructive" : vencimentoAtencao ? "text-amber-600" : "text-primary"}`} />
              </div>
              <p className="text-[11px] text-muted-foreground">Prazo Compensação</p>
            </div>
            <p className={`text-2xl font-bold ${vencimentoCritico ? "text-destructive" : vencimentoAtencao ? "text-amber-600" : "text-emerald-600"}`}>
              {diasVencimento}d
            </p>
            <p className="text-[10px] text-muted-foreground mt-1">
              Art. 59 §5º CLT — Acordo individual 6 meses
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {alertas.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" />
              Alertas de Conformidade ({alertas.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="grid gap-2 sm:grid-cols-2">
              {alertas.map((c) => (
                <div
                  key={c.id}
                  className={`rounded-lg border p-3 text-sm ${
                    c.risco === "critico"
                      ? "border-destructive/20 bg-destructive/5"
                      : "border-amber-500/20 bg-amber-500/5"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-xs truncate">
                        {c.risco === "critico" ? "🔴" : "⚠️"} {c.nome}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{c.cargo} · {c.departamento}</p>
                    </div>
                    <span className={`font-mono text-xs font-bold shrink-0 ${c.saldoDecimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {c.bSaldo}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1.5">
                    {Math.abs(c.saldoDecimal) > 40
                      ? "Saldo excede 40h — compensar ou pagar como extras (Art. 59 §5º CLT)"
                      : c.saldoDecimal < -20
                      ? "Débito elevado — verificar jornada e ajustar escala (Art. 58 CLT)"
                      : "Saldo acima de 20h — monitorar e planejar compensação"}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Breakdown por Departamento */}
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
                  <TableHead className="text-right text-xs">Passivo Proj.</TableHead>
                  <TableHead className="text-xs">Risco</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(porDepto)
                  .sort((a, b) => b[1].custoProj - a[1].custoProj)
                  .map(([dept, info]) => {
                    const riskLevel = info.criticos > 0 ? "critico" : Math.abs(info.saldo) > 20 * info.total ? "atencao" : "normal";
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
                          {formatCurrency(info.custoProj)}
                        </TableCell>
                        <TableCell className="py-2">
                          {riskLevel === "critico" ? (
                            <Badge variant="destructive" className="text-[10px]">Crítico</Badge>
                          ) : riskLevel === "atencao" ? (
                            <Badge className="bg-amber-500 hover:bg-amber-600 text-white text-[10px]">Atenção</Badge>
                          ) : (
                            <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white text-[10px]">Normal</Badge>
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

      {/* Base Legal */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm flex items-center gap-2">
            <Scale className="h-4 w-4 text-primary" />
            Legislação Aplicada
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pb-4">
          <div className="grid gap-2 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="space-y-1.5">
              <p><strong className="text-foreground">Art. 58 CLT</strong> — Jornada máxima: 8h/dia, 44h/semana</p>
              <p><strong className="text-foreground">Art. 59 CLT</strong> — Máximo 2h extras/dia (10h total)</p>
              <p><strong className="text-foreground">Art. 59 §1º CLT</strong> — Adicional mín. 50% dias úteis</p>
              <p><strong className="text-foreground">Art. 59 §5º CLT</strong> — Acordo individual: prazo 6 meses</p>
            </div>
            <div className="space-y-1.5">
              <p><strong className="text-foreground">Art. 59 §2º CLT</strong> — Acordo coletivo: prazo 12 meses</p>
              <p><strong className="text-foreground">Art. 59 §3º CLT</strong> — Rescisão: pagar saldo como extras</p>
              <p><strong className="text-foreground">Lei 605/49</strong> — Domingos/feriados: adicional 100%</p>
              <p><strong className="text-foreground">Art. 73 CLT</strong> — Adicional noturno: 20% (52min30s)</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BancoHorasCLTDashboard;
