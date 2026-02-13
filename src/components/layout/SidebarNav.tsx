import { memo, useState } from "react";
import {
  Home, Newspaper, Heart, MapPin,
  BookOpen, Kanban, ClipboardList, Award,
  Users, UserPlus, Clock, FileText, Link2,
  GraduationCap, Megaphone, ShieldAlert, User, Settings,
  X, ChevronDown,
  Factory, TrendingUp, ShoppingCart, Wallet, Receipt,
  Calculator, Landmark, HeadphonesIcon, Scale, Brain,
} from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

interface SidebarNavProps {
  open: boolean;
  onClose: () => void;
}

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
  {
    label: "Principal",
    items: [
      { label: "Home", icon: Home, path: "/" },
      { label: "Notícias", icon: Newspaper, path: "/noticias", highlight: true, badge: "Novo" },
      { label: "Benefícios", icon: Heart, path: "/beneficios", highlight: true, badge: "VR/VA" },
      { label: "Unidades", icon: MapPin, path: "/unidades" },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Operação", icon: Factory, path: "/gestao/operacao", highlight: true, badge: "IA" },
      { label: "Comercial", icon: TrendingUp, path: "/gestao/comercial", highlight: true, badge: "IA" },
      { label: "Compras", icon: ShoppingCart, path: "/gestao/compras" },
      { label: "Financeiro", icon: Wallet, path: "/gestao/financeiro" },
      { label: "Faturamento", icon: Receipt, path: "/gestao/faturamento" },
      { label: "Contábil", icon: Calculator, path: "/gestao/contabil" },
      { label: "Fiscal", icon: Landmark, path: "/gestao/fiscal" },
      { label: "Marketing", icon: Megaphone, path: "/gestao/marketing" },
      { label: "CS", icon: HeadphonesIcon, path: "/gestao/cs" },
      { label: "Jurídico", icon: Scale, path: "/gestao/juridico" },
      { label: "Processos", icon: BookOpen, path: "/processos" },
      { label: "Kanban", icon: Kanban, path: "/kanban" },
      { label: "Questionários", icon: ClipboardList, path: "/questionarios" },
      { label: "Faixa Preta", icon: Award, path: "/faixa-preta" },
    ],
    collapsible: true,
  },
  {
    label: "RH",
    items: [
      { label: "Colaboradores", icon: Users, path: "/rh/colaboradores" },
      { label: "Admissão", icon: UserPlus, path: "/rh/admissao" },
      { label: "Banco de Horas", icon: Clock, path: "/rh/banco-horas" },
      { label: "Contratos", icon: FileText, path: "/rh/contratos" },
      { label: "Gerar Link", icon: Link2, path: "/rh/gerar-link" },
    ],
    collapsible: true,
  },
  {
    label: "Mais",
    items: [
      { label: "Onboarding", icon: GraduationCap, path: "/onboarding" },
      { label: "Endomarketing", icon: Megaphone, path: "/endomarketing", highlight: true, badge: "Ação" },
      { label: "Ouvidoria", icon: ShieldAlert, path: "/ouvidoria", highlight: true, badge: "Canal" },
      { label: "Meu Perfil", icon: User, path: "/perfil" },
      { label: "Orquestrador", icon: Brain, path: "/orquestrador", highlight: true, badge: "IA" },
      { label: "Admin", icon: Settings, path: "/admin" },
    ],
    collapsible: true,
  },
];

const SidebarNav = memo(({ open, onClose }: SidebarNavProps) => {
  const location = useLocation();

  const getInitialOpen = () => {
    const openGroups: Record<string, boolean> = {};
    groups.forEach((g) => {
      if (g.collapsible) {
        // Open Gestão by default if on a gestao route
        openGroups[g.label] = g.label === "Gestão"
          ? location.pathname.startsWith("/gestao")
          : true;
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
