import {
  Heart,
  BookOpen,
  Kanban,
  Award,
  FileText,
  FolderOpen,
  GraduationCap,
  Clock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const atalhos = [
  { label: "Benefícios", icon: Heart, path: "/beneficios", color: "text-primary" },
  { label: "Processos", icon: BookOpen, path: "/processos", color: "text-info" },
  { label: "Kanban", icon: Kanban, path: "/kanban", color: "text-success" },
  { label: "Faixa Preta", icon: Award, path: "/faixa-preta", color: "text-warning" },
  { label: "Solicitações", icon: FileText, path: "/rh/admissao", color: "text-primary" },
  { label: "Documentos", icon: FolderOpen, path: "/perfil", color: "text-secondary" },
  { label: "Treinamentos", icon: GraduationCap, path: "/onboarding", color: "text-info" },
  { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas", color: "text-accent" },
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
            onClick={() => navigate(item.path)}
            className="flex flex-col items-center gap-2 p-3 bg-card rounded-lg shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5 group"
          >
            <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform">
              <item.icon className={`h-5 w-5 ${item.color}`} />
            </div>
            <span className="text-[11px] font-medium text-foreground text-center leading-tight">{item.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AtalhosRapidos;
