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
  Link2,
  Megaphone,
  User,
  Settings,
  X,
  ChevronDown,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
}

const mainNav = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Notícias", icon: Newspaper, path: "/noticias" },
  { label: "Benefícios", icon: Heart, path: "/beneficios" },
  { label: "Unidades", icon: MapPin, path: "/unidades" },
];

const gestaoNav = [
  { label: "Processos", icon: BookOpen, path: "/processos" },
  { label: "Kanban", icon: Kanban, path: "/kanban" },
  { label: "Questionários", icon: ClipboardList, path: "/questionarios" },
  { label: "Faixa Preta", icon: Award, path: "/faixa-preta" },
];

const rhNav = [
  { label: "Colaboradores", icon: Users, path: "/rh/colaboradores" },
  { label: "Admissão", icon: UserPlus, path: "/rh/admissao" },
  { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas" },
  { label: "Contratos", icon: FileText, path: "/rh/contratos" },
  { label: "Gerar Link", icon: Link2, path: "/rh/gerar-link" },
];

const maisNav = [
  { label: "Onboarding", icon: GraduationCap, path: "/onboarding" },
  { label: "Endomarketing", icon: Megaphone, path: "/endomarketing" },
  { label: "Meu Perfil", icon: User, path: "/perfil" },
  { label: "Admin", icon: Settings, path: "/admin" },
];

interface NavGroup {
  label: string;
  items: { label: string; icon: React.ElementType; path: string }[];
  collapsible?: boolean;
}

const groups: NavGroup[] = [
  { label: "Principal", items: mainNav },
  { label: "Gestão", items: gestaoNav, collapsible: true },
  { label: "RH", items: rhNav, collapsible: true },
  { label: "Mais", items: maisNav, collapsible: true },
];

const SidebarNav = ({ open, onClose }: SidebarNavProps) => {
  const location = useLocation();

  // Auto-expand groups that contain the active route
  const getInitialOpen = () => {
    const openGroups: Record<string, boolean> = {};
    groups.forEach((g) => {
      if (g.collapsible) {
        openGroups[g.label] = g.items.some((i) => location.pathname === i.path);
      }
    });
    return openGroups;
  };

  const [openGroups, setOpenGroups] = useState(getInitialOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLink = (item: { label: string; icon: React.ElementType; path: string }) => {
    const isActive = location.pathname === item.path;
    return (
      <NavLink
        key={item.path}
        to={item.path}
        onClick={onClose}
        className={cn(
          "flex items-center gap-2.5 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150",
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
      {open && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={cn(
          "fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-60 bg-sidebar border-r border-sidebar-border overflow-y-auto transition-transform duration-300 contain-paint",
          "lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col gap-0.5 p-3">
          <div className="flex items-center justify-between lg:hidden mb-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Menu</span>
            <button onClick={onClose} className="p-1 rounded hover:bg-muted">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          {groups.map((group) => {
            const isOpen = !group.collapsible || openGroups[group.label];
            return (
              <div key={group.label} className="mt-2 first:mt-0">
                {group.collapsible ? (
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="w-full flex items-center justify-between px-3 py-1.5 group"
                  >
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {group.label}
                    </span>
                    <ChevronDown
                      className={cn(
                        "h-3 w-3 text-muted-foreground/60 transition-transform duration-200",
                        isOpen && "rotate-180"
                      )}
                    />
                  </button>
                ) : (
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-3 py-1.5 block">
                    {group.label}
                  </span>
                )}
                {isOpen && (
                  <div className="flex flex-col gap-0.5">
                    {group.items.map(renderLink)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>
    </>
  );
};

export default SidebarNav;
