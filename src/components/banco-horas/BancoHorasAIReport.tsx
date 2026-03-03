import { useState } from "react";
import { Brain, Loader2, TrendingUp, AlertTriangle, Users, DollarSign, Scale, ChevronDown, ChevronUp, FileCheck, CheckCircle2, XCircle } from "lucide-react";
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
  status: string;
  emoji: string;
  saldo: string;
  saldo_decimal: number;
  horas_extras_60: string;
  horas_extras_80: string;
  horas_extras_100: string;
  passivo_projetado: number;
  dias_para_vencer: number;
  data_vencimento: string;
  carta_assinada: boolean;
  acoes_recomendadas: string[];
}

interface AlertaCritico {
  colaborador: string;
  motivo: string;
  acao_imediata: string;
  base_legal: string;
  passivo_envolvido: number;
}

interface ChecklistConformidade {
  cartas_assinadas: boolean;
  vencimentos_por_quinzena: boolean;
  adicionais_cct: boolean;
  pagamento_2a_folha: boolean;
  limite_dias_ponte: boolean;
  feriados_atualizados: boolean;
  encargos_incluidos: boolean;
  reflexo_habituais: boolean;
}

interface AnaliseIA {
  resumo_executivo: {
    total_colaboradores: number;
    normais: number;
    urgentes: number;
    vencidos: number;
    saldo_total_horas: string;
    total_he_registradas: number;
    total_he_compensadas: number;
    total_he_pendentes: number;
    passivo_projetado: number;
    passivo_extras_60: number;
    passivo_extras_80: number;
    passivo_extras_100: number;
    custo_inss: number;
    custo_fgts: number;
    conformidade_percent: number;
  };
  colaboradores: ColaboradorAnalise[];
  alertas_criticos: AlertaCritico[];
  checklist_conformidade: ChecklistConformidade;
  base_legal_aplicada: string[];
  recomendacoes_gerais: string[];
}

interface BancoHorasAIReportProps {
  data: any[];
  competencia: string;
}

const formatCurrency = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

const statusBadge = (status: string) => {
  switch (status) {
    case "vencido":
      return <Badge variant="destructive">🔴 Vencido</Badge>;
    case "urgente":
      return <Badge className="bg-amber-500 hover:bg-amber-600 text-white">🟡 Urgente</Badge>;
    case "compensado":
      return <Badge className="bg-muted text-muted-foreground">✅ Compensado</Badge>;
    default:
      return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white">🟢 No Prazo</Badge>;
  }
};

