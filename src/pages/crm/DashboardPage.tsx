import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TrendingUp, Users, FileText, Target, ArrowRight, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { mockDeals, mockTasks, mockContacts, mockProposals, fmtBRL } from "@/lib/crm/mockData";
import { DEAL_STAGES } from "@/lib/crm/types";

const pipelineByStage = DEAL_STAGES.map(s => ({
  name: s.label,
  value: mockDeals.filter(d => d.stage === s.id && d.status === "aberto").reduce((sum, d) => sum + d.value, 0),
}));

const dealStatusData = [
  { name: "Abertos", value: mockDeals.filter(d => d.status === "aberto").length, color: "#3b82f6" },
  { name: "Ganhos", value: mockDeals.filter(d => d.status === "ganho").length, color: "#22c55e" },
  { name: "Perdidos", value: mockDeals.filter(d => d.status === "perdido").length, color: "#ef4444" },
];

const tasksByPriority = [
  { name: "Alta", total: mockTasks.filter(t => t.priority === "alta").length, done: mockTasks.filter(t => t.priority === "alta" && t.completed).length },
  { name: "Média", total: mockTasks.filter(t => t.priority === "media").length, done: mockTasks.filter(t => t.priority === "media" && t.completed).length },
  { name: "Baixa", total: mockTasks.filter(t => t.priority === "baixa").length, done: mockTasks.filter(t => t.priority === "baixa" && t.completed).length },
];

const now = new Date();
const overdueTasks = mockTasks.filter(t => !t.completed && t.due_date && new Date(t.due_date) < now);
const hotContacts = mockContacts.filter(c => c.temperature === "quente");
const totalPipeline = mockDeals.filter(d => d.status === "aberto").reduce((s, d) => s + d.value, 0);
const weightedPipeline = mockDeals.filter(d => d.status === "aberto").reduce((s, d) => s + d.weighted_value, 0);
const acceptedProposals = mockProposals.filter(p => p.status === "aceita").length;
const totalProposals = mockProposals.length;

export default function CRMDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard CRM</h1>
          <p className="text-sm text-muted-foreground">{new Date().toLocaleDateString("pt-BR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Pipeline Ativo</CardTitle><TrendingUp className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtBRL(totalPipeline)}</div>
            <p className="text-xs text-muted-foreground">Ponderado: {fmtBRL(weightedPipeline)}</p>
            <Link to="/crm/pipeline" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">Ver Pipeline <ArrowRight className="h-3 w-3" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Deals</CardTitle><Target className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-600"><CheckCircle2 className="h-4 w-4" /> {mockDeals.filter(d => d.status === "ganho").length}</span>
              <span className="flex items-center gap-1 text-red-500"><XCircle className="h-4 w-4" /> {mockDeals.filter(d => d.status === "perdido").length}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{mockDeals.filter(d => d.status === "aberto").length} abertos</p>
            <Link to="/crm/pipeline" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">Ver Deals <ArrowRight className="h-3 w-3" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Contatos</CardTitle><Users className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">396</div>
            <p className="text-xs text-muted-foreground">🔥 {hotContacts.length} quentes • 5.950 empresas</p>
            <Link to="/crm/contatos" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">Ver Contatos <ArrowRight className="h-3 w-3" /></Link>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">Conversão de Propostas</CardTitle><FileText className="h-4 w-4 text-muted-foreground" /></CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round((acceptedProposals / totalProposals) * 100)}%</div>
            <p className="text-xs text-muted-foreground">Aceitas: {acceptedProposals}/{totalProposals}</p>
            <Link to="/crm/propostas" className="text-xs text-primary hover:underline flex items-center gap-1 mt-1">Ver Propostas <ArrowRight className="h-3 w-3" /></Link>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1">
          <CardHeader><CardTitle className="text-sm">Pipeline por Etapa</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineByStage} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
                <YAxis dataKey="name" type="category" width={90} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => fmtBRL(v)} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">Total: {fmtBRL(totalPipeline)}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Status dos Deals</CardTitle></CardHeader>
          <CardContent className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={dealStatusData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {dealStatusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">Tarefas por Prioridade</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={tasksByPriority}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Total" />
                <Bar dataKey="done" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Concluídas" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-muted-foreground text-center mt-1">Total: {mockTasks.filter(t => t.completed).length}/{mockTasks.length} concluídas</p>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks */}
      {overdueTasks.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Tarefas Atrasadas ({overdueTasks.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {overdueTasks.map(t => (
                <div key={t.id} className="p-3 rounded-lg border border-destructive/20 bg-destructive/5 space-y-1">
                  <p className="font-medium text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.owner_name}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant={t.priority === "alta" ? "destructive" : "secondary"} className="text-[10px]">{t.priority}</Badge>
                    <span className="text-[10px] text-destructive">{t.due_date ? new Date(t.due_date).toLocaleDateString("pt-BR") : ""}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Deals Recentes + Contatos Hot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Deals Recentes</CardTitle></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Deal</TableHead><TableHead>Responsável</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Valor</TableHead></TableRow></TableHeader>
              <TableBody>
                {mockDeals.slice(0, 5).map(d => (
                  <TableRow key={d.id}>
                    <TableCell><div><p className="font-medium text-sm">{d.title}</p><p className="text-xs text-muted-foreground">{d.company_name}</p></div></TableCell>
                    <TableCell className="text-sm">{d.owner_name}</TableCell>
                    <TableCell><Badge variant={d.status === "ganho" ? "default" : d.status === "perdido" ? "destructive" : "secondary"} className="text-[10px]">{d.status}</Badge></TableCell>
                    <TableCell className="text-right text-sm font-medium">{fmtBRL(d.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-sm">🔥 Contatos Hot</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {hotContacts.map(c => (
              <div key={c.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50">
                <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">{c.name.charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{c.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{c.company_name || "PJ"}</p>
                </div>
                <Badge variant="destructive" className="text-[10px] shrink-0">🔥 {c.score}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
