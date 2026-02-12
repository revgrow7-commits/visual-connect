import { useAuth } from "@/contexts/AuthContext";
import ComunicadosFeed from "@/components/home/ComunicadosFeed";
import CartazesRecentes from "@/components/home/CartazesRecentes";
import AniversariantesWidget from "@/components/home/AniversariantesWidget";
import NovosColaboradores from "@/components/home/NovosColaboradores";
import AtalhosRapidos from "@/components/home/AtalhosRapidos";
import AniversarioBalloon from "@/components/home/AniversarioBalloon";
import logo from "@/assets/logo-industria-visual.png";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
};

const Index = () => {
  const { user } = useAuth();
  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Colaborador";

  const aniversariantesHoje = [
    { nome: "Ana Rodrigues", foto: "https://i.pravatar.cc/150?img=1" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <AniversarioBalloon aniversariantes={aniversariantesHoje} />
      {/* Hero Banner */}
      <div className="gradient-bordo rounded-2xl p-6 flex items-center gap-4">
        <img src={logo} alt="Indústria Visual" className="h-10 brightness-0 invert hidden sm:block" />
        <div>
          <h1 className="text-xl font-bold text-primary-foreground">
            {getGreeting()}, {displayName}! 👋
          </h1>
          <p className="text-sm text-primary-foreground/80 mt-0.5">
            Confira as novidades do portal da Indústria Visual
          </p>
        </div>
      </div>

      {/* Atalhos */}
      <AtalhosRapidos />

      {/* Grid principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComunicadosFeed />
          <CartazesRecentes />
        </div>
        <div className="space-y-6">
          <AniversariantesWidget />
          <NovosColaboradores />
        </div>
      </div>

      {/* Tagline */}
      <div className="gradient-bordo-light rounded-xl py-3 mt-4">
        <p className="text-center text-xs font-medium text-primary tracking-wide">
          C.R.I.E. &nbsp;Criar &bull; Relevância &bull; Inovação &bull; Eficiência
        </p>
      </div>
    </div>
  );
};

export default Index;
