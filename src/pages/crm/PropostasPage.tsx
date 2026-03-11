import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, FileText, Send, Copy, Trash2 } from "lucide-react";
import { mockProposals, fmtBRL } from "@/lib/crm/mockData";
import type { ProposalStatus } from "@/lib/crm/types";

const STATUS_COLORS: Record<ProposalStatus, string> = {
  rascunho: "secondary",
  enviada: "default",
  visualizada: "outline",
  aceita: "default",
  rejeitada: "destructive",
};

const FUNNEL: { id: ProposalStatus; label: string }[] = [
  { id: "rascunho", label: "Rascunho" },
  { id: "enviada", label: "Enviadas" },
  { id: "visualizada", label: "Visualizadas" },
  { id: "aceita", label: "Aceitas" },
  { id: "rejeitada", label: "Rejeitadas" },
];

export default function CRMPropostasPage() {
  const [statusFilter, setStatusFilter] = useState("todas");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return mockProposals.filter(p => {
      if (statusFilter !== "todas" && p.status !== statusFilter) return false;
      if (search && !p.deal_title?.toLowerCase().includes(search.toLowerCase()) && !p.company_name?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [statusFilter, search]);

  const totalValue = mockProposals.reduce((s, p) => s + p.final_value, 0);
  const acceptedValue = mockProposals.filter(p => p.status === "aceita").reduce((s, p) => s + p.final_value, 0);
  const accepted = mockProposals.filter(p => p.status === "aceita").length;
  const conversionRate = Math.round((accepted / mockProposals.length) * 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Propostas</h1>
          <p className="text-sm text-muted-foreground">Total: {fmtBRL(totalValue)} • Aceitas: {fmtBRL(acceptedValue)} • Taxa: {conversionRate}%</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Proposta</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Proposta</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 col-span-2"><Label>Deal</Label><Input placeholder="Buscar deal..." /></div>
              <div className="space-y-2"><Label>Valor (R$)</Label><Input type="number" placeholder="0,00" /></div>
              <div className="space-y-2"><Label>Desconto (%)</Label><Input type="number" placeholder="0" /></div>
              <div className="space-y-2"><Label>Validade</Label><Input type="date" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline">Cancelar</Button><Button>Salvar</Button><Button variant="default"><Send className="h-4 w-4 mr-1" /> Enviar</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Funnel */}
      <div className="flex gap-2 flex-wrap">
        {FUNNEL.map(f => {
          const count = mockProposals.filter(p => p.status === f.id).length;
          return (
            <Card key={f.id} className="flex-1 min-w-[120px] cursor-pointer hover:shadow-md" onClick={() => setStatusFilter(f.id === statusFilter ? "todas" : f.id)}>
              <CardContent className="p-3 text-center">
                <p className="text-lg font-bold">{count}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{f.label}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por deal ou contato..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem>{FUNNEL.map(f => <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Proposta</TableHead><TableHead>Deal</TableHead><TableHead>Empresa</TableHead><TableHead className="text-right">Valor</TableHead><TableHead>Status</TableHead><TableHead>Envio</TableHead><TableHead>Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(p => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium text-sm">{p.number}</TableCell>
                  <TableCell className="text-sm">{p.deal_title || "—"}</TableCell>
                  <TableCell className="text-sm">{p.company_name || "—"}</TableCell>
                  <TableCell className="text-right font-medium text-sm">{fmtBRL(p.final_value)}</TableCell>
                  <TableCell><Badge variant={STATUS_COLORS[p.status] as any}>{p.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{p.sent_date ? new Date(p.sent_date).toLocaleDateString("pt-BR") : "—"}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Send className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7"><Copy className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
