import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { processesService } from "@/services/holdprint";
import type { HoldprintProcess, ProcessFamily } from "@/services/holdprint/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Database } from "lucide-react";

const PAGE_SIZE = 20;

const fmt = (v: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(v);

export default function HoldprintProcessosPage() {
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: families } = useQuery({
    queryKey: ["holdprint-process-families"],
    queryFn: () => processesService.families(),
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["holdprint-processes", page, search, familyFilter],
    queryFn: () =>
      processesService.list({
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
  });

  // Client-side filtering since api-key API doesn't support server-side filter
  const filtered = (data?.data || []).filter((p) => {
    const matchSearch = !search || (p.title || p.customerName || "").toLowerCase().includes(search.toLowerCase());
    const matchFamily = familyFilter === "all" || (p.currentProductionStepName || "") === familyFilter;
    return matchSearch && matchFamily;
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Jobs / Produção</h1>
          <p className="text-muted-foreground text-sm">Jobs produtivos do Holdprint ERP</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título ou cliente..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={familyFilter} onValueChange={(v) => { setFamilyFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Etapa" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Etapas</SelectItem>
            {families?.map((f) => (
              <SelectItem key={f._id} value={f._id}>{f.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar jobs. Verifique a conexão.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <Database className="h-8 w-8" />
          <p className="text-sm">Nenhum registro encontrado</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Título</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Etapa Atual</TableHead>
                  <TableHead className="text-right hidden lg:table-cell">Valor Orçado</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: HoldprintProcess) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">#{p.code}</TableCell>
                    <TableCell className="font-medium">{p.title || "—"}</TableCell>
                    <TableCell>{p.customerName || "—"}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{p.currentProductionStepName || "—"}</Badge>
                    </TableCell>
                    <TableCell className="text-right hidden lg:table-cell">
                      {p.costs?.budgetedTotalPrice != null ? fmt(p.costs.budgetedTotalPrice) : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isFinalized ? "secondary" : "default"}>
                        {p.isFinalized ? "Finalizado" : "Em produção"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {data?.total || 0} registro(s) — Página {page + 1} de {totalPages || 1}
            </p>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="outline" disabled={page + 1 >= totalPages} onClick={() => setPage(page + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
