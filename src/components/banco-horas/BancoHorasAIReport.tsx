import { useState } from "react";
import { Brain, Loader2, TrendingUp, AlertTriangle, Users, DollarSign, Scale, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface ColaboradorAnalise {
  nome: string;
  cargo: string;
  departamento: string;
  nivel_alerta: string;
  emoji: string;
  saldo: string;
  saldo_decimal: number;
  horas_extras_50: string;
  horas_extras_100: string;
  custo_projetado: number;
  dias_para_vencer: number;
  data_vencimento: string;
  acoes_recomendadas: string[];
}

interface AlertaCritico {
  colaborador: string;
  motivo: string;
  acao_imediata: string;
  base_legal: string;
}

interface AnaliseIA {
  resumo_executivo: {
    total_colaboradores: number;
    normais: number;
    atencao: number;
    criticos: number;
    saldo_total_horas: string;
    custo_total_projetado: number;
    custo_extras_50: number;
    custo_extras_100: number;
    custo_inss: number;
    custo_fgts: number;
  };
  colaboradores: ColaboradorAnalise[];
  alertas_criticos: AlertaCritico[];
  base_legal_aplicada: string[];
  recomendacoes_gerais: string[];
}

interface BancoHorasAIReportProps {
  data: any[];
  competencia: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const alertBadge = (nivel: string) => {
  switch (nivel) {
    case "critico":
      return <Badge variant="destructive">🔴 Crítico</Badge>;
    case "atencao":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">⚠️ Atenção</Badge>;
    default:
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">✅ Normal</Badge>;
  }
};

const BancoHorasAIReport = ({ data, competencia }: BancoHorasAIReportProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<AnaliseIA | null>(null);
  const [showLegal, setShowLegal] = useState(false);

  const runAnalysis = async () => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Carregue os dados do Secullum primeiro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const authToken = session?.access_token;
      if (!authToken) throw new Error("Sessão expirada.");

      const colaboradores = data.map((c: any) => ({
        nome: c.nome,
        cargo: c.cargo,
        departamento: c.departamento,
        unidade: c.unidade,
        normais: c.normais,
        carga: c.carga,
        faltas: c.faltas,
        ex60: c.ex60,
        ex80: c.ex80,
        ex100: c.ex100,
        bSaldo: c.bSaldo,
        bTotal: c.bTotal,
        bCred: c.bCred,
        bDeb: c.bDeb,
      }));

      const res = await fetch(`${supabaseUrl}/functions/v1/banco-horas-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
        body: JSON.stringify({ colaboradores, competencia }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      setAnalise(result);
      toast({ title: "Análise concluída", description: "Relatório gerado com base na CLT." });
    } catch (e: any) {
      toast({ title: "Erro na análise IA", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (!analise) {
    return (
      <Card className="border-dashed">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-primary/60" />
          <h3 className="font-semibold text-lg mb-2">Análise Inteligente CLT</h3>
          <p className="text-muted-foreground text-sm mb-4 max-w-md mx-auto">
            O agente de IA analisa o banco de horas com base na CLT, calcula custos projetados, identifica riscos e gera alertas automáticos.
          </p>
          <Button onClick={runAnalysis} disabled={loading || data.length === 0} size="lg">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            {loading ? "Analisando com IA..." : "Gerar Relatório com IA"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const r = analise.resumo_executivo;
  const totalAlerts = r.atencao + r.criticos;
  const safePercent = r.total_colaboradores > 0 ? Math.round((r.normais / r.total_colaboradores) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <h3 className="font-semibold">Relatório IA — Competência {competencia}</h3>
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          Atualizar Análise
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2"><Users className="h-5 w-5 text-primary" /></div>
              <p className="text-sm font-medium text-muted-foreground">Colaboradores</p>
            </div>
            <p className="text-3xl font-bold">{r.total_colaboradores}</p>
            <div className="flex gap-2 mt-2">
              <Badge className="bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20">✅ {r.normais}</Badge>
              <Badge className="bg-amber-500/10 text-amber-600 hover:bg-amber-500/20">⚠️ {r.atencao}</Badge>
              <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/20">🔴 {r.criticos}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-destructive/10 p-2"><DollarSign className="h-5 w-5 text-destructive" /></div>
              <p className="text-sm font-medium text-muted-foreground">Passivo Projetado</p>
            </div>
            <p className="text-2xl font-bold text-destructive">{formatCurrency(r.custo_total_projetado)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              Extras 50%: {formatCurrency(r.custo_extras_50)} · 100%: {formatCurrency(r.custo_extras_100)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-primary/10 p-2"><TrendingUp className="h-5 w-5 text-primary" /></div>
              <p className="text-sm font-medium text-muted-foreground">Encargos</p>
            </div>
            <p className="text-lg font-bold">INSS: {formatCurrency(r.custo_inss)}</p>
            <p className="text-lg font-bold">FGTS: {formatCurrency(r.custo_fgts)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2"><Scale className="h-5 w-5 text-emerald-600" /></div>
              <p className="text-sm font-medium text-muted-foreground">Conformidade</p>
            </div>
            <p className="text-3xl font-bold text-emerald-600">{safePercent}%</p>
            <Progress value={safePercent} className="mt-2 h-2" />
            <p className="text-xs text-muted-foreground mt-1">{r.normais} de {r.total_colaboradores} dentro do limite</p>
          </CardContent>
        </Card>
      </div>

      {/* Critical alerts */}
      {analise.alertas_criticos.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Alertas Críticos ({analise.alertas_criticos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {analise.alertas_criticos.map((a, i) => (
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm">🔴 {a.colaborador}</p>
                    <p className="text-sm text-muted-foreground mt-1">{a.motivo}</p>
                    <p className="text-sm font-medium mt-2">→ {a.acao_imediata}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{a.base_legal}</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Análise por Colaborador</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Colaborador</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Saldo</TableHead>
                  <TableHead className="text-right">Ex 50%</TableHead>
                  <TableHead className="text-right">Ex 100%</TableHead>
                  <TableHead className="text-right">Custo Proj.</TableHead>
                  <TableHead className="text-right">Vencimento</TableHead>
                  <TableHead>Ações Recomendadas</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analise.colaboradores.map((c, i) => (
                  <TableRow key={i} className={c.nivel_alerta === "critico" ? "bg-destructive/5" : c.nivel_alerta === "atencao" ? "bg-amber-500/5" : ""}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.cargo}</p>
                      </div>
                    </TableCell>
                    <TableCell>{alertBadge(c.nivel_alerta)}</TableCell>
                    <TableCell className={`text-right font-mono text-sm font-bold ${c.saldo_decimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {c.saldo}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">{c.horas_extras_50}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{c.horas_extras_100}</TableCell>
                    <TableCell className="text-right font-mono text-sm font-bold text-destructive">
                      {formatCurrency(c.custo_projetado)}
                    </TableCell>
                    <TableCell className="text-right text-sm">
                      <span className={c.dias_para_vencer <= 30 ? "text-destructive font-bold" : ""}>
                        {c.dias_para_vencer}d
                      </span>
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <ul className="text-xs text-muted-foreground space-y-0.5">
                        {c.acoes_recomendadas?.slice(0, 2).map((a, j) => (
                          <li key={j}>• {a}</li>
                        ))}
                      </ul>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations & Legal */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">📋 Recomendações Gerais</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {analise.recomendacoes_gerais.map((r, i) => (
                <li key={i} className="text-sm flex gap-2">
                  <span className="text-primary font-bold">{i + 1}.</span> {r}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <Collapsible open={showLegal} onOpenChange={setShowLegal}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <CardTitle className="text-base">⚖️ Base Legal Aplicada</CardTitle>
                  {showLegal ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent>
                <ul className="space-y-1.5">
                  {analise.base_legal_aplicada.map((b, i) => (
                    <li key={i} className="text-xs text-muted-foreground">• {b}</li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      </div>
    </div>
  );
};

export default BancoHorasAIReport;
