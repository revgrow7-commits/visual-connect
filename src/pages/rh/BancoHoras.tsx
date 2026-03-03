import { useState } from "react";
import { Clock, Loader2, DatabaseBackup, Brain, AlertTriangle, Scale, Mail, Download } from "lucide-react";
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
import BancoHorasCLTDashboard from "@/components/banco-horas/BancoHorasCLTDashboard";

async function fetchFromDatabase(competencia: string) {
  console.log("[banco-horas] Fetching data for", competencia);
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  const url = `${supabaseUrl}/rest/v1/banco_horas?competencia=eq.${competencia}&order=nome.asc&select=*`;
  const res = await fetch(url, {
    headers: {
      "apikey": anonKey,
      "Authorization": `Bearer ${anonKey}`,
      "Content-Type": "application/json",
    },
  });
  
  if (!res.ok) {
    const errText = await res.text();
    console.error("[banco-horas] API error:", res.status, errText);
    throw new Error(`Erro ${res.status}: ${errText}`);
  }
  
  const data = await res.json();
  console.log("[banco-horas] Got", data.length, "rows");
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
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      // Try to use session token if available, otherwise use anon key
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || anonKey;

      const res = await fetch(`${supabaseUrl}/functions/v1/secullum?action=importar`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: anonKey,
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

  const [sendingAlerts, setSendingAlerts] = useState(false);

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

  // Compliance classification
  const SALARIO_BASE = 2500;
  const CARGA_MENSAL = 220;
  const VALOR_HORA = SALARIO_BASE / CARGA_MENSAL;

  const conformes = parsed.filter((c) => Math.abs(c.saldoDecimal) <= 20).length;
  const alertas = parsed.filter((c) => Math.abs(c.saldoDecimal) > 20 && Math.abs(c.saldoDecimal) <= 40).length;
  const criticos = parsed.filter((c) => Math.abs(c.saldoDecimal) > 40).length;
  const conformidade = parsed.length > 0 ? Math.round((conformes / parsed.length) * 100) : 0;

  const alertaColabs = parsed
    .filter((c) => Math.abs(c.saldoDecimal) > 20)
    .map((c) => {
      const parseH = (v: string) => { if (!v || v === "00:00") return 0; const neg = v.startsWith("-"); const cl = v.replace("-",""); const [h,m] = cl.split(":").map(Number); return (neg ? -1 : 1) * ((h||0) + (m||0)/60); };
      const hEx60 = parseH(c.ex60);
      const hEx80 = parseH(c.ex80);
      const hEx100 = parseH(c.ex100);
      const passivo = (hEx60 * VALOR_HORA * 1.60 + hEx80 * VALOR_HORA * 1.80 + hEx100 * VALOR_HORA * 2.00) * 1.368;
      return {
        nome: c.nome, cargo: c.cargo, departamento: c.departamento,
        saldo: c.bSaldo, saldoDecimal: c.saldoDecimal,
        ex60: c.ex60, ex80: c.ex80, ex100: c.ex100,
        passivo,
        status: Math.abs(c.saldoDecimal) > 40 ? "critico" : "urgente",
      };
    })
    .sort((a, b) => Math.abs(b.saldoDecimal) - Math.abs(a.saldoDecimal));

  const passivoTotal = parsed.reduce((acc, c) => {
    const parseH = (v: string) => { if (!v || v === "00:00") return 0; const neg = v.startsWith("-"); const cl = v.replace("-",""); const [h,m] = cl.split(":").map(Number); return (neg ? -1 : 1) * ((h||0) + (m||0)/60); };
    return acc + (parseH(c.ex60) * VALOR_HORA * 1.60 + parseH(c.ex80) * VALOR_HORA * 1.80 + parseH(c.ex100) * VALOR_HORA * 2.00) * 1.368;
  }, 0);

  const handleSendAlerts = async () => {
    if (alertaColabs.length === 0) {
      toast({ title: "Sem alertas", description: "Nenhum colaborador com saldo acima de 20h.", variant: "destructive" });
      return;
    }
    setSendingAlerts(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${supabaseUrl}/functions/v1/banco-horas-notify`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
        body: JSON.stringify({
          alertas: alertaColabs,
          competencia,
          resumo: { total: parsed.length, conformes, urgentes: alertas, criticos, conformidade, passivoTotal, saldoTotal: totalSaldo },
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || `HTTP ${res.status}`);
      toast({ title: "📧 Alertas enviados", description: `${result.notified} de ${result.total_recipients} emails enviados com sucesso.` });
    } catch (e: any) {
      toast({ title: "Erro ao enviar alertas", description: e.message, variant: "destructive" });
    } finally {
      setSendingAlerts(false);
    }
  };

  const handleDownloadCSV = () => {
    if (parsed.length === 0) return;
    const headers = ["Nome","Cargo","Departamento","Unidade","Normais","Carga","Faltas","Ex60%","Ex80%","Ex100%","Crédito","Débito","Saldo","Saldo Decimal"];
    const rows = parsed.map(c => [c.nome,c.cargo,c.departamento,c.unidade,c.normais,c.carga,c.faltas,c.ex60,c.ex80,c.ex100,c.bCred,c.bDeb,c.bSaldo,c.saldoDecimal.toString()]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `banco-horas-${competencia}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Download iniciado", description: `Relatório ${competencia} exportado.` });
  };

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
        <div className="flex items-center gap-2">
          <Button onClick={handleDownloadCSV} disabled={!hasData} variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" />
            Baixar CSV
          </Button>
          <Button onClick={handleSendAlerts} disabled={sendingAlerts || !hasData} variant="outline" size="sm" className="gap-1.5 text-xs h-8">
            {sendingAlerts ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
            {sendingAlerts ? "Enviando..." : `Enviar Alertas (${alertaColabs.length})`}
          </Button>
          <Button onClick={handleImport} disabled={importing} size="sm" className="gap-1.5 text-xs h-8">
            {importing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DatabaseBackup className="h-3.5 w-3.5" />}
            {importing ? "Importando..." : "Importar"}
          </Button>
        </div>
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
            <TabsTrigger value="clt" className="text-xs h-7 gap-1"><Scale className="h-3.5 w-3.5" /> CLT</TabsTrigger>
            <TabsTrigger value="meu" className="text-xs h-7">Meu Banco</TabsTrigger>
            <TabsTrigger value="analise" className="text-xs h-7 gap-1"><Brain className="h-3.5 w-3.5" /> Análise IA</TabsTrigger>
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

          <TabsContent value="clt" className="space-y-3 mt-3">
            <BancoHorasCLTDashboard data={parsed} competencia={competencia} />
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
