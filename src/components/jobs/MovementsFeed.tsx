import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRight, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Movement {
  id: string;
  job_id: string;
  job_code: number | null;
  job_title: string | null;
  customer_name: string | null;
  from_stage_name: string | null;
  to_stage_name: string;
  moved_by: string | null;
  movement_type: string;
  created_at: string;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

const MovementsFeed: React.FC<{ maxItems?: number }> = ({ maxItems = 8 }) => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [expanded, setExpanded] = useState(false);

  const fetchMovements = async () => {
    const { data } = await supabase
      .from("job_stage_movements")
      .select("id, job_id, job_code, job_title, customer_name, from_stage_name, to_stage_name, moved_by, movement_type, created_at")
      .order("created_at", { ascending: false })
      .limit(maxItems);
    if (data) setMovements(data);
  };

  useEffect(() => {
    fetchMovements();

    const channel = supabase
      .channel("movements-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "job_stage_movements" }, (payload) => {
        setMovements((prev) => [payload.new as Movement, ...prev].slice(0, maxItems));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [maxItems]);

  if (movements.length === 0) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 transition-colors rounded-t-lg"
      >
        <div className="flex items-center gap-2">
          <RefreshCw className="h-3.5 w-3.5 text-blue-500" />
          <span className="text-xs font-semibold text-gray-700">Movimentações Recentes</span>
          <Badge variant="secondary" className="text-[10px] h-4 px-1.5">{movements.length}</Badge>
        </div>
        {expanded ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}
      </button>

      {expanded && (
        <div className="px-3 pb-2 space-y-1 max-h-[200px] overflow-y-auto">
          {movements.map((m) => (
            <div key={m.id} className="flex items-center gap-1.5 text-[11px] py-1 border-b border-gray-100 last:border-0">
              <span className="font-mono font-semibold text-blue-600 shrink-0">
                {m.job_code ? `J${m.job_code}` : m.job_id.slice(0, 8)}
              </span>
              <span className="text-gray-400 truncate max-w-[80px]" title={m.from_stage_name || ""}>
                {m.from_stage_name || "—"}
              </span>
              <ArrowRight className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="text-gray-700 font-medium truncate max-w-[80px]" title={m.to_stage_name}>
                {m.to_stage_name}
              </span>
              <span className="text-gray-300 ml-auto shrink-0">{timeAgo(m.created_at)}</span>
              {m.movement_type === "holdprint_sync" && (
                <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-blue-200 text-blue-500">sync</Badge>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MovementsFeed;
