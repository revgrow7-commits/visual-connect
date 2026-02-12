import { memo, useState } from "react";
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
  ShieldAlert,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
}

const mainNav = [
  { label: "Home", icon: Home, path: "/", highlight: false },
  { label: "Notícias", icon: Newspaper, path: "/noticias", highlight: true, badge: "Novo" },
  { label: "Benefícios", icon: Heart, path: "/beneficios", highlight: true, badge: "VR/VA" },
  { label: "Unidades", icon: MapPin, path: "/unidades", highlight: false },
];

const gestaoNav = [
  { label: "Processos", icon: BookOpen, path: "/processos", highlight: false },
  { label: "Kanban", icon: Kanban, path: "/kanban", highlight: false },
  { label: "Questionários", icon: ClipboardList, path: "/questionarios", highlight: false },
  { label: "Faixa Preta", icon: Award, path: "/faixa-preta", highlight: false },
];

const rhNav = [
  { label: "Colaboradores", icon: Users, path: "/rh/colaboradores", highlight: false },
  { label: "Admissão", icon: UserPlus, path: "/rh/admissao", highlight: false },
  { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas", highlight: false },
  { label: "Contratos", icon: FileText, path: "/rh/contratos", highlight: false },
  { label: "Gerar Link", icon: Link2, path: "/rh/gerar-link", highlight: false },
];

const maisNav = [
  { label: "Onboarding", icon: GraduationCap, path: "/onboarding", highlight: false },
  { label: "Endomarketing", icon: Megaphone, path: "/endomarketing", highlight: true, badge: "Ação" },
  { label: "Ouvidoria", icon: ShieldAlert, path: "/ouvidoria", highlight: true, badge: "Canal" },
  { label: "Meu Perfil", icon: User, path: "/perfil", highlight: false },
  { label: "Admin", icon: Settings, path: "/admin", highlight: false },
];

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
  highlight?: boolean;
  badge?: string;
}

interface NavGroup {
  label: string;
  items: NavItem[];
  collapsible?: boolean;
}

const groups: NavGroup[] = [
  { label: "Principal", items: mainNav },
  { label: "Gestão", items: gestaoNav, collapsible: true },
  { label: "RH", items: rhNav, collapsible: true },
  { label: "Mais", items: maisNav, collapsible: true },
];

const SidebarNav = memo(({ open, onClose }: SidebarNavProps) => {
  const location = useLocation();

  // All groups open by default
  const getInitialOpen = () => {
    const openGroups: Record<string, boolean> = {};
    groups.forEach((g) => {
      if (g.collapsible) {
        openGroups[g.label] = true;
      }
    });
    return openGroups;
  };

  const [openGroups, setOpenGroups] = useState(getInitialOpen);

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderLink = (item: NavItem) => {
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
            : item.highlight
              ? "text-primary font-semibold hover:bg-primary/10"
              : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
        )}
      >
        <div className={cn(
          "flex items-center justify-center h-6 w-6 rounded-md shrink-0",
          item.highlight && !isActive && "bg-primary/10"
        )}>
          <item.icon className={cn("h-4 w-4 shrink-0", item.highlight && !isActive && "text-primary")} />
        </div>
        <span className="flex-1">{item.label}</span>
        {item.badge && (
          <span className={cn(
            "text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full leading-none",
            isActive
              ? "bg-sidebar-accent-foreground/20 text-sidebar-accent-foreground"
              : "bg-primary/15 text-primary"
          )}>
            {item.badge}
          </span>
        )}
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
});

SidebarNav.displayName = "SidebarNav";

export default SidebarNav;
