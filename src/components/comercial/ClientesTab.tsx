import React, { forwardRef, useState, useMemo } from "react";
import { mockCustomers, mockBudgets } from "./mockData";
import { Customer, formatCurrency, formatDate } from "./types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Users, UserCheck, UserX, UserPlus } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const ClientesTab = forwardRef<HTMLDivElement>((_, ref) => {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    return mockCustomers.filter(c => {
      if (statusFilter === "ativos" && !c.active) return false;
      if (statusFilter === "inativos" && c.active) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name.toLowerCase().includes(q) && !c.document.includes(q) && !c.email.toLowerCase().includes(q) && !c.contact_person.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [search, statusFilter]);

  const totalActive = mockCustomers.filter(c => c.active).length;
  const totalInactive = mockCustomers.filter(c => !c.active).length;

  const kpis = [
    { label: "Total Clientes", value: mockCustomers.length, icon: Users, cls: "" },
    { label: "Clientes Ativos", value: totalActive, icon: UserCheck, cls: "text-green-600" },
    { label: "Clientes Inativos", value: totalInactive, icon: UserX, cls: "text-red-600" },
    { label: "Novos (mês)", value: 5, icon: UserPlus, cls: "text-blue-600" },
  ];

  // Customer budgets for detail
  const customerBudgets = selected ? mockBudgets.filter(b => b.customerName === selected.name) : [];

  return (
    <div ref={ref} className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <kpi.icon className={`h-5 w-5 ${kpi.cls || 'text-muted-foreground'}`} />
              <div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold">{kpi.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Buscar por nome, CNPJ, email, contato..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-xs" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="ativos">Ativos</SelectItem>
            <SelectItem value="inativos">Inativos</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>#</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CNPJ</TableHead>
              <TableHead>Contato</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Cidade</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Obs.</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(c => (
              <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => setSelected(c)}>
                <TableCell>{c.id}</TableCell>
                <TableCell className="font-bold">{c.name}</TableCell>
                <TableCell className="text-xs">{c.document}</TableCell>
                <TableCell>{c.contact_person}</TableCell>
                <TableCell><a href={`mailto:${c.email}`} className="text-primary hover:underline text-sm">{c.email}</a></TableCell>
                <TableCell className="text-sm">{c.phone}</TableCell>
                <TableCell className="text-sm">{c.address.city} - {c.address.state}</TableCell>
                <TableCell><Badge className={c.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{c.active ? "Ativo" : "Inativo"}</Badge></TableCell>
                <TableCell>
                  {c.notes ? (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger><span className="text-xs text-muted-foreground truncate max-w-[100px] inline-block">{c.notes}</span></TooltipTrigger>
                        <TooltipContent className="max-w-xs"><p>{c.notes}</p></TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ) : <span className="text-xs text-muted-foreground">—</span>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Customer Detail Sheet */}
      <Sheet open={!!selected} onOpenChange={o => !o && setSelected(null)}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.name}</SheetTitle>
                <SheetDescription>{selected.document} | {selected.address.city} - {selected.address.state}</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-muted-foreground">Contato:</span><span>{selected.contact_person}</span>
                  <span className="text-muted-foreground">Email:</span><span>{selected.email}</span>
                  <span className="text-muted-foreground">Telefone:</span><span>{selected.phone}</span>
                  <span className="text-muted-foreground">Endereço:</span><span>{selected.address.street}, {selected.address.city} - {selected.address.state}</span>
                  <span className="text-muted-foreground">Status:</span><Badge className={selected.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{selected.active ? "Ativo" : "Inativo"}</Badge>
                </div>
                {selected.notes && <p className="text-sm text-muted-foreground bg-muted/50 p-2 rounded">{selected.notes}</p>}

                <Separator />

                <div>
                  <h4 className="font-semibold mb-2">📋 Histórico de Orçamentos</h4>
                  {customerBudgets.length > 0 ? (
                    <>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Código</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Valor</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {customerBudgets.map(b => {
                            const stateMap: Record<number, { text: string; cls: string }> = { 1: { text: "Em Aberto", cls: "bg-blue-100 text-blue-700" }, 3: { text: "Ganho", cls: "bg-green-100 text-green-700" }, 2: { text: "Perdido", cls: "bg-red-100 text-red-700" } };
                            const state = stateMap[b.budgetState];
                            return (
                              <TableRow key={b.id}>
                                <TableCell className="font-medium">#{b.publicId}</TableCell>
                                <TableCell>{formatDate(b.creationDate)}</TableCell>
                                <TableCell><Badge className={state.cls}>{state.text}</Badge></TableCell>
                                <TableCell className="text-right">{formatCurrency(Math.max(...b.proposals.map(p => p.totalPrice)))}</TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                      <div className="mt-3 text-sm grid grid-cols-3 gap-2">
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Total Orçado</p>
                          <p className="font-bold">{formatCurrency(customerBudgets.reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0))}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Total Ganho</p>
                          <p className="font-bold text-green-600">{formatCurrency(customerBudgets.filter(b => b.budgetState === 3).reduce((s, b) => s + Math.max(...b.proposals.map(p => p.totalPrice)), 0))}</p>
                        </div>
                        <div className="bg-muted/50 rounded p-2 text-center">
                          <p className="text-xs text-muted-foreground">Conversão</p>
                          <p className="font-bold">{customerBudgets.length > 0 ? ((customerBudgets.filter(b => b.budgetState === 3).length / customerBudgets.length) * 100).toFixed(0) : 0}%</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Nenhum orçamento encontrado.</p>
                  )}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
});

ClientesTab.displayName = "ClientesTab";
export default ClientesTab;
