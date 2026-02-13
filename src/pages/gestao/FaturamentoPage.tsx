import { Receipt, Bot, FileText, Wallet } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import AgentChat from "@/components/ai-agent/AgentChat";
import ContasPagarTab from "@/components/faturamento/ContasPagarTab";
import ContasReceberTab from "@/components/faturamento/ContasReceberTab";

const FaturamentoPage = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Receipt className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">Faturamento</h1>
          <p className="text-sm text-muted-foreground">
            Notas fiscais, contas a pagar/receber e controle de faturamento.
          </p>
        </div>
      </div>

      <Tabs defaultValue="pagar" className="w-full">
        <TabsList>
          <TabsTrigger value="pagar" className="gap-1.5">
            <FileText className="h-4 w-4" /> Contas a Pagar
          </TabsTrigger>
          <TabsTrigger value="receber" className="gap-1.5">
            <Wallet className="h-4 w-4" /> Contas a Receber
          </TabsTrigger>
          <TabsTrigger value="agent" className="gap-1.5">
            <Bot className="h-4 w-4" /> Agente IA
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pagar" className="mt-4">
          <ContasPagarTab />
        </TabsContent>

        <TabsContent value="receber" className="mt-4">
          <ContasReceberTab />
        </TabsContent>

        <TabsContent value="agent" className="mt-4">
          <AgentChat sector="faturamento" sectorLabel="Faturamento" />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FaturamentoPage;
