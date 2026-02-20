import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { processesService } from "@/services/holdprint";
import type { HoldprintProcess, ProcessFamily } from "@/services/holdprint/types";
import { getHoldprintSettings } from "@/services/holdprint/api";
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
import { Search, ChevronLeft, ChevronRight, AlertCircle, Settings, Database } from "lucide-react";
import { Link } from "react-router-dom";

const PAGE_SIZE = 20;

export default function HoldprintProcessosPage() {
  const settings = getHoldprintSettings();
  const [search, setSearch] = useState("");
  const [familyFilter, setFamilyFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"ASC" | "DESC">("ASC");

  const { data: families } = useQuery({
    queryKey: ["holdprint-process-families"],
    queryFn: () => processesService.families(),
    enabled: !!settings?.token,
  });

  const { data, isLoading, isError } = useQuery({
    queryKey: ["holdprint-processes", page, search, familyFilter, sortField, sortDir],
    queryFn: () =>
      processesService.list({
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
        order: { [sortField]: sortDir },
        filter: {
          ...(search ? { name: { $regex: search, $options: "i" } } : {}),
          ...(familyFilter !== "all" ? { "family._id": familyFilter } : {}),
        },
      }),
    enabled: !!settings?.token,
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "ASC" ? "DESC" : "ASC"));
    } else {
      setSortField(field);
      setSortDir("ASC");
    }
  };

  const SortIcon = ({ field }: { field: string }) =>
    sortField === field ? (
      <span className="ml-1 text-xs">{sortDir === "ASC" ? "↑" : "↓"}</span>
    ) : null;

  if (!settings?.token) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-20">
        <AlertCircle className="h-12 w-12 text-yellow-500" />
        <p className="text-lg font-medium">Configure seu token Holdprint</p>
        <p className="text-muted-foreground text-sm">Acesse as configurações para conectar ao Holdprint ERP</p>
        <Button asChild>
          <Link to="/holdprint/configuracoes"><Settings className="mr-2 h-4 w-4" /> Configurações</Link>
        </Button>
      </div>
    );
  }

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Database className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Processos</h1>
          <p className="text-muted-foreground text-sm">Processos produtivos do Holdprint ERP</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nome..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <Select value={familyFilter} onValueChange={(v) => { setFamilyFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-52">
            <SelectValue placeholder="Família" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as Famílias</SelectItem>
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
          <p className="text-sm text-destructive">Erro ao carregar processos. Verifique seu token.</p>
        </div>
      ) : data && data.data.length === 0 ? (
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
                  <TableHead className="cursor-pointer select-none" onClick={() => toggleSort("name")}>
                    Nome <SortIcon field="name" />
                  </TableHead>
                  <TableHead>Família</TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("cost")}>
                    Custo <SortIcon field="cost" />
                  </TableHead>
                  <TableHead className="cursor-pointer select-none text-right" onClick={() => toggleSort("estimatedTime")}>
                    Tempo Est. <SortIcon field="estimatedTime" />
                  </TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((p: HoldprintProcess) => (
                  <TableRow key={p._id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.family?.name || "—"}</TableCell>
                    <TableCell className="text-right">
                      {p.cost != null ? `R$ ${Number(p.cost).toFixed(2)}` : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.estimatedTime != null ? `${p.estimatedTime} min` : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.isActive !== false ? "default" : "secondary"}>
                        {p.isActive !== false ? "Ativo" : "Inativo"}
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
