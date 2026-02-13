import { useState } from "react";
import { format, parseISO } from "date-fns";
import { Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import FaturamentoKPIs from "./FaturamentoKPIs";
import FaturamentoFilters from "./FaturamentoFilters";
import FaturamentoDetailSheet from "./FaturamentoDetailSheet";
import { mockIncomes } from "./mockData";
import { INCOME_STATUS_MAP, REVENUE_CENTER_MAP } from "./types";
import type { Income } from "./types";

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

const ContasReceberTab = () => {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [status, setStatus] = useState("all");
  const [revenueCenter, setRevenueCenter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Income | null>(null);

  const kpis = [
    { label: "A Receber", value: "R$ 67.500,00", badge: "pending", badgeColor: "bg-amber-100 text-amber-700", icon: Clock },
    { label: "Recebido (mês)", value: "R$ 142.300,00", badge: "received", badgeColor: "bg-emerald-100 text-emerald-700", icon: CheckCircle },
    { label: "Inadimplente", value: "R$ 21.250,00", badge: "overdue", badgeColor: "bg-red-100 text-red-700", icon: AlertTriangle },
    { label: "Total Geral", value: "R$ 231.050,00", badge: "total", badgeColor: "bg-muted text-muted-foreground", icon: DollarSign },
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
              { value: "received", label: "Recebido" },
              { value: "overdue", label: "Vencido" },
              { value: "cancelled", label: "Cancelado" },
            ],
          },
          {
            label: "Centro Receita",
            placeholder: "Todos",
            value: revenueCenter,
            onChange: setRevenueCenter,
            options: [
              { value: "all", label: "Todos" },
              ...Object.entries(REVENUE_CENTER_MAP).map(([k, v]) => ({ value: k, label: v })),
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
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Recebimento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>C. Receita</TableHead>
                  <TableHead>Forma Pgto</TableHead>
                  <TableHead>NF</TableHead>
                  <TableHead>Job</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mockIncomes.map((inc, i) => {
                  const s = INCOME_STATUS_MAP[inc.status];
                  return (
                    <TableRow
                      key={inc.id}
                      className={`cursor-pointer ${i % 2 === 0 ? "" : "bg-muted/20"}`}
                      onClick={() => setSelected(inc)}
                    >
                      <TableCell className="text-muted-foreground">{inc.id}</TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{inc.description}</TableCell>
                      <TableCell className="text-right whitespace-nowrap">{fmtCurrency(inc.amount)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(inc.expected_date)}</TableCell>
                      <TableCell className="whitespace-nowrap">{fmtDate(inc.received_date)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={badgeClass(s.variant)}>{s.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger className="text-left truncate max-w-[140px] block">{inc.customer.name}</TooltipTrigger>
                          <TooltipContent>{inc.customer.document}</TooltipContent>
                        </Tooltip>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{REVENUE_CENTER_MAP[inc.revenue_center]}</TableCell>
                      <TableCell>{inc.payment_method || "—"}</TableCell>
                      <TableCell className="text-xs">{inc.invoice_number}</TableCell>
                      <TableCell>{inc.job_id ? `#Job ${inc.job_id}` : "—"}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TooltipProvider>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm text-muted-foreground px-1">
        <span>Mostrando 1-6 de 85 registros</span>
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

      <FaturamentoDetailSheet open={!!selected} onOpenChange={() => setSelected(null)} type="income" item={selected} />
    </div>
  );
};

export default ContasReceberTab;
