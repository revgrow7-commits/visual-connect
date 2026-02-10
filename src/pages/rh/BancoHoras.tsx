import { useState } from "react";
import { Clock, TrendingUp, AlertTriangle, Download, Search, RefreshCw, Loader2, Users, Brain } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BancoHorasAIReport from "@/components/banco-horas/BancoHorasAIReport";

interface SecullumTotais {
  Colunas: string[];
  Totais: string[];
}

interface SecullumResult {
  funcionario: {
    Nome: string;
    NumeroPis: string;
    Cargo: string;
    Departamento: string;
    Email: string;
    Unidade: string;
  };
  totais: SecullumTotais;
}

function parseHoras(val: string): number {
  if (!val || val === "") return 0;
  const negative = val.startsWith("-");
  const clean = val.replace("-", "");
  const parts = clean.split(":");
  if (parts.length !== 2) return parseFloat(val) || 0;
  const hours = parseInt(parts[0]) || 0;
  const mins = parseInt(parts[1]) || 0;
  const total = hours + mins / 60;
  return negative ? -total : total;
}

function getTotal(data: SecullumTotais, colName: string): string {
  const idx = data.Colunas?.indexOf(colName);
  if (idx === undefined || idx < 0) return "00:00";
  return data.Totais?.[idx] || "00:00";
}