const BancoHorasAIReport = ({ data, competencia }: BancoHorasAIReportProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [analise, setAnalise] = useState<AnaliseIA | null>(null);
  const [showLegal, setShowLegal] = useState(false);
  const [showChecklist, setShowChecklist] = useState(false);

  const runAnalysis = async () => {
    if (data.length === 0) {
      toast({ title: "Sem dados", description: "Carregue os dados do Secullum primeiro.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const authToken = session?.access_token || anonKey;

      const userMessage = `Analise o banco de horas da competência ${competencia} para todos os colaboradores disponíveis no contexto. Use a tool generate_report para retornar o relatório estruturado completo com resumo_executivo, colaboradores, alertas_criticos, checklist_conformidade, base_legal_aplicada e recomendacoes_gerais. Aplique todas as regras da CCT EAA × SESCON-SP 2025/2026.`;

      const res = await fetch(`${supabaseUrl}/functions/v1/banco-horas-agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}`, apikey: anonKey },
        body: JSON.stringify({
          messages: [{ role: "user", content: userMessage }],
          provider: "gemini",
          stream: false,
          mode: "report",
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const json = await res.json();
      
      if (json.report) {
        setAnalise(json.report);
      } else if (json.content) {
        // Fallback: try to extract JSON from text content
        let cleaned = json.content.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
        const jsonStart = cleaned.indexOf("{");
        const jsonEnd = cleaned.lastIndexOf("}");
        if (jsonStart === -1 || jsonEnd === -1) throw new Error("Resposta sem JSON válido");
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1)
          .replace(/,\s*}/g, "}").replace(/,\s*]/g, "]").replace(/[\x00-\x1F\x7F]/g, "");
        setAnalise(JSON.parse(cleaned));
      } else {
        throw new Error("Formato de resposta inesperado");
      }
      
      toast({ title: "Análise concluída", description: "Relatório gerado com base na CCT EAA × SESCON-SP." });
    } catch (e: any) {
      console.error("Report error:", e);
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
          <h3 className="font-semibold text-lg mb-2">Análise Inteligente — CCT + CLT</h3>
          <p className="text-muted-foreground text-sm mb-1 max-w-md mx-auto">
            O agente aplica as regras da CCT EAA × SESCON-SP 2025/2026 (Cl. 10, 41) sobre a base CLT.
          </p>
          <p className="text-muted-foreground text-xs mb-4 max-w-md mx-auto">
            Adicionais 60%/80%/100% · Vencimento por quinzena (60 dias) · Checklist de conformidade
          </p>
          <Button onClick={runAnalysis} disabled={loading || data.length === 0} size="lg">
            {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
            {loading ? "Analisando com IA..." : "Gerar Relatório CCT + CLT"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const r = analise.resumo_executivo;

  return (
    <div className="space-y-6">
      {/* Action bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          <div>
            <h3 className="font-semibold text-sm">Relatório IA — {competencia}</h3>
            <p className="text-xs text-muted-foreground">CCT EAA × SESCON-SP 2025/2026</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={runAnalysis} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Brain className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-1.5"><Users className="h-4 w-4 text-primary" /></div>
              <p className="text-[11px] text-muted-foreground">Colaboradores</p>
            </div>
            <p className="text-2xl font-bold">{r.total_colaboradores}</p>
            <div className="flex gap-1.5 mt-2 flex-wrap">
              <Badge className="bg-emerald-500/10 text-emerald-600 text-[10px] px-1.5">🟢 {r.normais}</Badge>
              <Badge className="bg-amber-500/10 text-amber-600 text-[10px] px-1.5">🟡 {r.urgentes}</Badge>
              <Badge className="bg-destructive/10 text-destructive text-[10px] px-1.5">🔴 {r.vencidos}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-destructive/10 p-1.5"><DollarSign className="h-4 w-4 text-destructive" /></div>
              <p className="text-[11px] text-muted-foreground">Passivo CCT</p>
            </div>
            <p className="text-xl font-bold text-destructive">{formatCurrency(r.passivo_projetado)}</p>
            <div className="text-[10px] text-muted-foreground mt-1 space-y-0.5">
              <p>60%: {formatCurrency(r.passivo_extras_60)} · 80%: {formatCurrency(r.passivo_extras_80)}</p>
              <p>100%: {formatCurrency(r.passivo_extras_100)}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-primary/10 p-1.5"><TrendingUp className="h-4 w-4 text-primary" /></div>
              <p className="text-[11px] text-muted-foreground">Encargos</p>
            </div>
            <p className="text-base font-bold">INSS: {formatCurrency(r.custo_inss)}</p>
            <p className="text-base font-bold">FGTS: {formatCurrency(r.custo_fgts)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-1.5"><Scale className="h-4 w-4 text-emerald-600" /></div>
              <p className="text-[11px] text-muted-foreground">Conformidade</p>
            </div>
            <p className={`text-2xl font-bold ${r.conformidade_percent >= 95 ? "text-emerald-600" : r.conformidade_percent >= 70 ? "text-amber-600" : "text-destructive"}`}>
              {r.conformidade_percent}%
            </p>
            <Progress value={r.conformidade_percent} className="mt-2 h-1.5" />
          </CardContent>
        </Card>
      </div>

      {/* Checklist de Conformidade CCT */}
      {analise.checklist_conformidade && (
        <Collapsible open={showChecklist} onOpenChange={setShowChecklist}>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-primary" />
                    Checklist de Conformidade CCT
                  </CardTitle>
                  {showChecklist ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                <div className="grid gap-2 sm:grid-cols-2">
                  {Object.entries(analise.checklist_conformidade).map(([key, value]) => {
                    const labels: Record<string, string> = {
                      cartas_assinadas: "Cartas de manifestação assinadas (Cl. 41.1)",
                      vencimentos_por_quinzena: "Vencimentos calculados por quinzena (Cl. 41.2)",
                      adicionais_cct: "Adicionais da CCT aplicados (60%/80%/100%)",
                      pagamento_2a_folha: "Vencidos pagos até 2ª folha (Cl. 41.3)",
                      limite_dias_ponte: "Dias-ponte ≤ 2h/dia (Cl. 41.6)",
                      feriados_atualizados: "Calendário de feriados atualizado",
                      encargos_incluidos: "Encargos (INSS+FGTS) incluídos no passivo",
                      reflexo_habituais: "Reflexo HE em férias/13º/DSR (Cl. 7)",
                    };
                    return (
                      <div key={key} className="flex items-center gap-2 text-xs">
                        {value ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-destructive shrink-0" />
                        )}
                        <span className={value ? "text-muted-foreground" : "text-destructive font-medium"}>
                          {labels[key] || key}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      )}

      {/* Critical alerts */}
      {analise.alertas_criticos.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-3 pt-4 px-4">
            <CardTitle className="text-sm flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-4 w-4" /> Alertas Críticos ({analise.alertas_criticos.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {analise.alertas_criticos.map((a, i) => (
              <div key={i} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-xs">🔴 {a.colaborador}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.motivo}</p>
                    <p className="text-xs font-medium mt-1">→ {a.acao_imediata}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <Badge variant="outline" className="text-[10px]">{a.base_legal}</Badge>
                    {a.passivo_envolvido > 0 && (
                      <p className="text-[10px] text-destructive font-mono mt-1">{formatCurrency(a.passivo_envolvido)}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Detailed table */}
      <Card>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">Análise Individual (CCT)</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-xs">
                  <TableHead className="text-xs">Colaborador</TableHead>
                  <TableHead className="text-xs">Status</TableHead>
                  <TableHead className="text-right text-xs">Saldo</TableHead>
                  <TableHead className="text-right text-xs">60%</TableHead>
                  <TableHead className="text-right text-xs">80%</TableHead>
                  <TableHead className="text-right text-xs">100%</TableHead>
                  <TableHead className="text-right text-xs">Passivo</TableHead>
                  <TableHead className="text-right text-xs">Vence</TableHead>
                  <TableHead className="text-xs">Carta</TableHead>
                  <TableHead className="text-xs">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {analise.colaboradores.map((c, i) => (
                  <TableRow key={i} className={c.status === "vencido" ? "bg-destructive/5" : c.status === "urgente" ? "bg-amber-500/5" : ""}>
                    <TableCell className="py-2">
                      <p className="font-medium text-xs">{c.nome}</p>
                      <p className="text-[10px] text-muted-foreground">{c.cargo}</p>
                    </TableCell>
                    <TableCell className="py-2">{statusBadge(c.status)}</TableCell>
                    <TableCell className={`text-right font-mono text-xs font-bold py-2 ${c.saldo_decimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                      {c.saldo}
                    </TableCell>
                    <TableCell className="text-right font-mono text-xs py-2">{c.horas_extras_60}</TableCell>
                    <TableCell className="text-right font-mono text-xs py-2">{c.horas_extras_80}</TableCell>
                    <TableCell className="text-right font-mono text-xs py-2">{c.horas_extras_100}</TableCell>
                    <TableCell className="text-right font-mono text-xs font-bold text-destructive py-2">
                      {formatCurrency(c.passivo_projetado)}
                    </TableCell>
                    <TableCell className="text-right text-xs py-2">
                      <span className={c.dias_para_vencer <= 15 ? "text-destructive font-bold" : c.dias_para_vencer <= 30 ? "text-amber-600" : ""}>
                        {c.dias_para_vencer}d
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      {c.carta_assinada ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-destructive" />
                      )}
                    </TableCell>
                    <TableCell className="max-w-[180px] py-2">
                      <ul className="text-[10px] text-muted-foreground space-y-0.5">
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
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-sm">📋 Recomendações</CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ul className="space-y-1.5">
              {analise.recomendacoes_gerais.map((r, i) => (
                <li key={i} className="text-xs flex gap-2">
                  <span className="text-primary font-bold shrink-0">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Collapsible open={showLegal} onOpenChange={setShowLegal}>
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                  <CardTitle className="text-sm">⚖️ Base Legal Aplicada</CardTitle>
                  {showLegal ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>
            <CollapsibleContent>
              <CardContent className="px-4 pb-4">
                <ul className="space-y-1">
                  {analise.base_legal_aplicada.map((b, i) => (
                    <li key={i} className="text-[11px] text-muted-foreground">• {b}</li>
                  ))}
                </ul>
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      </div>
    </div>
  );
};

export default BancoHorasAIReport;
