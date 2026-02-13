import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import FaturamentoKPIs from "./FaturamentoKPIs";
import FaturamentoFilters from "./FaturamentoFilters";
import FaturamentoDetailSheet from "./FaturamentoDetailSheet";
import { mockExpenses } from "./mockData";
import { EXPENSE_STATUS_MAP, CATEGORY_MAP, COST_CENTER_MAP } from "./types";
import type { Expense } from "./types";

const fmtCurrency = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const fmtDate = (d: string | null) =>
  d ? format(parseISO(d), "dd/MM/yyyy") : "—";

const badgeClass = (variant: string) => {
  switch (variant) {
    case "success": return "bg-emerald-100 text-emerald-700 border-emerald-200";
    case "warning": return "bg-amber-100 text-amber-700 border-amber-200";
    case "destructive": return "bg-red-100 text-red-700 border-red-200";
    default: return "bg-muted text-muted-foreground";
  }
};

const ContasPagarTab = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");
  const [category, setCategory] = useState("all");
  const [costCenter, setCostCenter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Expense | null>(null);

  const kpis = [
    { label: "Total Pendente", value: "R$ 45.230,00", badge: "pending", badgeColor: "bg-amber-100 text-amber-700", icon: Clock },
    { label: "Total Pago (mês)", value: "R$ 128.750,00", badge: "paid", badgeColor: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    { label: "Vencidas", value: "R$ 12.800,00", badge: "overdue", badgeColor: "bg-red-100 text-red-700", icon: AlertTriangle },
    { label: "Total Geral (mês)", value: "R$ 186.780,00", badge: "total", badgeColor: "bg-muted text-muted-foreground", icon: DollarSign },
  ];

  return (
    <div className="space-y-4">
      <FaturamentoKPIs items={kpis} />

      <FaturamentoFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        search={search}
        onSearchChange={setSearch}
        onFilter={() => {}}
        selects={[
          {
            label: "Status",
            placeholder: "Todos",
            value: status,
            onChange: setStatus,
            options: [
              { value: "all", label: "Todos" },
              { value: "pending", label: "Pendente" },
              { value: "paid", label: "Pago" },
              { value: "overdue", label: "Vencido" },
              { value: "cancelled", label: "Cancelado" },
            ],
          },
          {
            label: "Categoria",
            placeholder: "Todas",
            value: category,
            onChange: setCategory,
            options: [
              { value: "all", label: "Todas" },
              ...Object.entries(CATEGORY_MAP).map(([k, v]) => ({ value: k, label: v })),
            ],
          },
          {
            label: "Centro de Custo",
            placeholder: "Todos",
            value: costCenter,
            onChange: setCostCenter,
            options: [
              { value: "all", label: "Todos" },
              ...Object.entries(COST_CENTER_MAP).map(([k, v]) => ({ value: k, label: v })),
            ],
          },
        ]}
      />

      <div className="border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Pagamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>C. Custo</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead>NF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockExpenses.map((e, i) => {
                  const s = EXPENSE_STATUS_MAP[e.status];
                  return (
                    <TableRow
                      key={e.id}
                      className={`cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      onClick={() => setSelected(e)}
                    >
                      <TableCell className="text-muted-foreground">{e.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{e.description}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{fmtCurrency(e.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(e.due_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(e.payment_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badgeClass(s.variant)}>{s.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-left truncate max-w-[140px] block">{e.supplier.name}</TooltipTrigger>
                          <TooltipContent>{e.supplier.document}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{CATEGORY_MAP[e.category]}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{COST_CENTER_MAP[e.cost_center]}</TableCell>
                      <TableCell>{e.payment_method || "—"}</TableCell>
                      <TableCell className="text-xs">{e.invoice_number}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Mostrando 1-8 de 120 registros</span>
        <div className="flex gap-1">
          {[1, 2, 3, "...", 15].map((p, i) => (
            <button
              key={i}
              className={`px-2.5 py-1 rounded text-xs ${p === 1 ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      <FaturamentoDetailSheet open={!!selected} onOpenChange={() => setSelected(null)} type="expense" item={selected} />
    </div>
  );
};

export default ContasPagarTab;
