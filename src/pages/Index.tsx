import ComunicadosFeed from "@/components/home/ComunicadosFeed";
import AniversariantesWidget from "@/components/home/AniversariantesWidget";
import NovosColaboradores from "@/components/home/NovosColaboradores";
import AtalhosRapidos from "@/components/home/AtalhosRapidos";

const Index = () => {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Bom dia, João! 👋</h1>
        <p className="text-sm text-muted-foreground mt-1">Confira as novidades do portal da Indústria Visual</p>
      </div>

      {/* Atalhos */}
      <AtalhosRapidos />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feed - 2 colunas */}
        <div className="lg:col-span-2">
          <ComunicadosFeed />
        </div>

        {/* Sidebar direita */}
        <div className="space-y-6">
          <AniversariantesWidget />
          <NovosColaboradores />
        </div>
      </div>
    </div>
  );
};

export default Index;
