import React from "react";
import { HeadphonesIcon, BarChart3, Package, MessageSquare, Users, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import CSDashboardTab from "@/components/cs/CSDashboardTab";
import EntregasTab from "@/components/cs/EntregasTab";
import ReclamacoesTab from "@/components/cs/ReclamacoesTab";
import CSClientesTab from "@/components/cs/CSClientesTab";

const CsPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HeadphonesIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Success</h1>
          <p className="text-sm text-muted-foreground">Pós-venda, garantias, histórico de entregas e reclamações.</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Dashboard CS
          </TabsTrigger>
          <TabsTrigger value="entregas" className="gap-1.5">
            <Package className="h-4 w-4" /> Entregas
          </TabsTrigger>
          <TabsTrigger value="reclamacoes" className="gap-1.5">
            <MessageSquare className="h-4 w-4" /> Reclamações
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <CSDashboardTab />
        </TabsContent>
        <TabsContent value="entregas" className="mt-4">
          <EntregasTab />
        </TabsContent>
        <TabsContent value="reclamacoes" className="mt-4">
          <ReclamacoesTab />
        </TabsContent>
        <TabsContent value="clientes" className="mt-4">
          <CSClientesTab />
        </TabsContent>
        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="cs" sectorLabel="Customer Success" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CsPage;
