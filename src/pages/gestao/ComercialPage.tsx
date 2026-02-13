import React from "react";
import { TrendingUp, Target, BarChart3, FileText, Users, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import PipelineTab from "@/components/comercial/PipelineTab";
import DashboardTab from "@/components/comercial/DashboardTab";
import OrcamentosTab from "@/components/comercial/OrcamentosTab";
import ClientesTab from "@/components/comercial/ClientesTab";

const ComercialPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <TrendingUp className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Comercial</h1>
          <p className="text-sm text-muted-foreground">Pipeline de vendas, orçamentos, taxa de conversão e histórico de clientes.</p>
        </div>
      </div>

      <Tabs defaultValue="pipeline" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="pipeline" className="gap-1.5">
            <Target className="h-4 w-4" /> Pipeline
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="orcamentos" className="gap-1.5">
            <FileText className="h-4 w-4" /> Orçamentos
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-1.5">
            <Users className="h-4 w-4" /> Clientes
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pipeline" className="mt-4">
          <PipelineTab />
        </TabsContent>
        <TabsContent value="dashboard" className="mt-4">
          <DashboardTab />
        </TabsContent>
        <TabsContent value="orcamentos" className="mt-4">
          <OrcamentosTab />
        </TabsContent>
        <TabsContent value="clientes" className="mt-4">
          <ClientesTab />
        </TabsContent>
        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="comercial" sectorLabel="Comercial" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ComercialPage;
