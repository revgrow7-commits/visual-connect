import { useState, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, RefreshCw, FileText, Trophy, XCircle, Loader2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { opportunitiesService } from "@/services/holdprint";
import type { HoldprintBudget } from "@/services/holdprint/types";
import { toast } from "sonner";

const fmtBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const PIPELINE_COLUMNS = [
  { state: 1, label: "Em Aberto", icon: FileText, color: "bg-blue-500", textColor: "text-blue-600" },
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

export default function CRMPipelinePage() {
  const [search, setSearch] = useState("");
  const [unidade, setUnidade] = useState("todas");
  const queryClient = useQueryClient();

  const { data: budgets = [], isLoading, isFetching } = useQuery({
    queryKey: ["holdprint-pipeline-budgets"],
    queryFn: async () => {
      const result = await opportunitiesService.budgetsSearch({ skip: 0, take: 200 });
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const handleSync = useCallback(() => {
    toast.info("Sincronizando orçamentos da Holdprint...");
    queryClient.invalidateQueries({ queryKey: ["holdprint-pipeline-budgets"] });
  }, [queryClient]);

  const filtered = useMemo(() => {
    return budgets.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !(b.title || "").toLowerCase().includes(q) &&
          !(b.customerName || "").toLowerCase().includes(q) &&
          !String(b.code).includes(q)
        ) return false;
      }
      return true;
    });
  }, [budgets, search]);

  const byState = (state: number) => filtered.filter(b => b.budgetState === state);
  const openBudgets = byState(1);
  const totalPipeline = openBudgets.reduce((s, b) => s + getBudgetValue(b), 0);

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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSync} disabled={isFetching}>
            {isFetching ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-1" />}
            Sincronizar Holdprint
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por cliente, código, título..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Badge variant="secondary">
          {filtered.length} orçamentos
        </Badge>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <span className="ml-3 text-muted-foreground">Carregando orçamentos da Holdprint...</span>
        </div>
      ) : (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {PIPELINE_COLUMNS.map(col => {
                const items = byState(col.state);
                const colTotal = items.reduce((s, b) => s + getBudgetValue(b), 0);
                return (
                  <div key={col.state} className="space-y-3">
                    <div className={`flex items-center gap-2 p-3 rounded-lg ${col.color}/10`}>
                      <col.icon className={`h-5 w-5 ${col.textColor}`} />
                      <span className="font-semibold">{col.label}</span>
                      <Badge variant="secondary">{items.length}</Badge>
                      <span className="ml-auto text-sm font-medium">{fmtBRL(colTotal)}</span>
                    </div>
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {items.map(budget => {
                        const value = getBudgetValue(budget);
                        const margin = getBudgetMargin(budget);
                        const itemName = budget.proposes?.[0]?.proposeItems?.[0]?.itemName;
                        return (
                          <Card
                            key={budget.code}
                            className={`cursor-pointer border-l-4 ${getMarginBorderColor(margin)} hover:shadow-md transition-shadow`}
                          >
                            <CardContent className="p-3 space-y-2">
                              <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <span className="font-semibold text-foreground">📄 Orç #{budget.code}</span>
                                <span>{budget.creationDate ? new Date(budget.creationDate).toLocaleDateString("pt-BR") : "—"}</span>
                              </div>
                              <p className="text-sm font-medium truncate">{budget.title || itemName || "Sem título"}</p>
                              <p className="text-xs text-muted-foreground">👤 {budget.customerName || "—"}</p>
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-primary">{fmtBRL(value)}</span>
                                {margin > 0 && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    {margin.toFixed(1)}%
                                  </Badge>
                                )}
                              </div>
                              {margin > 0 && <Progress value={margin} className="h-1" />}
                              {budget.proposes && budget.proposes.length > 1 && (
                                <span className="text-[10px] text-muted-foreground">
                                  {budget.proposes.length} propostas
                                </span>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                      {items.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-8">Nenhum orçamento</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="lista">
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Valor</TableHead>
                      <TableHead>Margem</TableHead>
                      <TableHead>Data</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map(b => {
                      const value = getBudgetValue(b);
                      const margin = getBudgetMargin(b);
                      const stateLabel = b.budgetState === 1 ? "Aberto" : b.budgetState === 3 ? "Ganho" : "Perdido";
                      const stateColor = b.budgetState === 1 ? "bg-blue-100 text-blue-700" : b.budgetState === 3 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";
                      return (
                        <TableRow key={b.code} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium text-sm">#{b.code}</TableCell>
                          <TableCell className="text-sm">{b.title || "—"}</TableCell>
                          <TableCell className="text-sm">{b.customerName || "—"}</TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${stateColor}`}>{stateLabel}</Badge>
                          </TableCell>
                          <TableCell className="text-right text-sm font-medium">{fmtBRL(value)}</TableCell>
                          <TableCell className="text-sm">{margin > 0 ? `${margin.toFixed(1)}%` : "—"}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {b.creationDate ? new Date(b.creationDate).toLocaleDateString("pt-BR") : "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                          Nenhum orçamento encontrado
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
