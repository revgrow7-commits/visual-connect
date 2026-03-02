import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Loader2, CheckCircle2, XCircle, Clock, Database } from "lucide-react";
import { toast } from "sonner";

interface SyncLog {
  id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  trigger_type: string;
  endpoints_synced: string[];
  total_records: number;
  inserted: number;
  updated: number;
  errors: string[];
  details: Record<string, { fetched: number; inserted: number; updated: number }>;
}

const AdminHoldprintSync: React.FC = () => {
  const [syncing, setSyncing] = useState(false);
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ["holdprint-sync-logs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("holdprint_sync_log")
        .select("*")
        .order("started_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data as unknown as SyncLog[];
    },
    refetchInterval: syncing ? 5000 : 30000,
  });

  const handleManualSync = async () => {
    setSyncing(true);
    toast.info("Sincronização iniciada. Isso pode levar alguns minutos...");
    try {
      const { data, error } = await supabase.functions.invoke("holdprint-daily-sync", {
        body: { trigger_type: "manual" },
      });
      if (error) throw error;
      toast.success(`Sincronização concluída! ${data.total_records} registros processados.`);
      queryClient.invalidateQueries({ queryKey: ["holdprint-sync-logs"] });
    } catch (e: any) {
      toast.error(`Erro na sincronização: ${e.message}`);
    } finally {
      setSyncing(false);
    }
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "success": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "error": return <XCircle className="h-4 w-4 text-red-500" />;
      case "running": return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case "partial": return <Clock className="h-4 w-4 text-yellow-500" />;
      default: return <Clock className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const statusLabel: Record<string, string> = {
    success: "Sucesso",
    error: "Erro",
    running: "Em andamento",
    partial: "Parcial",
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Database className="h-5 w-5" /> Sincronização Holdprint
          </h2>
          <p className="text-sm text-muted-foreground">
            Sincronização automática diária (6h) • Clientes, Jobs, Orçamentos, Receitas, Despesas, Fornecedores
          </p>
        </div>
        <Button onClick={handleManualSync} disabled={syncing} className="gap-2">
          {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          {syncing ? "Sincronizando..." : "Sincronizar Agora"}
        </Button>
      </div>

      <div className="grid gap-3">
        {isLoading ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Carregando histórico...</CardContent></Card>
        ) : !logs?.length ? (
          <Card><CardContent className="py-8 text-center text-muted-foreground">Nenhuma sincronização realizada ainda.</CardContent></Card>
        ) : (
          logs.map((log) => (
            <Card key={log.id} className="overflow-hidden">
              <CardContent className="py-3 px-4">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {statusIcon(log.status)}
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {new Date(log.started_at).toLocaleDateString("pt-BR")} às{" "}
                          {new Date(log.started_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <Badge variant={log.trigger_type === "cron" ? "secondary" : "outline"} className="text-[10px]">
                          {log.trigger_type === "cron" ? "Automático" : "Manual"}
                        </Badge>
                        <Badge variant="outline" className="text-[10px]">
                          {statusLabel[log.status] || log.status}
                        </Badge>
                      </div>
                      {log.finished_at && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {log.total_records} registros • 
                          Duração: {Math.round((new Date(log.finished_at).getTime() - new Date(log.started_at).getTime()) / 1000)}s
                          {log.errors?.length > 0 && ` • ${log.errors.length} erros`}
                        </p>
                      )}
                    </div>
                  </div>
                  {log.details && (
                    <div className="hidden md:flex gap-2 text-[10px] text-muted-foreground">
                      {Object.entries(log.details).map(([ep, d]) => (
                        <span key={ep} className="bg-muted px-1.5 py-0.5 rounded">
                          {ep}: {d.fetched}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default AdminHoldprintSync;
