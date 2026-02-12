import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import SectorDashboard from "@/components/gestao/SectorDashboard";
import SectorDados from "@/components/gestao/SectorDados";
import { Bot, LayoutDashboard, FileText } from "lucide-react";

interface GestaoSectorPageProps {
  sector: string;
  sectorLabel: string;
  icon: React.ElementType;
  description: string;
  children?: React.ReactNode;
}

const GestaoSectorPage = ({ sector, sectorLabel, icon: Icon, description, children }: GestaoSectorPageProps) => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">{sectorLabel}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList>
          <TabsTrigger value="dashboard" className="gap-1.5">
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <FileText className="h-4 w-4" /> Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="mt-4">
          <SectorDashboard sector={sector} sectorLabel={sectorLabel} />
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <AgentChat sector={sector} sectorLabel={sectorLabel} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          {children || <SectorDados sector={sector} sectorLabel={sectorLabel} />}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GestaoSectorPage;
