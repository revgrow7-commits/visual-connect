import { Brain, FolderOpen, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import SectorDados from "@/components/gestao/SectorDados";

const OrquestradorPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
          <Brain className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Agente Orquestrador</h1>
          <p className="text-sm text-muted-foreground">Inteligência central com visão transversal de todos os setores</p>
        </div>
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
