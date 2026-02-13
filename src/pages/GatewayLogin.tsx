import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo-industria-visual.png";

interface GatewayUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  permissions: Record<string, unknown>;
}

const GatewayLogin = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<GatewayUser | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", {
        body: { action: "login", email, password },
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setUser(data.user);
      setToken(data.token);

      // Store token for cross-system use
      localStorage.setItem("gateway_token", data.token);
      localStorage.setItem("gateway_user", JSON.stringify(data.user));

      toast({ title: "Login SSO realizado!", description: `Bem-vindo, ${data.user.name}` });
    } catch (err: any) {
      toast({
        title: "Erro no login",
        description: err.message || "Credenciais inválidas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("gateway_token");
    localStorage.removeItem("gateway_user");
    toast({ title: "Logout realizado" });
  };

  if (user && token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <img src={logo} alt="Logo" className="h-12 mx-auto mb-2" />
            <CardTitle className="text-xl">SSO — Autenticado</CardTitle>
            <CardDescription>Sessão ativa no Gateway unificado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nome</span>
                <span className="font-medium">{user.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Role</span>
                <span className="font-medium capitalize">{user.role}</span>
              </div>
              {user.department && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Departamento</span>
                  <span className="font-medium">{user.department}</span>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Token JWT</Label>
              <div className="bg-muted rounded-md p-2 text-xs font-mono break-all max-h-20 overflow-auto">
                {token}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Sistemas disponíveis</Label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(user.permissions || {}).map(([sys, enabled]) => (
                  <span key={sys} className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${enabled ? "bg-green-500/15 text-green-700" : "bg-muted text-muted-foreground"}`}>
                    <Globe className="h-3 w-3" /> {sys}
                  </span>
                ))}
                {Object.keys(user.permissions || {}).length === 0 && (
                  <span className="text-xs text-muted-foreground">Nenhuma permissão configurada</span>
                )}
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Sair do Gateway
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={logo} alt="Logo" className="h-12 mx-auto mb-2" />
          <CardTitle className="text-xl">Gateway SSO</CardTitle>
          <CardDescription>Login unificado para todos os sistemas</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input
                type="password"
                placeholder="Sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                className="h-11"
              />
            </div>
            <Button type="submit" className="w-full h-11" disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <LogIn className="h-4 w-4 mr-2" />}
              Entrar no Gateway
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default GatewayLogin;
