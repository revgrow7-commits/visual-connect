import { Job, formatCurrency, formatDate, getAllTasks, chargeStatusMap, invoiceStatusMap, productionStatusMap } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface JobDetailSheetProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailSheet = ({ job, open, onOpenChange }: JobDetailSheetProps) => {
  if (!job) return null;

  const tasks = getAllTasks(job);
  const finishedTasks = tasks.filter(t => t.productionStatus === 'Finalized').length;
  const pct = job.production.progressPercentage ?? 0;
  const feedstocks = job.production.items.flatMap(i => i.feedstocks);

  const costPhases = [
    { label: "Orçado", data: job.costs.budgeted },
    { label: "Aprovado", data: job.costs.approved },
    { label: "Planejado", data: job.costs.planned },
    { label: "Realizado", data: job.costs.realized },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-left">Job #{job.code} — {job.title}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          {/* Info Gerais */}
          <section>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">📊 INFORMAÇÕES GERAIS</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-muted-foreground">Cliente:</span> {job.customerName}</div>
              <div><span className="text-muted-foreground">Responsável:</span> {job.responsibleName}</div>
              <div><span className="text-muted-foreground">Resp. Comercial:</span> {job.commercialResponsibleName}</div>
              <div><span className="text-muted-foreground">Criado em:</span> {formatDate(job.creationTime)}</div>
              <div><span className="text-muted-foreground">Entrega necessária:</span> {formatDate(job.deliveryNeeded)}</div>
              <div><span className="text-muted-foreground">Entrega prevista:</span> {formatDate(job.deliveryExpected)}</div>
              <div><span className="text-muted-foreground">Forma de pagamento:</span> {job.paymentOption}</div>
              <div className="col-span-2">
                <span className="text-muted-foreground">Progresso:</span>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className="text-xs font-medium">{pct.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-2">
              <Badge className={chargeStatusMap[job.jobChargeStatus]?.color}>{chargeStatusMap[job.jobChargeStatus]?.label}</Badge>
              <Badge className={invoiceStatusMap[job.jobInvoiceStatus]?.color}>{invoiceStatusMap[job.jobInvoiceStatus]?.label}</Badge>
            </div>
          </section>

          <Separator />

          {/* Custos */}
          <section>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">💰 CUSTOS (4 fases)</h3>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs"></TableHead>
                    {costPhases.map(p => <TableHead key={p.label} className="text-xs text-center">{p.label}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    { label: "Preço Total", key: "TotalPrice" as const },
                    { label: "Custo Prod.", key: "ProductionCost" as const },
                    { label: "Custo Venda", key: "SellingCost" as const },
                    { label: "Lucro", key: "Profit" as const },
                    { label: "Margem", key: "ProfitPercentual" as const },
                  ].map(row => (
                    <TableRow key={row.key}>
                      <TableCell className="text-xs font-medium">{row.label}</TableCell>
                      {costPhases.map(p => (
                        <TableCell key={p.label} className="text-xs text-center">
                          {row.key === "ProfitPercentual" ? `${p.data[row.key].toFixed(1)}%` : formatCurrency(p.data[row.key])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </section>

          <Separator />

          {/* Tasks */}
          <section>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">📋 TASKS ({finishedTasks}/{tasks.length} concluídas)</h3>
            <div className="space-y-1">
              {tasks.map(task => {
                const st = productionStatusMap[task.productionStatus];
                return (
                  <div key={task.publicId} className="flex items-center justify-between text-sm py-1">
                    <div className="flex items-center gap-2">
                      <span>{st?.icon}</span>
                      <span className={task.productionStatus === 'Finalized' ? 'line-through text-muted-foreground' : ''}>{task.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{task.duration}min</span>
                  </div>
                );
              })}
            </div>
          </section>

          <Separator />

          {/* Feedstocks */}
          {feedstocks.length > 0 && (
            <section>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">🧪 FEEDSTOCKS (Insumos)</h3>
              <div className="space-y-1">
                {feedstocks.map(fs => (
                  <div key={fs.feedstockId} className="text-sm">
                    • {Object.entries(fs.options).map(([k, v]) => `${k}: ${v}`).join(' — ')}
                  </div>
                ))}
              </div>
            </section>
          )}

          <Separator />

          {/* Produtos */}
          {job.products.length > 0 && (
            <section>
              <h3 className="font-semibold text-sm text-muted-foreground mb-2">📦 PRODUTOS</h3>
              <div className="space-y-2">
                {job.products.map((p, i) => (
                  <div key={i} className="text-sm border rounded-md p-2">
                    <div className="font-medium">{p.Name} ({p.Quantity}un)</div>
                    <div className="text-muted-foreground text-xs">{p.Description}</div>
                    <div className="text-xs mt-1">Valor: {formatCurrency(p.TotalValue)} | Custo: {formatCurrency(p.ProductionCost)}</div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailSheet;
