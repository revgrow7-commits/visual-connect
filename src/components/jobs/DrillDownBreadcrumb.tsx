import React from "react";
import { ChevronRight, Home } from "lucide-react";

export interface DrillDownLevel {
  type: "board" | "stage" | "job" | "item";
  label: string;
  id?: string;
  color?: string;
}

interface Props {
  levels: DrillDownLevel[];
  onNavigate: (index: number) => void;
}

const DrillDownBreadcrumb: React.FC<Props> = ({ levels, onNavigate }) => {
  return (
    <nav className="flex items-center gap-1 px-6 py-2 bg-muted/30 border-b overflow-x-auto">
      {levels.map((level, idx) => {
        const isLast = idx === levels.length - 1;
        return (
          <React.Fragment key={`${level.type}-${idx}`}>
            {idx > 0 && <ChevronRight className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />}
            <button
              onClick={() => !isLast && onNavigate(idx)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors whitespace-nowrap ${
                isLast
                  ? "bg-primary/10 text-primary cursor-default"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground cursor-pointer"
              }`}
            >
              {idx === 0 && <Home className="h-3 w-3" />}
              {level.color && (
                <span
                  className="h-2.5 w-2.5 rounded-sm flex-shrink-0"
                  style={{ backgroundColor: level.color }}
                />
              )}
              {level.label}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
};

export default DrillDownBreadcrumb;
