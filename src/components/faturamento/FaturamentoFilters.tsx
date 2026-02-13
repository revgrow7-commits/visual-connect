import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
}

interface FilterSelectConfig {
  label: string;
  placeholder: string;
  options: FilterOption[];
  value: string;
  onChange: (v: string) => void;
}

interface FaturamentoFiltersProps {
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (v: string) => void;
  onDateToChange: (v: string) => void;
  search: string;
  onSearchChange: (v: string) => void;
  selects: FilterSelectConfig[];
  onFilter: () => void;
}

const FaturamentoFilters = ({
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  search,
  onSearchChange,
  selects,
  onFilter,
}: FaturamentoFiltersProps) => {
  return (
    <div className="flex flex-wrap items-end gap-3 p-4 bg-card border rounded-lg shadow-sm">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">De</label>
        <Input type="date" value={dateFrom} onChange={(e) => onDateFromChange(e.target.value)} className="w-36" />
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs text-muted-foreground">Até</label>
        <Input type="date" value={dateTo} onChange={(e) => onDateToChange(e.target.value)} className="w-36" />
      </div>
      {selects.map((s) => (
        <div key={s.label} className="flex flex-col gap-1">
          <label className="text-xs text-muted-foreground">{s.label}</label>
          <Select value={s.value} onValueChange={s.onChange}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder={s.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {s.options.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
      <div className="flex flex-col gap-1 flex-1 min-w-[200px]">
        <label className="text-xs text-muted-foreground">Buscar</label>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por descrição, fornecedor..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>
      <Button onClick={onFilter} className="gap-1.5">
        <Filter className="h-4 w-4" /> Filtrar
      </Button>
    </div>
  );
};

export default FaturamentoFilters;
