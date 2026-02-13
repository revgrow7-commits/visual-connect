import { Brain, FolderOpen, Bot, LogIn, CheckCircle2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AgentChat from "@/components/ai-agent/AgentChat";
import SectorDados from "@/components/gestao/SectorDados";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const OrquestradorPage = () => {
  const { user, loading } = useAuth();

  const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: window.location.origin + "/orquestrador" },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Agente Orquestrador</h1>
            <p className="text-sm text-muted-foreground">Inteligência central com visão transversal de todos os setores</p>
          </div>
        </div>

        {!loading && (
          user ? (
            <Badge variant="outline" className="gap-1.5 px-3 py-1.5 text-xs border-green-500/30 text-green-700 bg-green-50">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {user.email}
            </Badge>
          ) : (
            <Button size="sm" variant="outline" onClick={handleLogin} className="gap-1.5">
              <LogIn className="h-4 w-4" /> Entrar com Google
            </Button>
          )
        )}
      </div>

      <Tabs defaultValue="agent" className="w-full">
        <TabsList>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <FolderOpen className="h-4 w-4" /> Dados RAG
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="orquestrador" sectorLabel="Orquestrador" className="h-[600px]" />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <SectorDados sector="orquestrador" sectorLabel="Orquestrador" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrquestradorPage;