const formatHoras = (h: number) => {
  const sign = h < 0 ? "-" : "+";
  return `${sign}${Math.abs(h).toFixed(1)}h`;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

async function fetchSecullumData(competencia: string, forceRefresh: boolean): Promise<SecullumResult[]> {
  const [year, month] = competencia.split("-").map(Number);
  const dataInicial = `${year}-${String(month).padStart(2, "0")}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const dataFinal = `${year}-${String(month).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;

  const { data: { session } } = await supabase.auth.getSession();
  const authToken = session?.access_token;
  if (!authToken) throw new Error("Sessão expirada. Faça login novamente.");

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const refreshParam = forceRefresh ? "&refresh=true" : "";
  const res = await fetch(
    `${supabaseUrl}/functions/v1/secullum-proxy?action=totais-todos${refreshParam}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ dataInicial, dataFinal }),
    }
  );

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error || `HTTP ${res.status}`);
  }

  const results = await res.json();
  return Array.isArray(results) ? results : [];
}

const BancoHorasPage = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState("equipe");
  const [search, setSearch] = useState("");
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: rawData = [], isLoading: loading, error, refetch } = useQuery({
    queryKey: ["banco-horas", competencia],
    queryFn: () => fetchSecullumData(competencia, false),
    staleTime: 10 * 60 * 1000, // 10 min — avoid re-fetching on navigation
    gcTime: 15 * 60 * 1000,
    retry: 1,
    meta: { errorMessage: "Erro na integração Secullum" },
  });

  const handleRefresh = async () => {
    try {
      const results = await fetchSecullumData(competencia, true);
      // Manually update the query cache with fresh data
      const { QueryClient } = await import("@tanstack/react-query");
      // Use refetch which will use the queryFn
      await refetch();
    } catch (e: any) {
      toast({ title: "Erro na integração Secullum", description: e.message, variant: "destructive" });
    }
  };

  const parsed = rawData.map((item) => {
    const func = item.funcionario;
    const t = item.totais;
    const normais = getTotal(t, "Normais");
    const faltas = getTotal(t, "Faltas");
    const ex60 = getTotal(t, "Ex60%");
    const ex80 = getTotal(t, "Ex80%");
    const ex100 = getTotal(t, "Ex100%");
    const bSaldo = getTotal(t, "BSaldo");
    const bTotal = getTotal(t, "BTotal");
    const bCred = getTotal(t, "BCred.");
    const bDeb = getTotal(t, "BDeb.");
    const carga = getTotal(t, "Carga");

    return {
      id: func.NumeroPis,
      nome: func.Nome,
      cargo: func.Cargo,
      departamento: func.Departamento,
      unidade: func.Unidade,
      pis: func.NumeroPis,
      normais, faltas, ex60, ex80, ex100, bSaldo, bTotal, bCred, bDeb, carga,
      saldoDecimal: parseHoras(bSaldo),
    };
  });

  const filtered = parsed.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cargo.toLowerCase().includes(search.toLowerCase()) ||
    c.departamento.toLowerCase().includes(search.toLowerCase())
  );

  const totalSaldo = filtered.reduce((a, c) => a + c.saldoDecimal, 0);
  const negativos = filtered.filter((c) => c.saldoDecimal < 0).length;
  const positivos = filtered.filter((c) => c.saldoDecimal > 0).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Banco de Horas
          </h1>
          <p className="text-muted-foreground text-sm">Integração Secullum · Dados em tempo real via Ponto Web</p>
        </div>
        <Button variant="outline" onClick={handleRefresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Atualizar
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro na integração Secullum: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="equipe">Painel RH / Admin</TabsTrigger>
          <TabsTrigger value="analise" className="gap-1.5"><Brain className="h-4 w-4" /> Análise IA</TabsTrigger>
          <TabsTrigger value="meu">Meu Banco</TabsTrigger>
        </TabsList>

        <TabsContent value="equipe" className="space-y-4">
          {/* Summary cards */}
          <div className="grid gap-4 sm:grid-cols-4">
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><Users className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Funcionários</p>
                  <p className="text-2xl font-bold">{loading ? "—" : parsed.length}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-primary/10 p-2.5"><TrendingUp className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Total</p>
                  <p className={`text-2xl font-bold ${totalSaldo >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                    {loading ? "—" : formatHoras(totalSaldo)}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-emerald-100 dark:bg-emerald-900/30 p-2.5"><TrendingUp className="h-5 w-5 text-emerald-600" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Positivo</p>
                  <p className="text-2xl font-bold text-emerald-600">{loading ? "—" : positivos}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5 flex items-center gap-4">
                <div className="rounded-lg bg-destructive/10 p-2.5"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">Saldo Negativo</p>
                  <p className="text-2xl font-bold text-destructive">{loading ? "—" : negativos}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Buscar por nome, cargo ou setor..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Input type="month" value={competencia} onChange={(e) => setCompetencia(e.target.value)} className="w-full sm:w-44" />
            <Button variant="outline" size="sm" className="h-10 shrink-0">
              <Download className="h-4 w-4 mr-1" /> Exportar
            </Button>
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                {loading ? "Carregando dados do Secullum..." : `${filtered.length} funcionário${filtered.length !== 1 ? "s" : ""}`}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Colaborador</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Normais</TableHead>
                      <TableHead className="text-right">Carga</TableHead>
                      <TableHead className="text-right">Faltas</TableHead>
                      <TableHead className="text-right">Ex 60%</TableHead>
                      <TableHead className="text-right">Ex 100%</TableHead>
                      <TableHead className="text-right">B.Crédito</TableHead>
                      <TableHead className="text-right">B.Débito</TableHead>
                      <TableHead className="text-right">B.Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      Array.from({ length: 10 }).map((_, i) => (
                        <TableRow key={i}>
                          {Array.from({ length: 10 }).map((_, j) => (
                            <TableCell key={j}><Skeleton className="h-5 w-16" /></TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : filtered.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="h-32 text-center text-muted-foreground">
                          {error ? "Erro ao carregar dados." : "Nenhum dado encontrado."}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filtered.map((c) => (
                        <TableRow key={c.id} className={c.saldoDecimal < -5 ? "bg-destructive/5" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback className="bg-primary/10 text-primary text-xs">{getInitials(c.nome)}</AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm whitespace-nowrap">{c.nome}</p>
                                <p className="text-xs text-muted-foreground">{c.cargo}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="text-xs">{c.departamento}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm">{c.normais}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-muted-foreground">{c.carga}</TableCell>
                          <TableCell className={`text-right font-mono text-sm ${c.faltas !== "00:00" ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                            {c.faltas}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${c.ex60 !== "00:00" ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                            {c.ex60}
                          </TableCell>
                          <TableCell className={`text-right font-mono text-sm ${c.ex100 !== "00:00" ? "text-amber-600 font-bold" : "text-muted-foreground"}`}>
                            {c.ex100}
                          </TableCell>
                          <TableCell className="text-right font-mono text-sm text-emerald-600">{c.bCred}</TableCell>
                          <TableCell className="text-right font-mono text-sm text-destructive">{c.bDeb}</TableCell>
                          <TableCell className={`text-right font-mono text-sm font-bold ${c.saldoDecimal >= 0 ? "text-emerald-600" : "text-destructive"}`}>
                            {c.bSaldo}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analise" className="space-y-4">
          <BancoHorasAIReport data={parsed} competencia={competencia} />
        </TabsContent>

        <TabsContent value="meu" className="space-y-6">
          <Card className="border-dashed">
            <CardContent className="p-8 text-center text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 text-muted-foreground/50" />
              <p className="font-medium">Meu Banco de Horas</p>
              <p className="text-sm mt-1">Disponível após implementação da autenticação individual.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BancoHorasPage;
