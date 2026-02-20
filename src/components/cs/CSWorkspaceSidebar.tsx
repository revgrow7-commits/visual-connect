import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BarChart3, Users, Heart, Package, DollarSign,
  MessageSquare, Wrench, Calendar, Lightbulb,
  ClipboardList, LineChart, Bot, Target, Eye,
  AlertTriangle, Trophy, Plus, Kanban
} from "lucide-react";
import type { CSSectionId } from "./types";

interface Props {
  activeSection: CSSectionId;
  onSectionChange: (section: CSSectionId) => void;
}

const sections: Array<{ id: CSSectionId; label: string; icon: React.ElementType; badge?: number }> = [
  { id: "resumo", label: "Resumo", icon: BarChart3 },
  { id: "clientes", label: "Clientes", icon: Users },
  { id: "health", label: "Health Score", icon: Heart },
  { id: "entregas", label: "Entregas & Garantias", icon: Package },
  { id: "receita", label: "Receita", icon: DollarSign },
  { id: "tickets", label: "Tickets", icon: MessageSquare, badge: 4 },
  { id: "visitas", label: "Visitas Técnicas", icon: Wrench },
  { id: "regua", label: "Régua", icon: Calendar },
  { id: "upsell", label: "Oportunidades", icon: Lightbulb },
  { id: "playbooks", label: "Playbooks", icon: ClipboardList },
  { id: "relatorios", label: "Relatórios", icon: LineChart },
  { id: "pcp", label: "PCP (Kanban)", icon: Kanban },
  { id: "insider", label: "Insider AI", icon: Lightbulb },
  { id: "agente", label: "Agente IA", icon: Bot },
];

const savedViews = [
  { label: "Meus clientes", icon: Eye },
  { label: "Em risco", icon: AlertTriangle },
  { label: "Top 10", icon: Trophy },
];

const CSWorkspaceSidebar: React.FC<Props> = ({ activeSection, onSectionChange }) => {
  return (
    <aside className="w-60 bg-[#1A1A1A] text-white flex-shrink-0 flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary/20 flex items-center justify-center">
          <Target className="h-4 w-4 text-primary" />
        </div>
        <span className="font-bold text-sm">CS Workspace</span>
      </div>

      <Separator className="bg-white/10 mx-3" />

      {/* Sections */}
      <nav className="flex-1 py-2 px-2 space-y-0.5">
        <p className="text-[10px] uppercase tracking-wider text-white/40 px-2 pt-2 pb-1">Seções</p>
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => onSectionChange(s.id)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition-colors",
              activeSection === s.id
                ? "bg-primary/10 text-white border-l-[3px] border-l-primary"
                : "text-white/70 hover:bg-white/5 border-l-[3px] border-l-transparent"
            )}
          >
            <s.icon className="h-[18px] w-[18px] flex-shrink-0" />
            <span className="flex-1 text-left truncate">{s.label}</span>
            {s.badge && s.badge > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] h-5 min-w-5 flex items-center justify-center rounded-full p-0">{s.badge}</Badge>
            )}
          </button>
        ))}
      </nav>

      <Separator className="bg-white/10 mx-3" />

      {/* Saved Views */}
      <div className="py-2 px-2">
        <p className="text-[10px] uppercase tracking-wider text-white/40 px-2 pt-1 pb-1">Views Salvas</p>
        {savedViews.map((v) => (
          <button key={v.label} className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/50 hover:text-white/80 hover:bg-white/5 rounded-md transition-colors">
            <v.icon className="h-3.5 w-3.5" />
            <span>{v.label}</span>
          </button>
        ))}
        <button className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-white/30 hover:text-white/60 hover:bg-white/5 rounded-md transition-colors">
          <Plus className="h-3.5 w-3.5" />
          <span>Criar view</span>
        </button>
      </div>

      {/* Footer */}
      <div className="px-3 py-3 text-[10px] text-white/30 border-t border-white/10">
        Última sync: há 2h &middot; 42 clientes &middot; 4 alertas
      </div>
    </aside>
  );
};

export default CSWorkspaceSidebar;
