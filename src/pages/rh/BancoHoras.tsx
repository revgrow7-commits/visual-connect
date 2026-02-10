import { useState } from "react";
import { Clock, TrendingUp, AlertTriangle, Download, Search, RefreshCw, Loader2, Users, Brain, DatabaseBackup } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BancoHorasAIReport from "@/components/banco-horas/BancoHorasAIReport";

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

const formatHoras = (h: number) => {
  const sign = h < 0 ? "-" : "+";
  return `${sign}${Math.abs(h).toFixed(1)}h`;
};

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();

async function fetchFromDatabase(competencia: string) {
  const { data, error } = await supabase
    .from("banco_horas")
    .select("*")
    .eq("competencia", competencia)
    .order("nome");

  if (error) throw new Error(error.message);
  return data || [];
}

const BancoHorasPage = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState("equipe");
  const [search, setSearch] = useState("");
  const [importing, setImporting] = useState(false);
  const [competencia, setCompetencia] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const { data: dbData = [], isLoading: loading, error } = useQuery({
    queryKey: ["banco-horas-db", competencia],
    queryFn: () => fetchFromDatabase(competencia),
    staleTime: 10 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    retry: 1,
  });

  const handleImport = async () => {
    setImporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada.");

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${supabaseUrl}/functions/v1/importar-banco-horas`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ competencia }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }

      const result = await res.json();
      toast({
        title: "Importação concluída",
        description: `${result.imported} colaboradores importados${result.errors > 0 ? ` (${result.errors} erros)` : ""}.`,
      });

      // Refresh the data from DB
      queryClient.invalidateQueries({ queryKey: ["banco-horas-db", competencia] });
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const parsed = dbData.map((row: any) => ({
    id: row.pis,
    nome: row.nome,
    cargo: row.cargo || "",
    departamento: row.departamento || "",
    unidade: row.unidade || "",
    pis: row.pis,
    normais: row.normais || "00:00",
    faltas: row.faltas || "00:00",
    ex60: row.ex60 || "00:00",
    ex80: row.ex80 || "00:00",
    ex100: row.ex100 || "00:00",
    bSaldo: row.b_saldo || "00:00",
    bTotal: row.b_total || "00:00",
    bCred: row.b_cred || "00:00",
    bDeb: row.b_deb || "00:00",
    carga: row.carga || "00:00",
    saldoDecimal: Number(row.saldo_decimal) || 0,
  }));

  const filtered = parsed.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.cargo.toLowerCase().includes(search.toLowerCase()) ||
    c.departamento.toLowerCase().includes(search.toLowerCase())
  );

  const totalSaldo = filtered.reduce((a, c) => a + c.saldoDecimal, 0);
  const negativos = filtered.filter((c) => c.saldoDecimal < 0).length;
  const positivos = filtered.filter((c) => c.saldoDecimal > 0).length;

  const hasData = parsed.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Clock className="h-6 w-6 text-primary" /> Banco de Horas
          </h1>
          <p className="text-muted-foreground text-sm">Dados importados do Secullum Ponto Web</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleImport} disabled={importing} className="gap-2">
            {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
            {importing ? "Importando..." : "Importar Banco de Horas"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 inline mr-2" />
            Erro ao carregar dados: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {!hasData && !loading && !error && (
        <Card className="border-dashed">
          <CardContent className="p-12 text-center">
            <DatabaseBackup className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <h3 className="font-semibold text-lg mb-2">Nenhum dado importado</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Clique em "Importar Banco de Horas" para buscar os dados do Secullum e salvar no banco de dados.
              A importação pode levar alguns segundos.
            </p>
            <Button onClick={handleImport} disabled={importing} size="lg" className="gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
              {importing ? "Importando..." : "Importar Agora"}
            </Button>
          </CardContent>
        </Card>
      )}

      {(hasData || loading) && (
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
                  {loading ? "Carregando..." : `${filtered.length} funcionário${filtered.length !== 1 ? "s" : ""}`}
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
                            Nenhum dado encontrado.
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
      )}
    </div>
  );
};

export default BancoHorasPage;
