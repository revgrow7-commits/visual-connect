import { useState } from "react";
import { Clock, TrendingUp, TrendingDown, AlertTriangle, Download, Search, Filter, ArrowUpDown, DollarSign, Timer, CalendarClock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

/* ========== MOCK DATA ========== */

const meuBanco = {
  saldoMes: 12.5,
  saldoAcumulado: 38.75,
  extras50: 8,
  extras100: 4.5,
  proximoVencimento: "2025-04-15",
  horasVencer: 6,
};

const mockColaboradores = [
  { id: "1", nome: "Ana Paula Silva", unidade: "POA", cargo: "Designer Gráfico", competencia: "2025-02", saldoMes: 12.5, saldoAcumulado: 38.75, extras50: 8, extras100: 4.5, custoProjetado: 1250.0, vencimento30: 6, vencimento60: 10, vencimento90: 0, status: "ativo" },
  { id: "2", nome: "Carlos Eduardo Souza", unidade: "SP", cargo: "Instalador Externo", competencia: "2025-02", saldoMes: -4.0, saldoAcumulado: 22.0, extras50: 2, extras100: 0, custoProjetado: 420.0, vencimento30: 0, vencimento60: 0, vencimento90: 0, status: "ativo" },
  { id: "3", nome: "Mariana Costa", unidade: "POA", cargo: "Analista Comercial", competencia: "2025-02", saldoMes: 20.0, saldoAcumulado: 65.5, extras50: 14, extras100: 6, custoProjetado: 3200.0, vencimento30: 12, vencimento60: 8, vencimento90: 15, status: "critico" },
  { id: "4", nome: "Rafael Oliveira", unidade: "SP", cargo: "Técnico de Segurança", competencia: "2025-02", saldoMes: 0, saldoAcumulado: 4.0, extras50: 0, extras100: 0, custoProjetado: 80.0, vencimento30: 4, vencimento60: 0, vencimento90: 0, status: "a_vencer" },
  { id: "5", nome: "Juliana Mendes", unidade: "POA", cargo: "Assistente Adm.", competencia: "2025-02", saldoMes: 6.25, saldoAcumulado: 18.0, extras50: 4, extras100: 2.25, custoProjetado: 650.0, vencimento30: 0, vencimento60: 6, vencimento90: 0, status: "ativo" },
  { id: "6", nome: "Pedro Santos", unidade: "SP", cargo: "Coordenador de Obras", competencia: "2025-02", saldoMes: 32.0, saldoAcumulado: 88.0, extras50: 20, extras100: 12, custoProjetado: 5800.0, vencimento30: 20, vencimento60: 30, vencimento90: 15, status: "critico" },
  { id: "7", nome: "Fernanda Lima", unidade: "POA", cargo: "RH Analista", competencia: "2025-02", saldoMes: 2.0, saldoAcumulado: 8.0, extras50: 2, extras100: 0, custoProjetado: 180.0, vencimento30: 0, vencimento60: 0, vencimento90: 8, status: "ativo" },
];

const statusBadge = (status: string) => {
  switch (status) {
    case "critico": return <Badge variant="destructive">Crítico</Badge>;
    case "a_vencer": return <Badge className="bg-amber-500/10 text-amber-600 border-amber-300">A Vencer</Badge>;
    default: return <Badge variant="secondary">Ativo</Badge>;
  }
};

const formatHoras = (h: number) => {
  const sign = h < 0 ? "-" : "+";
  return `${sign}${Math.abs(h).toFixed(1)}h`;
};

const BancoHorasPage = () => {
  const [tab, setTab] = useState("meu");
  const [search, setSearch] = useState("");
  const [filterUnidade, setFilterUnidade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [competencia, setCompetencia] = useState("2025-02");

  const filtered = mockColaboradores.filter((c) => {
    const matchSearch = c.nome.toLowerCase().includes(search.toLowerCase());
    const matchUnidade = filterUnidade === "all" || c.unidade === filterUnidade;
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchSearch && matchUnidade && matchStatus;
  });

  const totalCusto = filtered.reduce((a, c) => a + c.custoProjetado, 0);
  const totalSaldo = filtered.reduce((a, c) => a + c.saldoAcumulado, 0);
  const totalVencer30 = filtered.reduce((a, c) => a + c.vencimento30, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" /> Banco de Horas
        </h1>
        <p className="text-muted-foreground text-sm">Painel integrado com sistema Secullum · Cálculo oficial via Ponto Web</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="meu">Meu Banco</TabsTrigger>
          <TabsTrigger value="equipe">Painel RH / Admin</TabsTrigger>
        </TabsList>

        {/* ===== MEU BANCO ===== */}
        <TabsContent value="meu" className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><Timer className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo do Mês</p>
                  <p className={`text-2xl font-bold ${meuBanco.saldoMes >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatHoras(meuBanco.saldoMes)}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Fev/2025</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Acumulado</p>
                  <p className="text-2xl font-bold text-foreground">{formatHoras(meuBanco.saldoAcumulado)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-start gap-4">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2.5"><CalendarClock className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Horas Extras</p>
                  <p className="text-lg font-bold">{meuBanco.extras50}h <span className="text-xs font-normal text-muted-foreground">50%</span></p>
                  <p className="text-lg font-bold">{meuBanco.extras100}h <span className="text-xs font-normal text-muted-foreground">100%</span></p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-amber-300 bg-amber-50/50 dark:bg-amber-950/20">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="rounded-lg bg-amber-200/60 dark:bg-amber-800/40 p-2.5"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Próximo Vencimento</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{meuBanco.horasVencer}h</p>
                  <p className="text-[10px] text-muted-foreground">Vence em {meuBanco.proximoVencimento}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Histórico simples */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico Mensal</CardTitle>
              <CardDescription>Últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { mes: "Fev/2025", saldo: 12.5, status: "ativo" },
                  { mes: "Jan/2025", saldo: 8.0, status: "ativo" },
                  { mes: "Dez/2024", saldo: -2.0, status: "compensado" },
                  { mes: "Nov/2024", saldo: 10.25, status: "ativo" },
                  { mes: "Out/2024", saldo: 6.0, status: "pago" },
                  { mes: "Set/2024", saldo: 4.0, status: "compensado" },
                ].map((h) => (
                  <div key={h.mes} className="flex items-center justify-between py-2 border-b last:border-0">
                    <span className="text-sm font-medium">{h.mes}</span>
                    <div className="flex items-center gap-3">
                      <span className={`text-sm font-bold ${h.saldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatHoras(h.saldo)}</span>
                      <Badge variant="outline" className="text-[10px] capitalize">{h.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== PAINEL RH ===== */}
        <TabsContent value="equipe" className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Total Acumulado</p>
                  <p className="text-2xl font-bold">{totalSaldo.toFixed(1)}h</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-destructive/10 p-2.5"><DollarSign className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Custo Projetado Total</p>
                  <p className="text-2xl font-bold">R$ {totalCusto.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                </div>
              </CardContent>
            </Card>
            <Card className={totalVencer30 > 0 ? "border-amber-300" : ""}>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-amber-100 dark:bg-amber-900/30 p-2.5"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Horas a Vencer (30d)</p>
                  <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{totalVencer30}h</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar colaborador..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterUnidade} onValueChange={setFilterUnidade}>
              <SelectTrigger className="w-full sm:w-36"><SelectValue placeholder="Unidade" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="POA">POA</SelectItem>
                <SelectItem value="SP">SP</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="ativo">Ativo</SelectItem>
                <SelectItem value="a_vencer">A Vencer</SelectItem>
                <SelectItem value="critico">Crítico</SelectItem>
              </SelectContent>
            </Select>
            <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="w-full sm:w-44" />
            <Button variant="outline" size="sm" className="h-10 shrink-0">
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Saldo Mês</TableHead>
                      <TableHead className="text-right">Saldo Acum.</TableHead>
                      <TableHead className="text-right">Extras 50%</TableHead>
                      <TableHead className="text-right">Extras 100%</TableHead>
                      <TableHead className="text-right">Custo (R$)</TableHead>
                      <TableHead className="text-center">Vencer 30/60/90d</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((c) => (
                      <TableRow key={c.id} className={c.status === "critico" ? "bg-destructive/5" : ""}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">{c.nome.split(" ").map(n => n[0]).join("").slice(0, 2)}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm whitespace-nowrap">{c.nome}</p>
                              <p className="text-xs text-muted-foreground">{c.cargo}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="secondary">{c.unidade}</Badge></TableCell>
                        <TableCell className={`text-right font-mono font-bold ${c.saldoMes >= 0 ? "text-emerald-600" : "text-destructive"}`}>{formatHoras(c.saldoMes)}</TableCell>
                        <TableCell className="text-right font-mono font-bold">{formatHoras(c.saldoAcumulado)}</TableCell>
                        <TableCell className="text-right font-mono">{c.extras50}h</TableCell>
                        <TableCell className="text-right font-mono">{c.extras100}h</TableCell>
                        <TableCell className="text-right font-mono whitespace-nowrap">R$ {c.custoProjetado.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1.5 text-xs font-mono">
                            <span className={c.vencimento30 > 0 ? "text-destructive font-bold" : "text-muted-foreground"}>{c.vencimento30}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className={c.vencimento60 > 0 ? "text-amber-600 font-bold" : "text-muted-foreground"}>{c.vencimento60}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">{c.vencimento90}</span>
                          </div>
                        </TableCell>
                        <TableCell>{statusBadge(c.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BancoHorasPage;
