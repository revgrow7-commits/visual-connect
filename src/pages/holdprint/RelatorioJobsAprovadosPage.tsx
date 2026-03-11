import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ArrowLeft, CalendarIcon, ChevronDown, ChevronRight, Download, FileText, Filter, RefreshCw, Ruler } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState, Fragment, useRef, useCallback } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import BudgetAgentChat from "@/components/holdprint/BudgetAgentChat";

interface ProductDetail {
  name: string;
  quantity: number;
  largura: number;
  altura: number;
  copias: number;
  m2: number;
  unitPrice: number;
  totalValue: number;
}

interface ApprovedJob {
  code: number;
  id: string;
  customerName: string;
  title: string;
  description: string;
  productDetails: ProductDetail[];
  totalValue: number;
  openValue: number;
  paidValue: number;
  paymentStatus: "pago" | "aberto" | "parcial";
  approvedBy: string;
  unidade: string;
  creationTime: string;
  totalM2: number;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function extractProductDetails(products: Record<string, unknown>[]): ProductDetail[] {
  const details: ProductDetail[] = [];

  for (const p of products) {
    const desc = String(p.description || "");
    const quantity = Number(p.quantity || p.saleQuantity || 1);
    const name = String(p.name || "Item");
    const unitPrice = Number(p.unitPrice || 0);
    const totalValue = Number(p.totalValue || 0);

    const larguraMatch = desc.match(/Largura:\s*<span[^>]*>(\d+[.,]?\d*)\s*m<\/span>/i);
    const alturaMatch = desc.match(/Altura:\s*<span[^>]*>(\d+[.,]?\d*)\s*m<\/span>/i);
    const copiasMatch = desc.match(/C[oó]pias:\s*<span[^>]*>(\d+)<\/span>/i);

    const largura = larguraMatch ? parseFloat(larguraMatch[1].replace(",", ".")) : 0;
    const altura = alturaMatch ? parseFloat(alturaMatch[1].replace(",", ".")) : 0;
    const copias = copiasMatch ? parseInt(copiasMatch[1]) : 1;
    const m2 = largura * altura * copias * quantity;

    details.push({ name, quantity, largura, altura, copias, m2, unitPrice, totalValue });
  }

  return details;
}

function parseJobFromCache(raw: Record<string, unknown>): ApprovedJob | null {
  const j = raw;
  const status = String(j.status || "").toLowerCase();
  if (status === "cancelled" || status === "cancelado") return null;

  const costs = (j.costs || {}) as Record<string, number | null>;
  const totalPrice = costs.budgetedTotalPrice || costs.realizedTotalPrice || (j.totalPrice as number) || 0;
  if (totalPrice <= 0) return null;

  const chargeStatus = String(j.jobChargeStatus || "").toLowerCase();
  const invoiceStatus = String(j.jobInvoiceStatus || "").toLowerCase();

  let paidValue = costs.realizedTotalPrice || 0;
  let openValue = totalPrice - paidValue;
  if (openValue < 0) openValue = 0;

  let paymentStatus: "pago" | "aberto" | "parcial" = "aberto";
  if (chargeStatus.includes("paid") || chargeStatus.includes("pago") || invoiceStatus.includes("paid") || invoiceStatus.includes("pago")) {
    paymentStatus = "pago";
    paidValue = totalPrice;
    openValue = 0;
  } else if (paidValue > 0 && paidValue < totalPrice) {
    paymentStatus = "parcial";
  }

  const products = Array.isArray(j.products) ? (j.products as Record<string, unknown>[]) : [];
  const productDetails = extractProductDetails(products);
  const totalM2 = productDetails.reduce((sum, d) => sum + d.m2, 0);

  const approvedBy = String(
    j.approvedBy || j.commercialResponsible || j.sellerName ||
    j.responsibleName || j.createdBy || "Sistema"
  );

  return {
    code: Number(j.code || 0),
    id: String(j.id || ""),
    customerName: String(j.customerName || (j.customer as Record<string, unknown>)?.name || "—"),
    title: String(j.title || ""),
    description: String(j.description || j.title || "—").slice(0, 120),
    productDetails,
    totalValue: totalPrice,
    openValue,
    paidValue,
    paymentStatus,
    approvedBy,
    unidade: String(j._unit_key || j._unidade || "poa").toUpperCase(),
    creationTime: String(j.creationTime || j.createdAt || ""),
    totalM2,
  };
}

function useApprovedJobs() {
  return useQuery<ApprovedJob[]>({
    queryKey: ["holdprint-approved-jobs-cache"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdprint_cache")
        .select("raw_data")
        .eq("endpoint", "jobs")
        .order("last_synced", { ascending: false })
        .limit(1000);

      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error("Nenhum dado em cache. Execute a sincronização primeiro.");
      }

      const jobs: ApprovedJob[] = [];
      for (const row of data) {
        const raw = row.raw_data as Record<string, unknown>;
        const parsed = parseJobFromCache(raw);
        if (parsed) jobs.push(parsed);
      }

      return jobs.sort((a, b) => b.code - a.code);
    },
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

function JobExpandedRow({ job }: { job: ApprovedJob }) {
  if (!job.productDetails || job.productDetails.length === 0) {
    return (
      <TableRow className="bg-muted/30">
        <TableCell colSpan={12} className="py-3 pl-12 text-sm text-muted-foreground italic">
          Nenhum item detalhado disponível para este job.
        </TableCell>
      </TableRow>
    );
  }

  return (
    <>
      <TableRow className="bg-muted/30 border-b-0">
        <TableCell colSpan={12} className="py-2 pl-12">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Ruler className="h-3.5 w-3.5" />
            Itens e Medidas do Job {job.code}
          </div>
        </TableCell>
      </TableRow>
      <TableRow className="bg-muted/30 border-b-0">
        <TableCell colSpan={12} className="py-0 px-4 pl-12">
          <div className="overflow-x-auto pb-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-muted-foreground border-b border-border/50">
                  <th className="text-left py-1.5 pr-4 font-medium">Item</th>
                  <th className="text-center py-1.5 px-3 font-medium">Qtd</th>
                  <th className="text-center py-1.5 px-3 font-medium">Largura</th>
                  <th className="text-center py-1.5 px-3 font-medium">Altura</th>
                  <th className="text-center py-1.5 px-3 font-medium">Cópias</th>
                  <th className="text-right py-1.5 px-3 font-medium">m²</th>
                  <th className="text-right py-1.5 px-3 font-medium">Unitário</th>
                  <th className="text-right py-1.5 pl-3 font-medium">Total</th>
                </tr>
              </thead>
              <tbody>
                {job.productDetails.map((item, idx) => (
                  <tr key={idx} className="border-b border-border/20 last:border-0">
                    <td className="py-1.5 pr-4 font-medium">{item.name}</td>
                    <td className="text-center py-1.5 px-3">{item.quantity}</td>
                    <td className="text-center py-1.5 px-3 font-mono">
                      {item.largura > 0 ? `${item.largura.toFixed(2)}m` : "—"}
                    </td>
                    <td className="text-center py-1.5 px-3 font-mono">
                      {item.altura > 0 ? `${item.altura.toFixed(2)}m` : "—"}
                    </td>
                    <td className="text-center py-1.5 px-3">{item.copias}</td>
                    <td className="text-right py-1.5 px-3 font-mono">
                      {item.m2 > 0 ? `${item.m2.toFixed(2)}` : "—"}
                    </td>
                    <td className="text-right py-1.5 px-3 text-muted-foreground">{fmtBRL(item.unitPrice)}</td>
                    <td className="text-right py-1.5 pl-3 font-medium">{fmtBRL(item.totalValue)}</td>
                  </tr>
                ))}
                <tr className="font-semibold text-xs">
                  <td className="pt-2 pr-4" colSpan={5}>Totais</td>
                  <td className="text-right pt-2 px-3 font-mono">
                    {job.totalM2 > 0 ? `${job.totalM2.toFixed(2)} m²` : "—"}
                  </td>
                  <td className="pt-2 px-3" />
                  <td className="text-right pt-2 pl-3">{fmtBRL(job.productDetails.reduce((s, i) => s + i.totalValue, 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

export default function RelatorioJobsAprovadosPage() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading, isFetching, error } = useApprovedJobs();
  const [filterUnit, setFilterUnit] = useState<string>("todas");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<Date | undefined>(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [dateTo, setDateTo] = useState<Date | undefined>(new Date());
  const [syncing, setSyncing] = useState(false);
  const [expandedJobs, setExpandedJobs] = useState<Set<string>>(new Set());
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollPercent, setScrollPercent] = useState(0);

  const handleScrollSlider = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setScrollPercent(val);
    const el = scrollContainerRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      el.scrollLeft = (val / 100) * maxScroll;
    }
  }, []);

  const handleTableScroll = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      const maxScroll = el.scrollWidth - el.clientWidth;
      setScrollPercent(maxScroll > 0 ? (el.scrollLeft / maxScroll) * 100 : 0);
    }
  }, []);

