import React, { forwardRef, useState, useMemo } from "react";
import { mockBudgets } from "./mockData";
import { Budget, formatCurrency, formatDate, getMarginColor } from "./types";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BudgetDetailSheet from "./BudgetDetailSheet";

const stateLabel = (s: number) => {
  if (s === 1) return { text: "Em Aberto", cls: "bg-blue-100 text-blue-700 border-blue-200" };
  if (s === 3) return { text: "Ganho", cls: "bg-green-100 text-green-700 border-green-200" };
  return { text: "Perdido", cls: "bg-red-100 text-red-700 border-red-200" };
};

const OrcamentosTab = forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("todos");
  const [comercial, setComercial] = useState("todos");
  const [minMargin, setMinMargin] = useState("");
  const [selected, setSelected] = useState<Budget | null>(null);

  const filtered = useMemo(() => {
    return mockBudgets.filter(b => {
      if (status !== "todos" && b.budgetState !== Number(status)) return false;
      if (comercial !== "todos" && b.commercialResponsible !== comercial) return false;
      if (minMargin && b.proposals[0].totalProfitPercentual < Number(minMargin)) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!b.customerName.toLowerCase().includes(q) && !b.publicId.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, status, comercial, minMargin]);

  return (
    <div ref={ref} className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por código, cliente..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="1">Em Aberto</SelectItem>
            <SelectItem value="3">Ganho</SelectItem>
            <SelectItem value="2">Perdido</SelectItem>
          </SelectContent>
        </Select>
        <Select value={comercial} onValueChange={setComercial}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="Ana Paula Ferreira">Ana Paula Ferreira</SelectItem>
            <SelectItem value="Roberto Lima">Roberto Lima</SelectItem>
          </SelectContent>
        </Select>
        <Input placeholder="Margem mín. %" value={minMargin} onChange={e => setMinMargin(e.target.value)} className="w-[110px]" type="number" />
      </div>

      <p className="text-sm text-muted-foreground">Mostrando {filtered.length} de {mockBudgets.length} registros</p>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Comercial</TableHead>
              <TableHead>Criação</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Propostas</TableHead>
              <TableHead className="text-right">Itens</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="text-right">Margem</TableHead>
              <TableHead className="text-right">Lucro</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(b => {
              const state = stateLabel(b.budgetState);
              const maxPrice = Math.max(...b.proposals.map(p => p.totalPrice));
              const totalItems = b.proposals.reduce((s, p) => s + p.items.length, 0);
              const margin = b.proposals[0].totalProfitPercentual;
              const profit = maxPrice - b.proposals[0].productionCost - b.proposals[0].sellingCost;
              return (
                <TableRow key={b.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(b)}>
                  <TableCell className="font-bold">Orç #{b.publicId}</TableCell>
                  <TableCell>{b.customerName}</TableCell>
                  <TableCell>{b.commercialResponsible}</TableCell>
                  <TableCell>{formatDate(b.creationDate)}</TableCell>
                  <TableCell><Badge className={state.cls}>{state.text}</Badge></TableCell>
                  <TableCell className="text-right">{b.proposals.length}</TableCell>
                  <TableCell className="text-right">{totalItems}</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(maxPrice)}</TableCell>
                  <TableCell className={`text-right font-medium ${getMarginColor(margin)}`}>{margin.toFixed(1)}%</TableCell>
                  <TableCell className="text-right font-medium">{formatCurrency(profit)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      <BudgetDetailSheet budget={selected} open={!!selected} onOpenChange={o => !o && setSelected(null)} />
    </div>
  );
});

OrcamentosTab.displayName = "OrcamentosTab";
export default OrcamentosTab;
