import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, Download, Upload } from "lucide-react";
import { mockCompanies } from "@/lib/crm/mockData";

export default function CRMEmpresasPage() {
  const [search, setSearch] = useState("");
  const [unitFilter, setUnitFilter] = useState("todas");

  const filtered = useMemo(() => {
    return mockCompanies.filter(c => {
      if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
      if (unitFilter !== "todas" && c.unit !== unitFilter) return false;
      return true;
    });
  }, [search, unitFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Empresas</h1>
          <p className="text-sm text-muted-foreground">5.950 empresas cadastradas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-2" /> Nova Empresa</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Nova Empresa</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome da empresa</Label><Input placeholder="Nome" /></div>
              <div className="space-y-2"><Label>CNAE/Segmento</Label><Input placeholder="CNAE" /></div>
              <div className="space-y-2 col-span-2"><Label>Endereço</Label><Input placeholder="Endereço completo" /></div>
              <div className="space-y-2"><Label>Telefone</Label><Input placeholder="(51) 3333-0000" /></div>
              <div className="space-y-2"><Label>Website</Label><Input placeholder="https://" /></div>
              <div className="space-y-2"><Label>Unidade</Label><Select><SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger><SelectContent><SelectItem value="POA">POA</SelectItem><SelectItem value="SP">SP</SelectItem></SelectContent></Select></div>
            </div>
            <div className="flex justify-end gap-2 mt-4"><Button variant="outline">Cancelar</Button><Button>Salvar</Button></div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar empresa..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={unitFilter} onValueChange={setUnitFilter}>
          <SelectTrigger className="w-[120px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="POA">POA</SelectItem><SelectItem value="SP">SP</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-1" /> Exportar</Button>
        <Button variant="outline" size="sm"><Upload className="h-4 w-4 mr-1" /> Importar</Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Empresa</TableHead>
                <TableHead>Segmento</TableHead>
                <TableHead>Unidade</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">{c.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{c.segment || c.cnae || "—"}</TableCell>
                  <TableCell className="text-sm">{c.unit}</TableCell>
                  <TableCell className="text-sm">{c.contacts_count ?? 0}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-xs text-muted-foreground text-center">Mostrando 1–{filtered.length} de 5.950</p>
    </div>
  );
}
