import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface KPIItem {
  label: string;
  value: string;
  badge: string;
  badgeColor: string;
  icon: LucideIcon;
}

interface FaturamentoKPIsProps {
  items: KPIItem[];
}

const FaturamentoKPIs = ({ items }: FaturamentoKPIsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="bg-card border shadow-sm">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <item.icon className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted-foreground truncate">{item.label}</p>
              <p className="text-lg font-bold text-foreground">{item.value}</p>
            </div>
            <span
              className={cn(
                "text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0",
                item.badgeColor
              )}
            >
              {item.badge}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default FaturamentoKPIs;
