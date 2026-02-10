import { Search, Download } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface FiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  competencia: string;
  onCompetenciaChange: (v: string) => void;
}

const BancoHorasFilters = ({ search, onSearchChange, competencia, onCompetenciaChange }: FiltersProps) => (
  <div className="flex flex-col sm:flex-row gap-2">
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        placeholder="Buscar por nome, cargo ou setor..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="pl-9 h-9 text-sm"
      />
    </div>
    <Input
      type="month"
      value={competencia}
      onChange={(e) => onCompetenciaChange(e.target.value)}
      className="w-full sm:w-40 h-9 text-sm"
    />
    <Button variant="outline" size="sm" className="h-9 shrink-0 text-xs">
      <Download className="h-3.5 w-3.5 mr-1" /> Exportar
    </Button>
  </div>
);

export default BancoHorasFilters;
