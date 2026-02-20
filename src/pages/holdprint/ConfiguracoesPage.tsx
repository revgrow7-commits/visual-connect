import { useState } from "react";
import { getHoldprintSettings, saveHoldprintSettings, holdprintFetch } from "@/services/holdprint/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Settings, CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function HoldprintConfiguracoesPage() {
  const saved = getHoldprintSettings();
  const [token, setToken] = useState(saved?.token || "");
  const [accountId, setAccountId] = useState(saved?.accountId || "94652");
  const [userId, setUserId] = useState(saved?.userId || "6993c060936a7981ac8c7d03");
  const [testing, setTesting] = useState(false);

  const handleSave = () => {
    saveHoldprintSettings({ token, accountId, userId });
    toast({ title: "Configurações salvas", description: "Token e IDs atualizados com sucesso." });
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      saveHoldprintSettings({ token, accountId, userId });
      const result = await holdprintFetch<{ name?: string; email?: string }>(
        "/holdprint-users/user-logged",
        "GET"
      );
      toast({
        title: "✅ Conectado ao Holdprint",
        description: `Logado como ${result?.name || result?.email || "usuário"}`,
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
          <p className="text-muted-foreground text-sm">Configure a integração com o Holdprint ERP</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Integração Holdprint</CardTitle>
          <CardDescription>Insira suas credenciais de acesso à API do Holdprint</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token da API</Label>
            <Input
              id="token"
              type="password"
              placeholder="Bearer token do Holdprint"
              value={token}
              onChange={(e) => setToken(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="accountId">ID da Conta</Label>
            <Input
              id="accountId"
              placeholder="94652"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="userId">ID do Usuário</Label>
            <Input
              id="userId"
              placeholder="6993c060936a7981ac8c7d03"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSave}>Salvar</Button>
            <Button variant="outline" onClick={handleTest} disabled={testing || !token}>
              {testing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Testar Conexão
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
