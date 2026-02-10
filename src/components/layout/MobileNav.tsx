import { memo } from "react";
import { Home, Users, Kanban, User, Newspaper } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

const items = [
  { label: "Home", icon: Home, path: "/" },
  { label: "Notícias", icon: Newspaper, path: "/noticias" },
  { label: "Kanban", icon: Kanban, path: "/kanban" },
  { label: "RH", icon: Users, path: "/rh/colaboradores" },
  { label: "Perfil", icon: User, path: "/perfil" },
];

const MobileNav = memo(() => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 lg:hidden bg-card/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around h-14 max-w-md mx-auto">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-colors min-w-[3rem]",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-5 w-5", isActive && "scale-110")} />
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
