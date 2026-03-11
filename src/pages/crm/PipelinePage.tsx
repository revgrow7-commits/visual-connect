import { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Search, RefreshCw, FileText, Trophy, XCircle, Loader2,
  Send, Eye, MessageSquare, CheckCircle2, Clock, Calendar,
  Phone, Users, Link2, DollarSign, TrendingUp, Target,
  ExternalLink, ListChecks, PenLine
} from "lucide-react";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import { opportunitiesService } from "@/services/holdprint";
import { supabase } from "@/integrations/supabase/client";
import type { HoldprintBudget } from "@/services/holdprint/types";
import { toast } from "sonner";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

// Holdprint pipeline stages for open budgets
const PIPELINE_STAGES = [
  { id: "rascunho", label: "Rascunho", icon: PenLine, color: "bg-slate-500", textColor: "text-slate-600", dotColor: "bg-slate-400" },
  { id: "emitido", label: "Emitido", icon: FileText, color: "bg-blue-500", textColor: "text-blue-600", dotColor: "bg-blue-500" },
  { id: "enviado", label: "Enviado", icon: Send, color: "bg-cyan-500", textColor: "text-cyan-600", dotColor: "bg-cyan-500" },
  { id: "negociacao", label: "Negociação", icon: MessageSquare, color: "bg-amber-500", textColor: "text-amber-600", dotColor: "bg-amber-500" },
  { id: "aceite_verbal", label: "Aceite Verbal", icon: CheckCircle2, color: "bg-purple-500", textColor: "text-purple-600", dotColor: "bg-purple-500" },
];

const RESULT_COLUMNS = [
  { state: 3, label: "Ganhos", icon: Trophy, color: "bg-green-500", textColor: "text-green-600" },
  { state: 2, label: "Perdidos", icon: XCircle, color: "bg-red-500", textColor: "text-red-600" },
];

function getBudgetValue(b: HoldprintBudget): number {
  if (!b.proposes?.length) return 0;
  return Math.max(...b.proposes.map(p => p.totalPrice || 0));
}

function getBudgetMargin(b: HoldprintBudget): number {
  if (!b.proposes?.length) return 0;
  return b.proposes[0]?.totalProfitPercentual || 0;
}

function getMarginBorderColor(margin: number) {
  if (margin > 40) return "border-l-green-500";
  if (margin >= 30) return "border-l-blue-500";
  if (margin >= 20) return "border-l-amber-500";
  return "border-l-red-500";
}

function inferBudgetStep(b: HoldprintBudget): string {
  if (b.budgetStep) return b.budgetStep;
  if (b.budgetStepName) {
    const name = b.budgetStepName.toLowerCase();
    if (name.includes("rascunho")) return "rascunho";
    if (name.includes("emitido")) return "emitido";
    if (name.includes("enviado")) return "enviado";
    if (name.includes("negoci")) return "negociacao";
    if (name.includes("aceite")) return "aceite_verbal";
  }
  // Fallback heuristic based on proposal data
  if (b.proposes?.some(p => p.viewedDate)) return "negociacao";
  if (b.proposes?.some(p => p.sentDate)) return "enviado";
  if (b.proposes?.length && b.proposes.some(p => (p.totalPrice || 0) > 0)) return "emitido";
  return "rascunho";
}

