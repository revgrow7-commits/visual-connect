import { useState } from "react";
import { Clock, Loader2, DatabaseBackup, Brain, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BancoHorasSummaryCards from "@/components/banco-horas/BancoHorasSummaryCards";
import BancoHorasFilters from "@/components/banco-horas/BancoHorasFilters";
import BancoHorasTable, { type BancoHorasRow } from "@/components/banco-horas/BancoHorasTable";
import BancoHorasEmptyState from "@/components/banco-horas/BancoHorasEmptyState";
import BancoHorasAIReport from "@/components/banco-horas/BancoHorasAIReport";

async function fetchFromDatabase(competencia: string) {
  const { data, error } = await supabase
    .from("banco_horas")
    .select("*")
    .eq("competencia", competencia)
    .order("nome");
  if (error) throw new Error(error.message);
  return data || [];
}

function parseRows(dbData: any[]): BancoHorasRow[] {
  return dbData.map((row) => ({
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
    refetchOnWindowFocus: false,
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
      queryClient.invalidateQueries({ queryKey: ["banco-horas-db", competencia] });
    } catch (e: any) {
      toast({ title: "Erro na importação", description: e.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const parsed = parseRows(dbData);
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
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="rounded-lg gradient-bordo p-2">
            <Clock className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground leading-none">Banco de Horas</h1>
            <p className="text-muted-foreground text-xs mt-0.5">Dados sincronizados do Secullum</p>
          </div>
        </div>
        <Button onClick={handleImport} disabled={importing} size="sm" className="gap-1.5 text-xs h-8">
          {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseBackup className="h-3.5 w-3.5" />}
          {importing ? "Importando..." : "Importar"}
        </Button>
      </div>

      {error && (
        <Card className="border-destructive">
          <CardContent className="p-3 text-sm text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Erro ao carregar dados: {(error as Error).message}
          </CardContent>
        </Card>
      )}

      {!hasData && !loading && !error && (
        <BancoHorasEmptyState importing={importing} onImport={handleImport} />
      )}

      {(hasData || loading) && (
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="h-8">
            <TabsTrigger value="equipe" className="text-xs h-7">Painel RH</TabsTrigger>
            <TabsTrigger value="analise" className="text-xs h-7 gap-1"><Brain className="h-3.5 w-3.5" /> Análise IA</TabsTrigger>
            <TabsTrigger value="meu" className="text-xs h-7">Meu Banco</TabsTrigger>
          </TabsList>

          <TabsContent value="equipe" className="space-y-3 mt-3">
            <BancoHorasSummaryCards
              total={parsed.length}
              totalSaldo={totalSaldo}
              positivos={positivos}
              negativos={negativos}
              loading={loading}
            />
            <BancoHorasFilters
              search={search}
              onSearchChange={setSearch}
              competencia={competencia}
              onCompetenciaChange={setCompetencia}
            />
            <BancoHorasTable data={filtered} loading={loading} />
          </TabsContent>

          <TabsContent value="analise" className="space-y-3 mt-3">
            <BancoHorasAIReport data={parsed} competencia={competencia} />
          </TabsContent>

          <TabsContent value="meu" className="mt-3">
            <Card className="border-dashed">
              <CardContent className="p-8 text-center text-muted-foreground">
                <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                <p className="font-medium text-sm">Meu Banco de Horas</p>
                <p className="text-xs mt-1">Disponível após autenticação individual.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default BancoHorasPage;
