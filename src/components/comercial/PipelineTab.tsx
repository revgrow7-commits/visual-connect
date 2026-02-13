import React, { forwardRef, useState, useMemo } from "react";
import { Budget, formatCurrency, formatDate, getMarginBorderColor } from "./types";
import { mockBudgets } from "./mockData";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Trophy, XCircle, Target, DollarSign, TrendingUp, RefreshCw, Factory, BarChart3 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import BudgetDetailSheet from "./BudgetDetailSheet";

const PipelineTab = forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [comercial, setComercial] = useState("todos");
  const [selectedBudget, setSelectedBudget] = useState<Budget | null>(null);

  const filtered = useMemo(() => {
    return mockBudgets.filter((b) => {
      if (comercial !== "todos" && b.commercialResponsible !== comercial) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.customerName.toLowerCase().includes(q) && !b.publicId.toLowerCase().includes(q) && !b.proposals.some(p => p.items.some(i => i.productName.toLowerCase().includes(q)))) return false;
      }
      return true;
    });
  }, [search, comercial]);

  const open = filtered.filter(b => b.budgetState === 1);
  const won = filtered.filter(b => b.budgetState === 3);
  const lost = filtered.filter(b => b.budgetState === 2);

  const totalWonRevenue = won.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);
  const conversionRate = filtered.length > 0 ? ((won.length / filtered.length) * 100) : 0;
  const avgTicket = won.length > 0 ? totalWonRevenue / won.length : 0;
  const avgMargin = won.length > 0 ? won.reduce((s, b) => s + b.proposals[0].totalProfitPercentual, 0) / won.length : 0;

  const sumCol = (budgets: Budget[]) => budgets.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0);

  const columns = [
    { label: "Em Aberto", items: open, icon: FileText, color: "bg-blue-500", textColor: "text-blue-600" },
    { label: "Ganhos", items: won, icon: Trophy, color: "bg-green-500", textColor: "text-green-600" },
    { label: "Perdidos", items: lost, icon: XCircle, color: "bg-red-500", textColor: "text-red-600" },
  ];

  return (
    <div ref={ref} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por cliente, código, descrição..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={comercial} onValueChange={setComercial}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Ana Paula Ferreira">Ana Paula Ferreira</SelectItem>
            <SelectItem value="Roberto Lima">Roberto Lima</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Sincronizar</Button>
        <Badge variant="secondary">{filtered.length} orçamentos | Taxa conversão: {conversionRate.toFixed(1)}%</Badge>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${conversionRate > 35 ? 'bg-green-100' : conversionRate >= 25 ? 'bg-amber-100' : 'bg-red-100'}`}>
              <Target className={`h-5 w-5 ${conversionRate > 35 ? 'text-green-600' : conversionRate >= 25 ? 'text-amber-600' : 'text-red-600'}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Taxa de Conversão</p>
              <p className="text-xl font-bold">{conversionRate.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center"><DollarSign className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Ticket Médio (Ganhos)</p>
              <p className="text-xl font-bold">{formatCurrency(avgTicket)}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center"><TrendingUp className="h-5 w-5 text-blue-600" /></div>
            <div>
              <p className="text-xs text-muted-foreground">Margem Média (Ganhos)</p>
              <p className="text-xl font-bold">{avgMargin.toFixed(1)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {columns.map(col => (
          <div key={col.label} className="space-y-3">
            <div className={`flex items-center gap-2 p-3 rounded-lg ${col.color}/10`}>
              <col.icon className={`h-5 w-5 ${col.textColor}`} />
              <span className="font-semibold">{col.label}</span>
              <Badge variant="secondary">{col.items.length}</Badge>
              <span className="ml-auto text-sm font-medium">{formatCurrency(sumCol(col.items))}</span>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
              {col.items.map(budget => {
                const mainProposal = budget.proposals[0];
                const maxPrice = Math.max(...budget.proposals.map(p => p.totalPrice));
                const totalItems = budget.proposals.reduce((s, p) => s + p.items.length, 0);
                const margin = mainProposal.totalProfitPercentual;
                return (
                  <TooltipProvider key={budget.id}>
                    <Card
                      className={`cursor-pointer border-l-4 ${getMarginBorderColor(margin)} hover:shadow-md transition-shadow`}
                      onClick={() => setSelectedBudget(budget)}
                    >
                      <CardContent className="p-3 space-y-2">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span className="font-semibold text-foreground">📄 Orç #{budget.publicId}</span>
                          <span>{formatDate(budget.creationDate)}</span>
                        </div>
                        <p className="text-sm font-medium truncate">{mainProposal.items[0]?.productName || mainProposal.name}</p>
                        <div className="text-xs space-y-0.5">
                          <p>👤 {budget.customerName}</p>
                          <p>🧑‍💼 {budget.commercialResponsible}</p>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm">💰 {formatCurrency(maxPrice)}</span>
                          <span className={`text-xs font-medium ${getMarginBorderColor(margin).replace('border-l-', 'text-')}`}>📊 Margem: {margin.toFixed(1)}%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Propostas: {budget.proposals.length} | Itens: {totalItems}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="bg-muted/50 rounded p-1.5 text-center text-xs">
                            <Factory className="h-3 w-3 inline mr-1" />{formatCurrency(mainProposal.productionCost)}
                            <p className="text-muted-foreground">Custo Prod.</p>
                          </div>
                          <div className="bg-muted/50 rounded p-1.5 text-center text-xs">
                            <BarChart3 className="h-3 w-3 inline mr-1" />{formatCurrency(maxPrice - mainProposal.productionCost - mainProposal.sellingCost)}
                            <p className="text-muted-foreground">Lucro</p>
                          </div>
                        </div>
                        {budget.budgetState === 2 && budget.lostReason && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <p className="text-xs text-red-500 truncate cursor-help">❌ {budget.lostReason}</p>
                            </TooltipTrigger>
                            <TooltipContent><p>{budget.lostReason}</p></TooltipContent>
                          </Tooltip>
                        )}
                      </CardContent>
                    </Card>
                  </TooltipProvider>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <BudgetDetailSheet budget={selectedBudget} open={!!selectedBudget} onOpenChange={(o) => !o && setSelectedBudget(null)} />
    </div>
  );
});

PipelineTab.displayName = "PipelineTab";
export default PipelineTab;
