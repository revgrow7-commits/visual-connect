import React from "react";
import { Budget, formatCurrency, formatDate, getMarginColor } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Props {
  budget: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const stateLabel = (s: number) => {
  if (s === 1) return { text: "Em Aberto", cls: "bg-blue-100 text-blue-700" };
  if (s === 3) return { text: "Ganho", cls: "bg-green-100 text-green-700" };
  return { text: "Perdido", cls: "bg-red-100 text-red-700" };
};

const BudgetDetailSheet: React.FC<Props> = ({ budget, open, onOpenChange }) => {
  if (!budget) return null;
  const state = stateLabel(budget.budgetState);
  const mainProposal = budget.proposals[0];
  const maxPrice = Math.max(...budget.proposals.map(p => p.totalPrice));

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Orç #{budget.publicId} — {budget.customerName}</SheetTitle>
          <SheetDescription className="flex items-center gap-2 flex-wrap">
            <Badge className={state.cls}>{state.text}</Badge>
            <span>Criado: {formatDate(budget.creationDate)}</span>
            <span>Comercial: {budget.commercialResponsible}</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Financial Summary */}
          <div>
            <h4 className="font-semibold mb-2">💰 Resumo Financeiro</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">Valor Total:</span><span className="font-medium">{formatCurrency(maxPrice)}</span>
              <span className="text-muted-foreground">Custo Produção:</span><span>{formatCurrency(mainProposal.productionCost)}</span>
              <span className="text-muted-foreground">Custo Venda:</span><span>{formatCurrency(mainProposal.sellingCost)}</span>
              <span className="text-muted-foreground">Lucro:</span><span className="font-medium text-green-600">{formatCurrency(maxPrice - mainProposal.productionCost - mainProposal.sellingCost)}</span>
              <span className="text-muted-foreground">Margem:</span><span className={`font-medium ${getMarginColor(mainProposal.totalProfitPercentual)}`}>{mainProposal.totalProfitPercentual.toFixed(1)}%</span>
            </div>
          </div>

          {budget.notes && (
            <div>
              <h4 className="font-semibold mb-1">📝 Observações</h4>
              <p className="text-sm text-muted-foreground">{budget.notes}</p>
            </div>
          )}

          {budget.lostReason && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <h4 className="font-semibold text-red-700 mb-1">❌ Motivo da Perda</h4>
              <p className="text-sm text-red-600">{budget.lostReason}</p>
            </div>
          )}

          <Separator />

          {/* Proposals */}
          <div>
            <h4 className="font-semibold mb-3">📋 Propostas ({budget.proposals.length})</h4>
            <div className="space-y-4">
              {budget.proposals.map(proposal => (
                <div key={proposal.id} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h5 className="font-semibold">{proposal.name}</h5>
                    <Badge variant="outline">{formatCurrency(proposal.totalPrice)} | Margem: {proposal.totalProfitPercentual.toFixed(1)}%</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground flex gap-4">
                    <span>Custo Prod: {formatCurrency(proposal.productionCost)}</span>
                    <span>Custo Venda: {formatCurrency(proposal.sellingCost)}</span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-muted-foreground">Itens:</p>
                    {proposal.items.map(item => (
                      <div key={item.id} className="bg-muted/30 rounded p-3 text-sm space-y-1">
                        <div className="flex justify-between">
                          <span className="font-medium">{item.productName} ({item.quantity}un)</span>
                          <span className={`font-medium ${getMarginColor(item.profitPercentual)}`}>Margem: {item.profitPercentual.toFixed(1)}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground">{item.description}</p>
                        <div className="text-xs flex gap-3">
                          <span>{formatCurrency(item.unitPrice)}/un → {formatCurrency(item.totalPrice)}</span>
                        </div>
                        {item.checklists.length > 0 && (
                          <div className="mt-1 space-y-0.5">
                            {item.checklists.map((cl, i) => (
                              <p key={i} className="text-xs">✅ {cl.question}: {cl.answer}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BudgetDetailSheet;
