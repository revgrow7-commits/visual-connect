import {
  Heart, BookOpen, Award, Newspaper,
  FolderOpen, GraduationCap, Clock, Megaphone, ShieldAlert,
  ClipboardList, MessageSquarePlus, Briefcase,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const atalhos = [
  { label: "Notícias", icon: Newspaper, path: "/noticias" },
  { label: "Benefícios", icon: Heart, path: "/beneficios" },
  { label: "Processos", icon: BookOpen, path: "/processos" },
  { label: "Faixa Preta", icon: Award, path: "/faixa-preta" },
  { label: "Documentos", icon: FolderOpen, path: "/perfil" },
  { label: "Treinamentos", icon: GraduationCap, path: "/onboarding" },
  { label: "Endomarketing", icon: Megaphone, path: "/endomarketing" },
  { label: "Ouvidoria", icon: ShieldAlert, path: "/ouvidoria" },
  { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas" },
  { label: "Questionários", icon: ClipboardList, path: "/questionarios" },
  { label: "Vagas Internas", icon: Briefcase, path: "/rh/colaboradores" },
  { label: "Feedback PDI", icon: MessageSquarePlus, path: "https://empflow-22.emergent.host/create-feedback", external: true },
];

const AtalhosRapidos = () => {
  const navigate = useNavigate();

  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-3">Atalhos Rápidos</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
        {atalhos.map((item) => (
          <button
            key={item.path}
            onClick={() => item.external ? window.open(item.path, "_blank") : navigate(item.path)}
            className="flex flex-col items-center gap-2 p-3 bg-card rounded-xl shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="h-11 w-11 rounded-full gradient-bordo-light flex items-center justify-center group-hover:scale-110 transition-transform">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-[11px] font-medium text-foreground text-center leading-tight">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AtalhosRapidos;