// ─── Budget Card Component ───
function BudgetCard({ budget }: { budget: HoldprintBudget }) {
  const value = getBudgetValue(budget);
  const margin = getBudgetMargin(budget);
  const itemName = budget.proposes?.[0]?.proposeItems?.[0]?.itemName;
  const hasProposalLink = !!budget.proposalLink;
  const wasViewed = !!budget.proposalViewedAt || budget.proposes?.some(p => p.viewedDate);

  return (
    <Card className={`cursor-pointer border-l-4 ${getMarginBorderColor(margin)} hover:shadow-md transition-shadow`}>
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">📄 Orç #{budget.code}</span>
          <span>{budget.creationDate ? new Date(budget.creationDate).toLocaleDateString("pt-BR") : "—"}</span>
        </div>
        <p className="text-sm font-medium truncate">{budget.title || itemName || "Sem título"}</p>
        <div className="text-xs space-y-0.5">
          <p className="text-muted-foreground">👤 {budget.customerName || "—"}</p>
          {budget.commercialResponsible && (
            <p className="text-muted-foreground">🧑‍💼 {budget.commercialResponsible}</p>
          )}
        </div>
        <div className="flex items-center justify-between">
          <span className="font-bold text-sm text-primary">{fmtBRL(value)}</span>
          {margin > 0 && (
            <Badge variant="secondary" className="text-[10px]">{margin.toFixed(1)}%</Badge>
          )}
        </div>
        {margin > 0 && <Progress value={Math.min(margin, 100)} className="h-1" />}
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
          {budget.proposes && budget.proposes.length > 1 && (
            <span>{budget.proposes.length} propostas</span>
          )}
          {hasProposalLink && (
            <Badge variant="outline" className="text-[9px] gap-0.5 px-1 py-0">
              <Link2 className="h-2.5 w-2.5" /> Link ativo
            </Badge>
          )}
          {wasViewed && (
            <Badge variant="outline" className="text-[9px] gap-0.5 px-1 py-0 border-green-300 text-green-600">
              <Eye className="h-2.5 w-2.5" /> Visualizado
            </Badge>
          )}
        </div>
        {budget.deliveryNeed && (
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
            <Calendar className="h-3 w-3" />
            Entrega: {new Date(budget.deliveryNeed).toLocaleDateString("pt-BR")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Page ───
export default function CRMPipelinePage() {
  const [search, setSearch] = useState("");
  const [mainTab, setMainTab] = useState("deals");
  const queryClient = useQueryClient();

  // Fetch budgets from Holdprint
  const { data: budgets = [], isLoading, isFetching } = useQuery({
    queryKey: ["holdprint-pipeline-budgets"],
    queryFn: async () => {
      const result = await opportunitiesService.budgetsSearch({ skip: 0, take: 200 });
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  // Fetch CRM tasks from Supabase
  const { data: tasks = [] } = useQuery({
    queryKey: ["crm-pipeline-tasks"],
    queryFn: async () => {
      const { data } = await supabase
        .from("crm_tasks")
        .select("*")
        .eq("completed", false)
        .order("due_date", { ascending: true })
        .limit(50);
      return data || [];
    },
  });

  // Toggle task completion
  const toggleTask = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      await supabase
        .from("crm_tasks")
        .update({ completed, completed_at: completed ? new Date().toISOString() : null })
        .eq("id", id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["crm-pipeline-tasks"] }),
  });

  const handleSync = useCallback(() => {
    toast.info("Sincronizando orçamentos da Holdprint...");
    queryClient.invalidateQueries({ queryKey: ["holdprint-pipeline-budgets"] });
  }, [queryClient]);

  const filtered = useMemo(() => {
    return budgets.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        return (
          (b.title || "").toLowerCase().includes(q) ||
          (b.customerName || "").toLowerCase().includes(q) ||
          String(b.code).includes(q) ||
          (b.commercialResponsible || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [budgets, search]);

  const openBudgets = filtered.filter(b => b.budgetState === 1);
  const totalPipeline = openBudgets.reduce((s, b) => s + getBudgetValue(b), 0);
  const wonBudgets = filtered.filter(b => b.budgetState === 3);
  const lostBudgets = filtered.filter(b => b.budgetState === 2);
  const totalWon = wonBudgets.reduce((s, b) => s + getBudgetValue(b), 0);
  const conversionRate = filtered.length > 0 ? ((wonBudgets.length / filtered.length) * 100) : 0;

  // Group open budgets by inferred pipeline step
  const budgetsByStep = (stepId: string) =>
    openBudgets.filter(b => inferBudgetStep(b) === stepId);

  // Proposals from all budgets
  const allProposals = useMemo(() => {
    return filtered
      .filter(b => b.proposes && b.proposes.length > 0)
      .flatMap(b =>
        (b.proposes || []).map((p, i) => ({
          budgetCode: b.code,
          budgetTitle: b.title,
          customerName: b.customerName,
          commercialResponsible: b.commercialResponsible,
          budgetState: b.budgetState,
          proposalIndex: i + 1,
          proposalName: p.name || `Proposta ${i + 1}`,
          totalPrice: p.totalPrice || 0,
          productionCost: p.productionCost || 0,
          margin: p.totalProfitPercentual || 0,
          paymentOption: p.paymentOption,
          sentDate: p.sentDate,
          viewedDate: p.viewedDate,
          itemCount: p.proposeItems?.length || 0,
          items: p.proposeItems || [],
        }))
      );
  }, [filtered]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Pipeline</h1>
          <p className="text-sm text-muted-foreground">
            {openBudgets.length} orçamentos abertos • {fmtBRL(totalPipeline)} em pipeline
            {budgets.length > 0 && ` • ${budgets.length} total sincronizados`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSync} disabled={isFetching}>
          {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
          Sincronizar Holdprint
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Em Aberto</p>
              <p className="text-xl font-bold">{fmtBRL(totalPipeline)}</p>
              <p className="text-[10px] text-muted-foreground">{openBudgets.length} orçamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Trophy className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ganhos</p>
              <p className="text-xl font-bold">{fmtBRL(totalWon)}</p>
              <p className="text-[10px] text-muted-foreground">{wonBudgets.length} orçamentos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${conversionRate > 35 ? "bg-green-100" : conversionRate >= 20 ? "bg-amber-100" : "bg-red-100"}`}>
              <Target className={`h-5 w-5 ${conversionRate > 35 ? "text-green-600" : conversionRate >= 20 ? "text-amber-600" : "text-red-600"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Conversão</p>
              <p className="text-xl font-bold">{conversionRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio</p>
              <p className="text-xl font-bold">{wonBudgets.length > 0 ? fmtBRL(totalWon / wonBudgets.length) : "—"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, código, responsável..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">{filtered.length} orçamentos</Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Carregando orçamentos da Holdprint...</span>
        </div>
      ) : (
        <Tabs value={mainTab} onValueChange={setMainTab}>
          <TabsList>
            <TabsTrigger value="deals">
              <TrendingUp className="h-4 w-4 mr-1" /> Deals (Pipeline)
            </TabsTrigger>
            <TabsTrigger value="propostas">
              <Send className="h-4 w-4 mr-1" /> Propostas
            </TabsTrigger>
            <TabsTrigger value="tarefas">
              <ListChecks className="h-4 w-4 mr-1" /> Tarefas & Follow-up
            </TabsTrigger>
          </TabsList>

          {/* ─── DEALS PIPELINE ─── */}
          <TabsContent value="deals" className="space-y-6">
            {/* Pipeline stages for open budgets */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Painel de Negociação</h3>
              <div className="flex gap-3 overflow-x-auto pb-4">
                {PIPELINE_STAGES.map(stage => {
                  const items = budgetsByStep(stage.id);
                  const stageTotal = items.reduce((s, b) => s + getBudgetValue(b), 0);
                  return (
                    <div key={stage.id} className="min-w-[240px] max-w-[280px] flex-shrink-0">
                      <div className="flex items-center gap-2 mb-2 px-1">
                        <div className={`h-2.5 w-2.5 rounded-full ${stage.dotColor}`} />
                        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stage.label}</span>
                        <Badge variant="secondary" className="text-[10px] ml-auto">{items.length}</Badge>
                      </div>
                      <p className="text-[10px] text-muted-foreground px-1 mb-2">{fmtBRL(stageTotal)}</p>
                      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                        {items.map(budget => (
                          <BudgetCard key={budget.code} budget={budget} />
                        ))}
                        {items.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-8">Nenhum deal</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Won & Lost columns */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Resultado</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {RESULT_COLUMNS.map(col => {
                  const items = col.state === 3 ? wonBudgets : lostBudgets;
                  const colTotal = items.reduce((s, b) => s + getBudgetValue(b), 0);
                  return (
                    <div key={col.state} className="space-y-3">
                      <div className={`flex items-center gap-2 p-3 rounded-lg ${col.color}/10`}>
                        <col.icon className={`h-5 w-5 ${col.textColor}`} />
                        <span className="font-semibold">{col.label}</span>
                        <Badge variant="secondary">{items.length}</Badge>
                        <span className="ml-auto text-sm font-medium">{fmtBRL(colTotal)}</span>
                      </div>
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {items.slice(0, 10).map(budget => (
                          <BudgetCard key={budget.code} budget={budget} />
                        ))}
                        {items.length > 10 && (
                          <p className="text-xs text-muted-foreground text-center py-2">
                            + {items.length - 10} orçamentos
                          </p>
                        )}
                        {items.length === 0 && (
                          <p className="text-xs text-muted-foreground text-center py-6">Nenhum orçamento</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* ─── PROPOSTAS ─── */}
          <TabsContent value="propostas">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Send className="h-4 w-4" />
                  Propostas Holdprint
                  <Badge variant="secondary" className="ml-2">{allProposals.length}</Badge>
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Propostas enviadas via link interativo para aprovação do cliente
                </p>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Orçamento</TableHead>
                      <TableHead>Proposta</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Margem</TableHead>
                      <TableHead>Itens</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allProposals.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Nenhuma proposta encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      allProposals.map((p, i) => {
                        const stateLabel = p.budgetState === 1 ? "Aberto" : p.budgetState === 3 ? "Ganho" : "Perdido";
                        const stateColor = p.budgetState === 1 ? "bg-blue-100 text-blue-700" : p.budgetState === 3 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                        return (
                          <TableRow key={`${p.budgetCode}-${i}`} className="hover:bg-muted/50">
                            <TableCell className="font-medium text-sm">#{p.budgetCode}</TableCell>
                            <TableCell className="text-sm">{p.proposalName}</TableCell>
                            <TableCell className="text-sm">{p.customerName || "—"}</TableCell>
                            <TableCell className="text-sm">{p.commercialResponsible || "—"}</TableCell>
                            <TableCell className="text-right text-sm font-medium">{fmtBRL(p.totalPrice)}</TableCell>
                            <TableCell className="text-sm">
                              {p.margin > 0 ? (
                                <span className={p.margin > 30 ? "text-green-600" : p.margin >= 20 ? "text-amber-600" : "text-red-600"}>
                                  {p.margin.toFixed(1)}%
                                </span>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-sm">{p.itemCount}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{p.paymentOption || "—"}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Badge className={`text-[10px] ${stateColor}`}>{stateLabel}</Badge>
                                {p.viewedDate && (
                                  <Badge variant="outline" className="text-[9px] gap-0.5 px-1 py-0 border-green-300 text-green-600">
                                    <Eye className="h-2.5 w-2.5" />
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ─── TAREFAS & FOLLOW-UP ─── */}
          <TabsContent value="tarefas" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Follow-up tasks from CRM */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ListChecks className="h-4 w-4" />
                    Tarefas de Follow-up
                    <Badge variant="secondary" className="ml-2">{tasks.length}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Ligações, reuniões e visitas vinculadas aos orçamentos
                  </p>
                </CardHeader>
                <CardContent className="space-y-2">
                  {tasks.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhuma tarefa pendente</p>
                  ) : (
                    tasks.map((task: any) => {
                      const isOverdue = task.due_date && new Date(task.due_date) < new Date();
                      return (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 p-3 rounded-lg border ${isOverdue ? "border-red-200 bg-red-50/50" : "border-border"}`}
                        >
                          <Checkbox
                            checked={task.completed}
                            onCheckedChange={(checked) =>
                              toggleTask.mutate({ id: task.id, completed: !!checked })
                            }
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">{task.title}</p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground truncate">{task.description}</p>
                            )}
                            <div className="flex items-center gap-3 mt-1 text-[10px] text-muted-foreground">
                              <span className="flex items-center gap-0.5">
                                <Users className="h-3 w-3" /> {task.owner_name}
                              </span>
                              {task.due_date && (
                                <span className={`flex items-center gap-0.5 ${isOverdue ? "text-red-600 font-medium" : ""}`}>
                                  <Clock className="h-3 w-3" />
                                  {new Date(task.due_date).toLocaleDateString("pt-BR")}
                                  {isOverdue && " (atrasada)"}
                                </span>
                              )}
                              <Badge variant={
                                task.priority === "alta" ? "destructive" :
                                task.priority === "media" ? "secondary" : "outline"
                              } className="text-[9px]">
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>

              {/* Upcoming follow-ups / Calendar preview */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Agenda de Acompanhamento
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    Próximos follow-ups e interações programadas
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Show budgets that might need follow-up */}
                  {openBudgets.slice(0, 8).map(budget => {
                    const step = inferBudgetStep(budget);
                    const stageInfo = PIPELINE_STAGES.find(s => s.id === step);
                    return (
                      <div key={budget.code} className="flex items-center gap-3 p-2 rounded-lg border border-border hover:bg-muted/50">
                        <div className={`h-2 w-2 rounded-full ${stageInfo?.dotColor || "bg-slate-400"}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            #{budget.code} — {budget.customerName || "Sem cliente"}
                          </p>
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <span>{stageInfo?.label || step}</span>
                            <span>•</span>
                            <span>{fmtBRL(getBudgetValue(budget))}</span>
                            {budget.commercialResponsible && (
                              <>
                                <span>•</span>
                                <span>{budget.commercialResponsible}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-[9px] flex-shrink-0">
                          {budget.deliveryNeed
                            ? new Date(budget.deliveryNeed).toLocaleDateString("pt-BR")
                            : "Sem prazo"}
                        </Badge>
                      </div>
                    );
                  })}
                  {openBudgets.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-8">Nenhum orçamento aberto</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
