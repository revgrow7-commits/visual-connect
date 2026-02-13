import React from "react";
import { HeadphonesIcon, BarChart3, Heart, Package, MessageSquare, Wrench, Calendar, Lightbulb, Bot } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import CSDashboardTab from "@/components/cs/CSDashboardTab";
import HealthScoreTab from "@/components/cs/HealthScoreTab";
import EntregasTab from "@/components/cs/EntregasTab";
import ReclamacoesTab from "@/components/cs/ReclamacoesTab";
import VisitasTecnicasTab from "@/components/cs/VisitasTecnicasTab";
import ReguaRelacionamentoTab from "@/components/cs/ReguaRelacionamentoTab";
import OportunidadesTab from "@/components/cs/OportunidadesTab";

const CsPage = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <HeadphonesIcon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Customer Success</h1>
          <p className="text-sm text-muted-foreground">Pós-venda, garantias, health score, SLA e oportunidades.</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="dashboard" className="gap-1.5"><BarChart3 className="h-4 w-4" /> Dashboard</TabsTrigger>
          <TabsTrigger value="health" className="gap-1.5"><Heart className="h-4 w-4" /> Health Score</TabsTrigger>
          <TabsTrigger value="entregas" className="gap-1.5"><Package className="h-4 w-4" /> Entregas & Garantias</TabsTrigger>
          <TabsTrigger value="reclamacoes" className="gap-1.5"><MessageSquare className="h-4 w-4" /> Reclamações & SLA</TabsTrigger>
          <TabsTrigger value="visitas" className="gap-1.5"><Wrench className="h-4 w-4" /> Visitas Técnicas</TabsTrigger>
          <TabsTrigger value="regua" className="gap-1.5"><Calendar className="h-4 w-4" /> Régua</TabsTrigger>
          <TabsTrigger value="oportunidades" className="gap-1.5"><Lightbulb className="h-4 w-4" /> Oportunidades</TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5"><Bot className="h-4 w-4" /> Agente IA</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4"><CSDashboardTab /></TabsContent>
        <TabsContent value="health" className="mt-4"><HealthScoreTab /></TabsContent>
        <TabsContent value="entregas" className="mt-4"><EntregasTab /></TabsContent>
        <TabsContent value="reclamacoes" className="mt-4"><ReclamacoesTab /></TabsContent>
        <TabsContent value="visitas" className="mt-4"><VisitasTecnicasTab /></TabsContent>
        <TabsContent value="regua" className="mt-4"><ReguaRelacionamentoTab /></TabsContent>
        <TabsContent value="oportunidades" className="mt-4"><OportunidadesTab /></TabsContent>
        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="cs" sectorLabel="Customer Success" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CsPage;
