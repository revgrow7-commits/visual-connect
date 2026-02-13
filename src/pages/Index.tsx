import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import ComunicadosFeed from "@/components/home/ComunicadosFeed";
import CartazesRecentes from "@/components/home/CartazesRecentes";
import AniversariantesWidget from "@/components/home/AniversariantesWidget";
import NovosColaboradores from "@/components/home/NovosColaboradores";
import AtalhosRapidos from "@/components/home/AtalhosRapidos";
import UsuariosWidget from "@/components/home/UsuariosWidget";
import AniversarioBalloon from "@/components/home/AniversarioBalloon";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import logo from "@/assets/logo-industria-visual.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const HomeLoginSection = () => {
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message === "Invalid login credentials"
          ? "E-mail ou senha incorretos."
          : error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Falha ao entrar com Google.",
        variant: "destructive",
      });
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <Card className="border-primary/20 bg-card/80 backdrop-blur">
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <LogIn className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">Faça login para acessar tudo</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Entre com sua conta para visualizar comunicados, dados de RH e mais.
        </p>

        <Button
          type="button"
          variant="outline"
          className="w-full h-11 rounded-xl text-sm font-medium gap-3"
          onClick={handleGoogle}
          disabled={googleLoading}
        >
          {googleLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          )}
          Entrar com Google
        </Button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <Input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-10 rounded-xl"
          />
          <Input
            type="password"
            placeholder="Sua senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="h-10 rounded-xl"
          />
          <Button
            type="submit"
            className="w-full h-10 rounded-xl font-semibold gradient-bordo text-primary-foreground hover:opacity-90 transition-opacity"
            disabled={loading}
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
            Entrar
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const Index = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Colaborador";

  const aniversariantesHoje = [
    { nome: "Ana Rodrigues", foto: "https://i.pravatar.cc/150?img=1" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AniversarioBalloon aniversariantes={aniversariantesHoje} />
      {/* Hero Banner */}
      <div className="gradient-bordo rounded-2xl p-6 flex items-center gap-4">
        <img src={logo} alt="Indústria Visual" className="h-10 brightness-0 invert hidden sm:block" />
        <div>
          <h1 className="text-xl font-bold text-primary-foreground">
            {getGreeting()}, {user ? displayName : "Visitante"}! 👋
          </h1>
          <p className="text-sm text-primary-foreground/80 mt-0.5">
            {user
              ? "Confira as novidades do portal da Indústria Visual"
              : "Faça login para acessar o portal completo"}
          </p>
        </div>
      </div>

      {/* Login section when not authenticated */}
      {!user && <HomeLoginSection />}

      {/* Atalhos */}
      <AtalhosRapidos />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComunicadosFeed />
          <CartazesRecentes />
        </div>
        <div className="space-y-6">
          <AniversariantesWidget />
          <NovosColaboradores />
          <UsuariosWidget />
        </div>
      </div>

      {/* Tagline */}
      <div className="gradient-bordo-light rounded-xl py-3 mt-4">
        <p className="text-center text-xs font-medium text-primary tracking-wide">
          C.R.I.E. &nbsp;Criar &bull; Relevância &bull; Inovação &bull; Eficiência
        </p>
      </div>
    </div>
  );
};

export default Index;