  const toggleExpand = (jobKey: string) => {
    setExpandedJobs((prev) => {
      const next = new Set(prev);
      if (next.has(jobKey)) next.delete(jobKey);
      else next.add(jobKey);
      return next;
    });
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("holdprint-daily-sync", {
        body: { trigger_type: "manual", endpoints: ["jobs"] },
      });
      if (error) throw error;
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["holdprint-approved-jobs-cache"] });
        setSyncing(false);
      }, 5000);
    } catch {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    if (!jobs) return [];
    return jobs.filter((j) => {
      if (filterUnit !== "todas" && j.unidade !== filterUnit) return false;
      if (filterStatus !== "todos" && j.paymentStatus !== filterStatus) return false;

      if (dateFrom || dateTo) {
        const jobDate = j.creationTime ? new Date(j.creationTime) : null;
        if (!jobDate || isNaN(jobDate.getTime())) return false;
        if (dateFrom && jobDate < dateFrom) return false;
        if (dateTo) {
          const endOfDay = new Date(dateTo);
          endOfDay.setHours(23, 59, 59, 999);
          if (jobDate > endOfDay) return false;
        }
      }

      if (search) {
        const q = search.toLowerCase();
        return (
          String(j.code).includes(q) ||
          j.customerName.toLowerCase().includes(q) ||
          j.description.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [jobs, filterUnit, filterStatus, search, dateFrom, dateTo]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, j) => ({
        total: acc.total + j.totalValue,
        pago: acc.pago + j.paidValue,
        aberto: acc.aberto + j.openValue,
        m2: acc.m2 + j.totalM2,
      }),
      { total: 0, pago: 0, aberto: 0, m2: 0 }
    );
  }, [filtered]);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Job", "Cliente", "Item", "Qtd", "Largura(m)", "Altura(m)", "Cópias", "m²", "Unitário", "Total Item", "Valor Job", "Valor Pago", "Em Aberto", "Status", "Aprovado Por", "Unidade", "Data"];
    const rows: string[][] = [];
    for (const j of filtered) {
      if (j.productDetails.length === 0) {
        rows.push([
          String(j.code), `"${j.customerName}"`, '""', "", "", "", "", "",
          "", "", j.totalValue.toFixed(2), j.paidValue.toFixed(2), j.openValue.toFixed(2),
          j.paymentStatus, `"${j.approvedBy}"`, j.unidade,
          j.creationTime ? new Date(j.creationTime).toLocaleDateString("pt-BR") : "",
        ]);
      } else {
        for (const item of j.productDetails) {
          rows.push([
            String(j.code), `"${j.customerName}"`, `"${item.name}"`,
            String(item.quantity), item.largura.toFixed(2), item.altura.toFixed(2),
            String(item.copias), item.m2.toFixed(2), item.unitPrice.toFixed(2),
            item.totalValue.toFixed(2), j.totalValue.toFixed(2), j.paidValue.toFixed(2),
            j.openValue.toFixed(2), j.paymentStatus, `"${j.approvedBy}"`, j.unidade,
            j.creationTime ? new Date(j.creationTime).toLocaleDateString("pt-BR") : "",
          ]);
        }
      }
    }
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-jobs-aprovados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const clearDates = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link to="/holdprint/relatorios">
          <Button variant="ghost" size="icon"><ArrowLeft className="h-5 w-5" /></Button>
        </Link>
        <FileText className="h-6 w-6 text-primary" />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">Relatório de Jobs Aprovados</h1>
          <p className="text-muted-foreground text-sm">Jobs aprovados POA e SP • Clique em um job para ver itens e medidas</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleSync}
            disabled={syncing || isFetching}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing || isFetching ? "animate-spin" : ""}`} />
            {syncing ? "Sincronizando..." : "Sincronizar"}
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportCSV} disabled={!filtered.length}>
            <Download className="h-4 w-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* KPIs */}
      {(dateFrom || dateTo) && (
        <p className="text-xs text-muted-foreground">
          Totais do período: {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "..."} até {dateTo ? format(dateTo, "dd/MM/yyyy") : "..."}
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total Jobs</p>
            <span className="text-2xl font-bold">{filtered.length}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Valor Total</p>
            <span className="text-2xl font-bold text-primary">{fmtBRL(totals.total)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Valor Pago</p>
            <span className="text-2xl font-bold text-green-600">{fmtBRL(totals.pago)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Valor em Aberto</p>
            <span className="text-2xl font-bold text-amber-600">{fmtBRL(totals.aberto)}</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-sm text-muted-foreground">Total m²</p>
            <span className="text-2xl font-bold text-blue-600">{totals.m2.toFixed(2)} m²</span>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por job, cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[150px] justify-start text-left font-normal",
                !dateFrom && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFrom ? format(dateFrom, "dd/MM/yyyy") : "Data início"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateFrom}
              onSelect={setDateFrom}
              initialFocus
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(
                "w-[150px] justify-start text-left font-normal",
                !dateTo && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateTo ? format(dateTo, "dd/MM/yyyy") : "Data fim"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateTo}
              onSelect={setDateTo}
              initialFocus
              locale={ptBR}
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>

        {(dateFrom || dateTo) && (
          <Button variant="ghost" size="sm" onClick={clearDates} className="text-xs">
            Limpar datas
          </Button>
        )}

        <Select value={filterUnit} onValueChange={setFilterUnit}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas unidades</SelectItem>
            <SelectItem value="POA">POA</SelectItem>
            <SelectItem value="SP">SP</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos status</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
            <SelectItem value="aberto">Aberto</SelectItem>
            <SelectItem value="parcial">Parcial</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-destructive">Erro: {(error as Error).message}</CardContent></Card>
      ) : (
        <Card>
           <div className="px-4 py-2 border-b border-border flex items-center gap-3">
              <span className="text-xs text-muted-foreground shrink-0">◀</span>
              <input
                type="range"
                min={0}
                max={100}
                value={scrollPercent}
                onChange={handleScrollSlider}
                className="w-full h-1.5 accent-primary cursor-pointer"
              />
              <span className="text-xs text-muted-foreground shrink-0">▶</span>
            </div>
            <div className="overflow-x-auto" ref={scrollContainerRef} onScroll={handleTableScroll}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8" />
                    <TableHead className="w-20">Job</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Itens</TableHead>
                    <TableHead className="text-right">m²</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Aprovado por</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                    <TableHead className="text-center">Data</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={12} className="text-center py-8 text-muted-foreground">
                        Nenhum job encontrado com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((j) => {
                      const jobKey = `${j.unidade}-${j.id}`;
                      const isExpanded = expandedJobs.has(jobKey);
                      return (
                        <Fragment key={jobKey}>
                          <TableRow
                            className="cursor-pointer hover:bg-muted/50 transition-colors"
                            onClick={() => toggleExpand(jobKey)}
                          >
                            <TableCell className="w-8 pr-0">
                              {isExpanded
                                ? <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                : <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              }
                            </TableCell>
                            <TableCell className="font-mono font-semibold">{j.code}</TableCell>
                            <TableCell className="font-medium">{j.customerName}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1.5">
                                <Badge variant="outline" className="text-[10px] px-1.5">
                                  {(j.productDetails?.length || 0)} {(j.productDetails?.length || 0) === 1 ? "item" : "itens"}
                                </Badge>
                                {(j.productDetails?.length || 0) > 0 && (
                                  <span className="text-xs text-muted-foreground truncate max-w-[150px]">
                                    {j.productDetails[0].name}
                                    {j.productDetails.length > 1 ? ` +${j.productDetails.length - 1}` : ""}
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {j.totalM2 > 0 ? `${j.totalM2.toFixed(2)}` : "—"}
                            </TableCell>
                            <TableCell className="text-right font-medium">{fmtBRL(j.totalValue)}</TableCell>
                            <TableCell className="text-right text-green-600">{fmtBRL(j.paidValue)}</TableCell>
                            <TableCell className="text-right text-amber-600">{fmtBRL(j.openValue)}</TableCell>
                            <TableCell className="text-center">
                              <Badge
                                variant={j.paymentStatus === "pago" ? "default" : j.paymentStatus === "parcial" ? "secondary" : "outline"}
                                className={
                                  j.paymentStatus === "pago"
                                    ? "bg-green-100 text-green-800 hover:bg-green-200"
                                    : j.paymentStatus === "parcial"
                                      ? "bg-amber-100 text-amber-800 hover:bg-amber-200"
                                      : ""
                                }
                              >
                                {j.paymentStatus === "pago" ? "Pago" : j.paymentStatus === "parcial" ? "Parcial" : "Aberto"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{j.approvedBy}</TableCell>
                            <TableCell className="text-center">
                              <Badge variant="outline" className="text-xs">{j.unidade}</Badge>
                            </TableCell>
                            <TableCell className="text-center text-sm text-muted-foreground whitespace-nowrap">
                              {j.creationTime ? new Date(j.creationTime).toLocaleDateString("pt-BR") : "—"}
                            </TableCell>
                          </TableRow>
                          {isExpanded && <JobExpandedRow job={j} />}
                        </Fragment>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
      <BudgetAgentChat />
    </div>
  );
}
