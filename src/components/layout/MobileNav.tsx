import { memo } from "react";
import { Home, BookOpen, Kanban, Users, User } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Processos", icon: BookOpen, path: "/processos" },
  { label: "Kanban", icon: Kanban, path: "/kanban" },
  { label: "RH", icon: Users, path: "/rh/colaboradores" },
  { label: "Perfil", icon: User, path: "/perfil" },
];

const MobileNav = memo(() => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card border-t border-border">
      <div className="flex items-center justify-around h-16">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors min-w-[3rem]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
});

MobileNav.displayName = "MobileNav";

export default MobileNav;
