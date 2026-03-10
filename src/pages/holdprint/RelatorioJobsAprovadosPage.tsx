import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Download, FileText, Filter, RefreshCw } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useMemo, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ApprovedJob {
  code: number;
  id: string;
  customerName: string;
  title: string;
  description: string;
  items: string[];
  totalValue: number;
  openValue: number;
  paidValue: number;
  paymentStatus: "pago" | "aberto" | "parcial";
  approvedBy: string;
  unidade: string;
  creationTime: string;
}

function fmtBRL(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
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

  const products = (j.products || []) as Record<string, unknown>[];
  const production = (j.production || {}) as Record<string, unknown>;
  const prodItems = (production.items || []) as Record<string, unknown>[];

  const itemNames = products.length > 0
    ? products.map(p => String(p.name || "Item"))
    : prodItems.length > 0
      ? prodItems.map(p => String(p.name || "Item"))
      : [];

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
    items: itemNames,
    totalValue: totalPrice,
    openValue,
    paidValue,
    paymentStatus,
    approvedBy,
    unidade: String(j._unit_key || j._unidade || "poa").toUpperCase(),
    creationTime: String(j.creationTime || j.createdAt || ""),
  };
}

function useApprovedJobs() {
  return useQuery<ApprovedJob[]>({
    queryKey: ["holdprint-approved-jobs-cache"],
    queryFn: async () => {
      // Read from local cache (holdprint_cache) - much faster than API calls
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

export default function RelatorioJobsAprovadosPage() {
  const queryClient = useQueryClient();
  const { data: jobs, isLoading, isFetching, error } = useApprovedJobs();
  const [filterUnit, setFilterUnit] = useState<string>("todas");
  const [filterStatus, setFilterStatus] = useState<string>("todos");
  const [search, setSearch] = useState("");
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { error } = await supabase.functions.invoke("holdprint-daily-sync", {
        body: { trigger_type: "manual", endpoints: ["jobs"] },
      });
      if (error) throw error;
      // Wait a bit for background processing then refetch cache
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
  }, [jobs, filterUnit, filterStatus, search]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, j) => ({
        total: acc.total + j.totalValue,
        pago: acc.pago + j.paidValue,
        aberto: acc.aberto + j.openValue,
      }),
      { total: 0, pago: 0, aberto: 0 }
    );
  }, [filtered]);

  const handleExportCSV = () => {
    if (!filtered.length) return;
    const headers = ["Job", "Cliente", "Descrição", "Itens", "Valor Total", "Valor Pago", "Valor Aberto", "Status", "Aprovado Por", "Unidade"];
    const rows = filtered.map((j) => [
      j.code,
      `"${j.customerName}"`,
      `"${j.description}"`,
      `"${j.items.join("; ")}"`,
      j.totalValue.toFixed(2),
      j.paidValue.toFixed(2),
      j.openValue.toFixed(2),
      j.paymentStatus,
      `"${j.approvedBy}"`,
      j.unidade,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-jobs-aprovados-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
          <p className="text-muted-foreground text-sm">Jobs aprovados das unidades POA e SP (dados do cache local)</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por job, cliente..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
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

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : error ? (
        <Card><CardContent className="py-8 text-center text-destructive">Erro: {(error as Error).message}</CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Job</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="max-w-[200px]">Descrição / Itens</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Valor Pago</TableHead>
                    <TableHead className="text-right">Em Aberto</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead>Aprovado por</TableHead>
                    <TableHead className="text-center">Unidade</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        Nenhum job encontrado com os filtros aplicados.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((j) => (
                      <TableRow key={`${j.unidade}-${j.id}`}>
                        <TableCell className="font-mono font-semibold">{j.code}</TableCell>
                        <TableCell className="font-medium">{j.customerName}</TableCell>
                        <TableCell className="max-w-[200px]">
                          <p className="text-sm truncate">{j.description}</p>
                          {j.items.length > 0 && (
                            <p className="text-xs text-muted-foreground truncate">
                              {j.items.slice(0, 3).join(", ")}{j.items.length > 3 ? ` +${j.items.length - 3}` : ""}
                            </p>
                          )}
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
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
