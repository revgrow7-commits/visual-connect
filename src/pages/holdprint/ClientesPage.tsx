import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { customersService } from "@/services/holdprint";
import type { HoldprintCustomer } from "@/services/holdprint/types";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { Search, ChevronLeft, ChevronRight, AlertCircle, Users } from "lucide-react";

const PAGE_SIZE = 20;

export default function HoldprintClientesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<HoldprintCustomer | null>(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["holdprint-customers", page, search, statusFilter],
    queryFn: () =>
      customersService.list({
        skip: page * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
  });

  // Client-side filtering
  const filtered = (data?.data || []).filter((c) => {
    const matchSearch = !search || (c.name || c.fullName || "").toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === "all" || (statusFilter === "active" ? c.active !== false : c.active === false);
    return matchSearch && matchStatus;
  });

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0;
  const initials = (name?: string) => (name || "??").split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase();

  const addr = (c: HoldprintCustomer) => {
    const a = c.addresses?.[0];
    return a ? [a.city, a.state].filter(Boolean).join("/") : "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground text-sm">Base de clientes do Holdprint ERP</p>
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
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="active">Ativos</SelectItem>
            <SelectItem value="inactive">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center gap-2 py-10">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-destructive">Erro ao carregar clientes.</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
          <Users className="h-8 w-8" />
          <p className="text-sm">Nenhum registro encontrado</p>
        </div>
      ) : (
        <>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead className="hidden lg:table-cell">Cidade/UF</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c: HoldprintCustomer) => (
                  <TableRow key={c.id} className="cursor-pointer" onClick={() => setSelected(c)}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {initials(c.name || c.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{c.name || c.fullName || "—"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm">{c.mainEmail || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{c.mainPhoneNumber || "—"}</TableCell>
                    <TableCell className="hidden lg:table-cell text-sm">{addr(c)}</TableCell>
                    <TableCell>
                      <Badge variant={c.active !== false ? "default" : "secondary"}>
                        {c.active !== false ? "Ativo" : "Inativo"}
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

      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {initials(selected?.name || selected?.fullName)}
                </AvatarFallback>
              </Avatar>
              {selected?.name || selected?.fullName}
            </SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="mt-6 space-y-4">
              {[
                ["Nome", selected.name],
                ["Razão Social", selected.fullName],
                ["Email", selected.mainEmail],
                ["Telefone", selected.mainPhoneNumber],
                ["Site", selected.site],
                ["Cidade/UF", addr(selected)],
                ["Status", selected.active !== false ? "Ativo" : "Inativo"],
              ]
                .filter(([, v]) => v && v !== "—")
                .map(([label, value]) => (
                  <div key={label as string}>
                    <p className="text-xs font-medium text-muted-foreground">{label}</p>
                    <p className="text-sm">{value as string}</p>
                  </div>
                ))}
              {selected.contacts && selected.contacts.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Contatos</p>
                  {selected.contacts.map((ct, i) => (
                    <div key={i} className="text-sm border-l-2 pl-3 mb-2">
                      {ct.name && <p className="font-medium">{ct.name}</p>}
                      {ct.email && <p className="text-muted-foreground">{ct.email}</p>}
                      {ct.phoneNumber && <p className="text-muted-foreground">{ct.phoneNumber}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
