import React, { useState } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Menu, X, Bell, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import CSWorkspaceSidebar from "@/components/cs/CSWorkspaceSidebar";
import CSResumoSection from "@/components/cs/CSResumoSection";
import CSDashboardTab from "@/components/cs/CSDashboardTab";
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
import AgentChat from "@/components/ai-agent/AgentChat";
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
  agente: "Agente IA",
};

const CsPage = () => {
  const [activeSection, setActiveSection] = useState<CSSectionId>("resumo");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const renderSection = () => {
    switch (activeSection) {
      case "resumo": return <CSResumoSection onNavigate={setActiveSection} />;
      case "clientes": return <CSClientesTab />;
      case "health": return <HealthScoreTab />;
      case "entregas": return <EntregasTab />;
      case "receita": return <CSReceitaSection />;
      case "tickets": return <ReclamacoesTab />;
      case "visitas": return <VisitasTecnicasTab />;
      case "regua": return <ReguaRelacionamentoTab />;
      case "upsell": return <OportunidadesTab />;
      case "playbooks": return <CSPlaybooksSection />;
      case "relatorios": return <CSRelatoriosSection />;
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
