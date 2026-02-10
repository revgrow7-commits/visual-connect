import {
  Home,
  Newspaper,
  GraduationCap,
  Heart,
  BookOpen,
  Kanban,
  Award,
  ClipboardList,
  MapPin,
  UserPlus,
  Users,
  Clock,
  FileText,
  Megaphone,
  User,
  Settings,
  X,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
}

const mainNav = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Notícias", icon: Newspaper, path: "/noticias" },
  { label: "Onboarding", icon: GraduationCap, path: "/onboarding" },
  { label: "Benefícios", icon: Heart, path: "/beneficios" },
  { label: "Processos", icon: BookOpen, path: "/processos" },
  { label: "Kanban", icon: Kanban, path: "/kanban" },
  { label: "Faixa Preta", icon: Award, path: "/faixa-preta" },
  { label: "Questionários", icon: ClipboardList, path: "/questionarios" },
  { label: "Unidades", icon: MapPin, path: "/unidades" },
];

const rhNav = [
  { label: "Admissão", icon: UserPlus, path: "/rh/admissao" },
  { label: "Colaboradores", icon: Users, path: "/rh/colaboradores" },
  { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas" },
  { label: "Contratos", icon: FileText, path: "/rh/contratos" },
];

const extraNav = [
  { label: "Endomarketing", icon: Megaphone, path: "/endomarketing" },
  { label: "Meu Perfil", icon: User, path: "/perfil" },
  { label: "Admin", icon: Settings, path: "/admin" },
];

const SidebarNav = ({ open, onClose }: SidebarNavProps) => {
  const location = useLocation();

  const renderLink = (item: { label: string; icon: React.ElementType; path: string }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        <span>{item.label}</span>
      </NavLink>
    );
  };

  return (
    <>
      {/* Overlay mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-sidebar border-r border-sidebar-border overflow-y-auto transition-transform duration-300",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-1 p-4">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
            <button onClick={onClose}>
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-1">Principal</span>
          {mainNav.map(renderLink)}

          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1">RH</span>
          {rhNav.map(renderLink)}

          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 mt-4 mb-1">Mais</span>
          {extraNav.map(renderLink)}
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
