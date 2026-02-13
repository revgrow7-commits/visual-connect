import { Factory, Kanban, BarChart3, FileText, Bot, FolderOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import SectorDados from "@/components/gestao/SectorDados";
import KanbanBoard from "@/components/operacao/KanbanBoard";
import OperacaoDashboard from "@/components/operacao/OperacaoDashboard";
import JobsTable from "@/components/operacao/JobsTable";

const OperacaoPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Factory className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Operação</h1>
          <p className="text-sm text-muted-foreground">Kanban de produção, tasks, progresso, custos realizados e feedstocks.</p>
        </div>
      </div>

      <Tabs defaultValue="kanban" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="kanban" className="gap-1.5">
            <Kanban className="h-4 w-4" /> Kanban
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <BarChart3 className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="jobs" className="gap-1.5">
            <FileText className="h-4 w-4" /> Jobs
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <FolderOpen className="h-4 w-4" /> Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="kanban" className="mt-4">
          <KanbanBoard />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-4">
          <OperacaoDashboard />
        </TabsContent>

        <TabsContent value="jobs" className="mt-4">
          <JobsTable />
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="operacao" sectorLabel="Operação" />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          <SectorDados sector="operacao" sectorLabel="Operação" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperacaoPage;
