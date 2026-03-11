import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Shield } from "lucide-react";
import { mockAuditLogs } from "@/lib/crm/mockData";

const ACTION_COLORS: Record<string, string> = { CREATE: "default", UPDATE: "secondary", DELETE: "destructive", VIEW: "outline" };

export default function CRMAuditoriaPage() {
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("todas");

  const filtered = useMemo(() => {
    return mockAuditLogs.filter(l => {
      if (actionFilter !== "todas" && l.action !== actionFilter) return false;
      if (search && !l.user_name.toLowerCase().includes(search.toLowerCase()) && !l.entity_type.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [search, actionFilter]);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Shield className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Auditoria</h1>
          <p className="text-sm text-muted-foreground">Registro de todas as ações realizadas</p>
        </div>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por usuário ou entidade..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={actionFilter} onValueChange={setActionFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="todas">Todas</SelectItem><SelectItem value="CREATE">Criação</SelectItem><SelectItem value="UPDATE">Edição</SelectItem><SelectItem value="DELETE">Exclusão</SelectItem><SelectItem value="VIEW">Visualização</SelectItem></SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Data/Hora</TableHead><TableHead>Usuário</TableHead><TableHead>Ação</TableHead><TableHead>Entidade</TableHead><TableHead>Detalhes</TableHead><TableHead>IP</TableHead></TableRow></TableHeader>
            <TableBody>
              {filtered.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-sm text-muted-foreground">{new Date(l.created_at).toLocaleString("pt-BR")}</TableCell>
                  <TableCell className="text-sm font-medium">{l.user_name}</TableCell>
                  <TableCell><Badge variant={ACTION_COLORS[l.action] as any}>{l.action}</Badge></TableCell>
                  <TableCell className="text-sm">{l.entity_type} {l.entity_id ? `#${l.entity_id}` : ""}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{JSON.stringify(l.changes)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{l.ip_address || "—"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
