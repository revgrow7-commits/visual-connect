import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, Bell, Settings, RefreshCw, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import CSWorkspaceSidebar from "@/components/cs/CSWorkspaceSidebar";
import CSResumoSection from "@/components/cs/CSResumoSection";
import HealthScoreTab from "@/components/cs/HealthScoreTab";
import EntregasTab from "@/components/cs/EntregasTab";
import CSReceitaSection from "@/components/cs/CSReceitaSection";
import ReclamacoesTab from "@/components/cs/ReclamacoesTab";
import VisitasTecnicasTab from "@/components/cs/VisitasTecnicasTab";
import ReguaRelacionamentoTab from "@/components/cs/ReguaRelacionamentoTab";
import OportunidadesTab from "@/components/cs/OportunidadesTab";
import CSPlaybooksSection from "@/components/cs/CSPlaybooksSection";
import CSRelatoriosSection from "@/components/cs/CSRelatoriosSection";
import CSClientesTab from "@/components/cs/CSClientesTab";
import CSMeetingDialog from "@/components/cs/CSMeetingDialog";
import AgentChat from "@/components/ai-agent/AgentChat";
import { useCSHoldprintData, transformToCSCustomers, transformToCSCustomersList } from "@/hooks/useCSHoldprintData";
import type { CSSectionId } from "@/components/cs/types";

const sectionTitles: Record<CSSectionId, string> = {
  resumo: "Resumo",
  clientes: "Clientes",
  health: "Health Score",
  entregas: "Entregas & Garantias",
  receita: "Receita",
  tickets: "Reclamações & SLA",
  visitas: "Visitas Técnicas",
  regua: "Régua de Relacionamento",
  upsell: "Oportunidades",
  playbooks: "Playbooks",
  relatorios: "Relatórios",
  pcp: "PCP (Kanban)",
  insider: "Insider AI (Holdprint)",
  agente: "Agente IA",
};

const CsPage = () => {
  const [activeSection, setActiveSection] = useState<CSSectionId>("resumo");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const { data: holdprintData, isLoading, isFetching, refetch, dataUpdatedAt } = useCSHoldprintData();

  const wsCustomers = holdprintData ? transformToCSCustomers(holdprintData) : null;
  const csCustomers = holdprintData ? transformToCSCustomersList(holdprintData) : null;

  const handleRefresh = async () => {
    toast.info("Sincronizando dados da Holdprint...");
    await refetch();
    toast.success("Dados atualizados!");
  };

  const lastSyncLabel = dataUpdatedAt
    ? `Sync: ${new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
    : holdprintData?.lastSync
      ? `Sync: ${new Date(holdprintData.lastSync).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
      : "Sem sync";

  const renderSection = () => {
    switch (activeSection) {
      case "resumo": return <CSResumoSection onNavigate={setActiveSection} holdprintData={holdprintData} wsCustomers={wsCustomers} isLoading={isLoading} />;
      case "clientes": return <CSClientesTab holdprintCustomers={csCustomers} wsCustomers={wsCustomers} holdprintJobs={holdprintData?.jobs} isLoading={isLoading} />;
      case "health": return <HealthScoreTab wsCustomers={wsCustomers} isLoading={isLoading} />;
      case "entregas": return <EntregasTab holdprintJobs={holdprintData?.jobs} isLoading={isLoading} />;
      case "receita": return <CSReceitaSection holdprintData={holdprintData} wsCustomers={wsCustomers} isLoading={isLoading} />;
      case "tickets": return <ReclamacoesTab />;
      case "visitas": return <VisitasTecnicasTab />;
      case "regua": return <ReguaRelacionamentoTab />;
      case "upsell": return <OportunidadesTab />;
      case "playbooks": return <CSPlaybooksSection />;
      case "relatorios": return <CSRelatoriosSection />;
      case "pcp": return (
        <div className="h-full w-full -m-4 md:-m-6">
          <iframe
            src="https://empflow-22.emergent.host/kanban"
            className="w-full h-[calc(100vh-var(--topbar-height)-6rem)] border-0 rounded-lg"
            title="PCP Kanban"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      );
      case "insider": return (
        <div className="h-full w-full -m-4 md:-m-6">
          <iframe
            src="https://app.holdprint.net/holdprint/insider-ai"
            className="w-full h-[calc(100vh-var(--topbar-height)-6rem)] border-0 rounded-lg"
            title="Holdprint Insider AI"
            allow="clipboard-read; clipboard-write"
          />
        </div>
      );
      case "agente": return <AgentChat sector="cs" sectorLabel="Customer Success" />;
      default: return null;
    }
  };

  return (
    <div className="flex h-[calc(100vh-var(--topbar-height)-2rem)] -mx-4 md:-mx-6 lg:-mx-8 -mt-4 md:-mt-6 lg:-mt-8 overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobile && mobileSidebarOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="w-60 flex-shrink-0 z-50">
            <CSWorkspaceSidebar activeSection={activeSection} onSectionChange={(s) => { setActiveSection(s); setMobileSidebarOpen(false); }} />
          </div>
          <div className="flex-1 bg-black/50" onClick={() => setMobileSidebarOpen(false)} />
        </div>
      )}

      {/* Desktop Sidebar */}
      {!isMobile && (
        <CSWorkspaceSidebar activeSection={activeSection} onSectionChange={setActiveSection} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="flex items-center gap-3 px-4 md:px-6 py-3 border-b bg-card flex-shrink-0">
          {isMobile && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setMobileSidebarOpen(true)}>
              <Menu className="h-4 w-4" />
            </Button>
          )}
          <h1 className="text-lg font-bold flex-1">{sectionTitles[activeSection]}</h1>
          <div className="flex items-center gap-2">
            {/* Last sync info */}
            <span className="text-[10px] text-muted-foreground hidden md:flex items-center gap-1">
              {isFetching && <Loader2 className="h-3 w-3 animate-spin" />}
              {lastSyncLabel}
              {holdprintData && ` • ${holdprintData.customers?.length || 0} clientes`}
            </span>
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={handleRefresh} disabled={isFetching} title="Atualizar dados Holdprint">
              <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
            </Button>
            <CSMeetingDialog />
            <span className="text-xs text-muted-foreground hidden md:block">Bom dia, Carlos</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 relative">
              <Bell className="h-4 w-4" />
              <Badge className="absolute -top-1 -right-1 h-4 min-w-4 p-0 flex items-center justify-center text-[9px] bg-red-500 text-white rounded-full">3</Badge>
            </Button>
            <Button size="icon" variant="ghost" className="h-8 w-8">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default CsPage;
