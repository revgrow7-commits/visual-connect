import { useState } from "react";
import { holdprintFetch } from "@/services/holdprint/api";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Settings, Loader2 } from "lucide-react";

export default function HoldprintConfiguracoesPage() {
  const [testing, setTesting] = useState(false);

  const handleTest = async () => {
    setTesting(true);
    try {
      const result = await holdprintFetch<{ data?: Array<{ name?: string }> }>(
        "/api-key/customers/data?page=1&limit=1&language=pt-BR",
        "GET"
      );
      const firstCustomer = Array.isArray(result) ? result[0]?.name : result?.data?.[0]?.name;
      toast({
        title: "✅ Conectado ao Holdprint",
        description: `API respondeu com sucesso${firstCustomer ? ` — cliente: ${firstCustomer}` : ""}`,
      });
    } catch (err: any) {
      toast({
        title: "❌ Falha na conexão",
        description: err?.message || "Token inválido ou expirado",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações Holdprint</h1>
          <p className="text-muted-foreground text-sm">Integração com o Holdprint ERP</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status da Conexão</CardTitle>
          <CardDescription>Os tokens de acesso (POA e SP) estão configurados no servidor. Use o botão abaixo para testar a conexão.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={handleTest} disabled={testing}>
            {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Testar Conexão
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
