import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Heart, AlertTriangle, TrendingUp, Users } from "lucide-react";

const mockCSData = [
  { id: "1", company: "CLAUDIO ASUN", contact: "Mariana Asun", health: 92, status: "ativo", renewal: "2026-12-31", lastActivity: "2026-03-10" },
  { id: "2", company: "TERMOLAR", contact: "Roberto Menezes", health: 78, status: "ativo", renewal: "2026-09-30", lastActivity: "2026-03-08" },
  { id: "3", company: "AGENCIA INCOMUM", contact: "Carlos Incomum", health: 65, status: "at-risk", renewal: "2026-06-30", lastActivity: "2026-02-20" },
  { id: "4", company: "ALIBEM", contact: "Fernanda Alibem", health: 45, status: "at-risk", renewal: "2026-05-31", lastActivity: "2026-01-15" },
  { id: "5", company: "SICREDI", contact: "Thiago Costa", health: 85, status: "ativo", renewal: "2027-01-31", lastActivity: "2026-03-05" },
];

const healthColor = (h: number) => h >= 80 ? "text-green-600" : h >= 60 ? "text-yellow-600" : "text-red-500";
const healthBg = (h: number) => h >= 80 ? "bg-green-500" : h >= 60 ? "bg-yellow-500" : "bg-red-500";

export default function CRMCSPage() {
  const totalClients = mockCSData.length;
  const atRisk = mockCSData.filter(c => c.status === "at-risk").length;
  const avgHealth = Math.round(mockCSData.reduce((s, c) => s + c.health, 0) / totalClients);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Sucesso do Cliente</h1>
        <p className="text-sm text-muted-foreground">{totalClients} clientes • {atRisk} at-risk • {totalClients - atRisk} ativos</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Health Score Médio</CardTitle><Heart className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className={`text-2xl font-bold ${healthColor(avgHealth)}`}>{avgHealth}%</div><Progress value={avgHealth} className="h-2 mt-2" /></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">At-Risk</CardTitle><AlertTriangle className="h-4 w-4 text-destructive" /></CardHeader><CardContent><div className="text-2xl font-bold text-destructive">{atRisk}</div><p className="text-xs text-muted-foreground">clientes em risco</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">NPS Score</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold text-green-600">72</div><p className="text-xs text-muted-foreground">Promotores: 60%</p></CardContent></Card>
        <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm">Renovações</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader><CardContent><div className="text-2xl font-bold">3</div><p className="text-xs text-muted-foreground">próximos 90 dias</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Empresa</TableHead><TableHead>Contato</TableHead><TableHead>Health Score</TableHead><TableHead>Status</TableHead><TableHead>Renovação</TableHead><TableHead>Última Atividade</TableHead></TableRow></TableHeader>
            <TableBody>
              {mockCSData.map(c => (
                <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                  <TableCell className="font-medium text-sm">{c.company}</TableCell>
                  <TableCell className="text-sm">{c.contact}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${healthBg(c.health)}`} />
                      <span className={`text-sm font-medium ${healthColor(c.health)}`}>{c.health}%</span>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant={c.status === "at-risk" ? "destructive" : "default"}>{c.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.renewal).toLocaleDateString("pt-BR")}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{new Date(c.lastActivity).toLocaleDateString("pt-BR")}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
