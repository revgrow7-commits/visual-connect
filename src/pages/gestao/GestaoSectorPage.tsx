import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import { Bot, FileText } from "lucide-react";

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

      <Tabs defaultValue="agent" className="w-full">
        <TabsList>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
          <TabsTrigger value="dados" className="gap-1.5">
            <FileText className="h-4 w-4" /> Dados
          </TabsTrigger>
        </TabsList>

        <TabsContent value="agent" className="mt-4">
          <AgentChat sector={sector} sectorLabel={sectorLabel} />
        </TabsContent>

        <TabsContent value="dados" className="mt-4">
          {children || (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <FileText className="h-12 w-12 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                Dados e documentos de {sectorLabel} serão exibidos aqui.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Em breve: integração com Holdprint API e base RAG.
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GestaoSectorPage;
