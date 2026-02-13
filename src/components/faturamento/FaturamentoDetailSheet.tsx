import { format, parseISO } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type { Expense, Income } from "./types";
import { EXPENSE_STATUS_MAP, INCOME_STATUS_MAP, CATEGORY_MAP, COST_CENTER_MAP, REVENUE_CENTER_MAP } from "./types";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) =>
  d ? format(parseISO(d), "dd/MM/yyyy") : "—";

const badgeVariantClass = (variant: string) => {
  switch (variant) {
    case "success": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "warning": return "bg-amber-100 text-amber-700 border-amber-200";
    case "destructive": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-muted text-muted-foreground";
  }
};

interface DetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "expense" | "income";
  item: Expense | Income | null;
}

const Row = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex justify-between py-2">
    <span className="text-sm text-muted-foreground">{label}</span>
    <span className="text-sm font-medium text-foreground text-right">{value}</span>
  </div>
);

const FaturamentoDetailSheet = ({ open, onOpenChange, type, item }: DetailSheetProps) => {
  if (!item) return null;

  const isExpense = type === "expense";
  const expense = isExpense ? (item as Expense) : null;
  const income = !isExpense ? (item as Income) : null;
  const statusMap = isExpense ? EXPENSE_STATUS_MAP : INCOME_STATUS_MAP;
  const statusInfo = statusMap[item.status as keyof typeof statusMap];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-base">#{item.id} — Detalhes</SheetTitle>
          <SheetDescription>{item.description}</SheetDescription>
        </SheetHeader>
        <div className="mt-4 space-y-1">
          <Row label="Valor" value={fmtCurrency(item.amount)} />
          <Separator />
          <Row
            label="Status"
            value={
              <Badge variant="outline" className={badgeVariantClass(statusInfo.variant)}>
                {statusInfo.label}
              </Badge>
            }
          />
          <Separator />
          {isExpense && expense && (
            <>
              <Row label="Vencimento" value={fmtDate(expense.due_date)} />
              <Separator />
              <Row label="Pagamento" value={fmtDate(expense.payment_date)} />
              <Separator />
              <Row label="Fornecedor" value={expense.supplier.name} />
              <Separator />
              <Row label="CNPJ" value={expense.supplier.document} />
              <Separator />
              <Row label="Categoria" value={CATEGORY_MAP[expense.category]} />
              <Separator />
              <Row label="Centro de Custo" value={COST_CENTER_MAP[expense.cost_center]} />
            </>
          )}
          {!isExpense && income && (
            <>
              <Row label="Data Prevista" value={fmtDate(income.expected_date)} />
              <Separator />
              <Row label="Data Recebimento" value={fmtDate(income.received_date)} />
              <Separator />
              <Row label="Cliente" value={income.customer.name} />
              <Separator />
              <Row label="CNPJ" value={income.customer.document} />
              <Separator />
              <Row label="Centro Receita" value={REVENUE_CENTER_MAP[income.revenue_center]} />
              <Separator />
              <Row label="Job" value={income.job_id ? `#Job ${income.job_id}` : "—"} />
            </>
          )}
          <Separator />
          <Row label="Forma Pgto" value={item.payment_method || "—"} />
          <Separator />
          <Row label="NF" value={item.invoice_number} />
          <Separator />
          {item.notes && (
            <>
              <div className="py-2">
                <p className="text-sm text-muted-foreground mb-1">Observações</p>
                <p className="text-sm bg-muted p-3 rounded-md">{item.notes}</p>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default FaturamentoDetailSheet;
