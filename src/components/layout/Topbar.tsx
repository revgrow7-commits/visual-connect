import { Bell, Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";

interface TopbarProps {
  onToggleSidebar: () => void;
}

const Topbar = ({ onToggleSidebar }: TopbarProps) => {
  const [notifications] = useState(3);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 border-b border-border bg-card flex items-center px-4 gap-4">
      <Button
        variant="ghost"
        size="icon"
        onClick={onToggleSidebar}
        className="lg:hidden"
      >
        <Menu className="h-5 w-5" />
      </Button>

      <div className="flex items-center gap-3 min-w-0">
        <div className="gradient-bordo rounded-lg p-1.5 flex items-center justify-center">
          <span className="text-primary-foreground font-bold text-sm tracking-tight">IV</span>
        </div>
        <div className="hidden sm:block">
          <h1 className="text-sm font-bold text-foreground leading-none">INDÚSTRIA VISUAL</h1>
          <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Portal Intranet</p>
        </div>
      </div>

      <div className="flex-1 max-w-md mx-auto hidden md:block">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar no portal..."
            className="pl-9 bg-muted border-none h-9 text-sm"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {notifications > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
              {notifications}
            </span>
          )}
        </Button>

        <div className="h-8 w-8 rounded-full gradient-bordo flex items-center justify-center">
          <span className="text-primary-foreground text-xs font-semibold">JC</span>
        </div>
      </div>
    </header>
  );
};

export default Topbar;
