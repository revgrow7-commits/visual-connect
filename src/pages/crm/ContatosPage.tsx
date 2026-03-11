import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Upload } from "lucide-react";
import { mockContacts } from "@/lib/crm/mockData";

const TEMP_COLORS = { quente: "destructive", morno: "secondary", frio: "outline" } as const;
const TEMP_LABELS = { quente: "🔥 Quente", morno: "☀️ Morno", frio: "❄️ Frio" };

export default function CRMContatosPage() {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("todas");
  const [tempFilter, setTempFilter] = useState("todas");

  const filtered = useMemo(() => {
    return mockContacts.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.email?.toLowerCase().includes(search.toLowerCase())) return false;
      if (unitFilter !== "todas" && c.unit !== unitFilter) return false;
      if (tempFilter !== "todas" && c.temperature !== tempFilter) return false;
      return true;
    });
  }, [search, unitFilter, tempFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Contatos</h1>
          <p className="text-sm text-muted-foreground">396 contatos cadastrados</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Novo Contato</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Novo Contato</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome completo</Label><Input placeholder="Nome" /></div>
              <div className="space-y-2"><Label>Email</Label><Input placeholder="email@empresa.com" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(51) 99999-0000" /></div>
              <div className="space-y-2"><Label>Cargo</Label><Input placeholder="Diretor" /></div>
              <div className="space-y-2"><Label>Empresa</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="c1">AGENCIA INCOMUM</SelectItem><SelectItem value="c2">TERMOLAR</SelectItem><SelectItem value="c3">CLAUDIO ASUN</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Temperatura</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="quente">🔥 Quente</SelectItem><SelectItem value="morno">☀️ Morno</SelectItem><SelectItem value="frio">❄️ Frio</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Unidade</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="POA">POA</SelectItem><SelectItem value="SP">SP</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label>Score</Label><Input type="number" placeholder="0-100" /></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline">Cancelar</Button><Button>Salvar</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar contato..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="POA">POA</SelectItem><SelectItem value="SP">SP</SelectItem></SelectContent>
        </Select>
        <Select value={tempFilter} onValueChange={setTempFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="quente">🔥 Quente</SelectItem><SelectItem value="morno">☀️ Morno</SelectItem><SelectItem value="frio">❄️ Frio</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
        <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Importar</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contato</TableHead>
                <TableHead>Empresa</TableHead>
                <TableHead>Temperatura</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Última Interação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell>
                    <div><p className="font-medium text-sm">{c.name}</p><p className="text-xs text-muted-foreground">{c.position} • {c.email}</p></div>
                  </TableCell>
                  <TableCell className="text-sm">{c.company_name || "—"}</TableCell>
                  <TableCell><Badge variant={TEMP_COLORS[c.temperature]}>{TEMP_LABELS[c.temperature]}</Badge></TableCell>
                  <TableCell><span className="font-medium text-sm">{c.temperature === "quente" ? "🔥 " : ""}{c.score}</span></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.last_interaction ? new Date(c.last_interaction).toLocaleDateString("pt-BR") : "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">Mostrando 1–{filtered.length} de 396</p>
    </div>
  );
}
