import React, { useState, useEffect } from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, formatTimeMins, isOverdue } from "./types";
import { Zap, Users, Clock, Check, Ruler, Archive, Trash2, CalendarClock, LayoutGrid, Timer, Tag, GitFork } from "lucide-react";
import type { FlexField } from "@/stores/boardsStore";

export interface JobAssignmentBadge {
  board_name: string;
  board_id: string;
  board_color?: string;
  stage_name: string | null;
  item_name?: string | null;
}

export interface JobCollabBadge {
  collaborator_name: string;
  item_name: string;
}

export interface JobEquipmentBadge {
  equipment: string;
  started_at: string;
  board_name: string | null;
  stage_name: string | null;
}

export interface JobEtiquetaBadge {
  id: string;
  nome: string;
  cor: string;
}

interface Props {
  job: Job;
  onClick: () => void;
  isDragging?: boolean;
  visibleFlexfields?: FlexField[];
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (jobId: string, e: React.MouseEvent) => void;
  onArchive?: (jobId: string) => void;
  onDelete?: (jobId: string) => void;
  boardAssignments?: JobAssignmentBadge[];
  collabAssignments?: JobCollabBadge[];
  equipmentAssignments?: JobEquipmentBadge[];
  etiquetas?: JobEtiquetaBadge[];
}

// Live timer badge for equipment on cards — update every 30s to reduce re-renders
const CardEquipmentBadge: React.FC<{ eq: JobEquipmentBadge }> = React.memo(({ eq }) => {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    const start = new Date(eq.started_at).getTime();
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000));
    tick();
    const interval = setInterval(tick, 30_000);
    return () => clearInterval(interval);
  }, [eq.started_at]);
  const h = Math.floor(elapsed / 3600);
  const m = Math.floor((elapsed % 3600) / 60);
  const timeStr = `${String(h).padStart(2, "0")}h${String(m).padStart(2, "0")}m`;
  return (
    <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded px-1.5 py-0.5 animate-pulse">
      <Timer className="h-2.5 w-2.5" />
      {eq.equipment.length > 15 ? eq.equipment.substring(0, 15) + "…" : eq.equipment}
      <span className="font-mono ml-0.5">{timeStr}</span>
      {eq.board_name && <span className="opacity-60 ml-0.5">| {eq.stage_name || eq.board_name}</span>}
    </span>
  );
});

const ETIQUETA_BG_MAP: Record<string, string> = {
  green: "#22c55e", yellow: "#facc15", orange: "#f97316", red: "#ef4444",
  purple: "#a855f7", blue: "#3b82f6", sky: "#38bdf8", lime: "#84cc16",
  pink: "#ec4899", black: "#1f2937",
};

const JobCard: React.FC<Props> = React.memo(({ job, onClick, isDragging, visibleFlexfields, selectionMode, isSelected, onToggleSelect, onArchive, onDelete, boardAssignments, collabAssignments, equipmentAssignments, etiquetas }) => {
  const overdue = isOverdue(job.delivery_date);

  const handleClick = (e: React.MouseEvent) => {
    if (selectionMode && onToggleSelect) {
      e.stopPropagation();
      onToggleSelect(job.id, e);
    } else if (e.ctrlKey || e.metaKey) {
      e.stopPropagation();
      onToggleSelect?.(job.id, e);
    } else {
      onClick();
    }
  };

  const deliveryDateFormatted = job.delivery_date
    ? new Date(job.delivery_date).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })
    : "";

  return (
    <div
      onClick={handleClick}
      className={`group relative rounded-xl border cursor-pointer transition-all duration-200 overflow-hidden ${
        isDragging
          ? "shadow-2xl ring-2 ring-emerald-400/60 rotate-1 scale-[1.03]"
          : isSelected
          ? "shadow-lg ring-2 ring-emerald-400/60"
          : "hover:shadow-xl hover:-translate-y-0.5 hover:border-[#3a3f4b]"
      }`}
      style={{
        background: isSelected
          ? "linear-gradient(135deg, #1a2e28 0%, #1c2936 100%)"
          : "linear-gradient(135deg, #1e2330 0%, #242938 50%, #1a1f2e 100%)",
        borderColor: isSelected ? "#10b981" : isDragging ? "#10b981" : "#2a2f3d",
        borderLeftWidth: 4,
        borderLeftColor: isSelected ? "#10b981" : overdue ? "#ef4444" : job.urgent ? "#f59e0b" : "#3b82f6",
      }}
    >
      {/* Selection indicator */}
      {(selectionMode || isSelected) && (
        <div
          className={`absolute -top-1.5 -left-1.5 z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
            isSelected
              ? "bg-white border-white text-emerald-600 shadow-lg shadow-white/40 scale-110 ring-2 ring-white/30"
              : "bg-white/90 border-white/80 hover:border-white hover:scale-110"
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(job.id, e); }}
        >
          {isSelected && <Check className="h-3.5 w-3.5" />}
        </div>
      )}

      <div className="p-3.5 space-y-2.5">
        {/* Header: Job number + unit + status */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-rose-300 bg-gradient-to-r from-rose-500/25 to-rose-600/15 border border-rose-400/40 rounded-md px-2.5 py-1 shadow-sm shadow-rose-500/20 ring-1 ring-rose-500/10">
              # {job.code || job.id.substring(0, 6)}
            </span>
            {job._unit_key && (
              <span className="text-[10px] font-semibold text-sky-300 bg-sky-500/10 rounded px-1.5 py-0.5 uppercase tracking-wider">
                {job._unit_key === "poa" ? "POA" : "SP"}
              </span>
            )}
            {boardAssignments && boardAssignments.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-violet-300 bg-violet-500/15 border border-violet-400/30 rounded-md px-1.5 py-0.5 shadow-sm shadow-violet-500/20 animate-pulse" title={`Espelhado em ${boardAssignments.length} board(s)`}>
                <GitFork className="h-3 w-3" />
                {boardAssignments.length}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {job.urgent && (
              <span className="flex items-center gap-0.5 text-[10px] font-semibold text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded px-1.5 py-0.5">
                <Zap className="h-3 w-3" /> URGENTE
              </span>
            )}
            {job.has_alert && <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-lg shadow-red-500/40" />}
          </div>
        </div>

        {/* Title / Description */}
        <p className="text-[13px] font-semibold text-gray-100 leading-tight line-clamp-2 tracking-tight">
          {job.description || job.title || "Sem título"}
        </p>

        {/* Etiquetas */}
        {etiquetas && etiquetas.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {etiquetas.map((et) => (
              <span
                key={et.id}
                className="inline-flex items-center gap-0.5 text-[10px] font-bold text-white rounded px-2 py-0.5 shadow-sm"
                style={{ backgroundColor: ETIQUETA_BG_MAP[et.cor] || "#6b7280" }}
              >
                {et.nome}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
          <Users className="h-3 w-3 text-gray-500 flex-shrink-0" />
          <span className="truncate">{job.client_name}</span>
        </div>

        {/* Delivery date */}
        {job.delivery_date && (
          <div className="flex items-center gap-1.5">
            <CalendarClock className={`h-3 w-3 flex-shrink-0 ${overdue ? "text-red-400" : "text-gray-500"}`} />
            <span className={`text-[11px] font-medium ${overdue ? "text-red-400" : "text-gray-400"}`}>
              PREVISÃO DE ENTREGA
            </span>
            <span className={`text-[11px] font-bold ml-auto ${overdue ? "text-red-400" : "text-gray-300"}`}>
              {deliveryDateFormatted}
            </span>
          </div>
        )}

        {/* Flexfields */}
        {visibleFlexfields && visibleFlexfields.length > 0 && job.flexfields && (
          <div className="flex flex-wrap gap-1">
            {visibleFlexfields.map((ff) => {
              const val = job.flexfields?.[ff.key];
              if (val == null || val === "") return null;
              return (
                <span key={ff.key} className="text-[10px] bg-[#2a3040] text-gray-400 rounded px-1.5 py-0.5 border border-[#3a3f4b]">
                  {ff.label}: {String(val)}
                </span>
              );
            })}
          </div>
        )}

        {/* Board & Collaborator & Equipment assignment badges */}
        {((boardAssignments && boardAssignments.length > 0) || (collabAssignments && collabAssignments.length > 0) || (equipmentAssignments && equipmentAssignments.length > 0)) && (
          <div className="flex flex-wrap gap-1">
            {boardAssignments?.map((a, i) => (
              <span
                key={`ba-${i}`}
                className="inline-flex items-center gap-0.5 text-[9px] font-semibold text-white rounded px-1.5 py-0.5"
                style={{ backgroundColor: a.board_color || "#6366f1" }}
              >
                <LayoutGrid className="h-2.5 w-2.5" />
                {a.stage_name ? `${a.stage_name}` : a.board_name}
                {a.item_name && <span className="opacity-75 ml-0.5">({a.item_name})</span>}
              </span>
            ))}
            {collabAssignments && collabAssignments.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-sky-500/20 text-sky-300 border border-sky-500/30 rounded px-1.5 py-0.5">
                <Users className="h-2.5 w-2.5" />
                {collabAssignments.length <= 2
                  ? [...new Set(collabAssignments.map(c => c.collaborator_name))].join(", ")
                  : `${collabAssignments[0].collaborator_name} +${new Set(collabAssignments.map(c => c.collaborator_name)).size - 1}`
                }
              </span>
            )}
            {equipmentAssignments?.map((eq, i) => (
              <CardEquipmentBadge key={`eq-${i}`} eq={eq} />
            ))}
          </div>
        )}

        {/* Value + m² */}
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-emerald-400">{formatBRL(job.value)}</p>
          {(job.total_m2 ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-md px-2 py-0.5 font-semibold">
              <Ruler className="h-3 w-3" />
              {job.total_m2?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²
            </span>
          )}
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 rounded-full bg-[#2a3040] overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                job.progress_percent >= 100 ? "bg-emerald-500" :
                job.progress_percent > 50 ? "bg-sky-500" :
                job.progress_percent > 0 ? "bg-amber-500" : "bg-gray-600"
              }`}
              style={{ width: `${Math.min(job.progress_percent, 100)}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-gray-300 tabular-nums w-8 text-right">
            {job.progress_percent}%
          </span>
        </div>

        {/* Footer: Actions */}
        <div className="flex items-center gap-1.5 pt-1.5 border-t border-[#2a3040]">
          <span className="flex items-center gap-0.5 text-[10px] text-gray-500">
            <Clock className="h-3 w-3" />
            {job.time_tracked || formatTimeMins(job.time_spent_minutes)}
          </span>
          {job.responsible.length > 0 && (
            <span className="text-[10px] text-gray-500 truncate max-w-[80px]">
              {job.responsible[0].name}
            </span>
          )}
          <span className="text-[10px] text-gray-600 bg-[#2a3040] rounded px-1.5 py-0.5">
            {job.items_count} {job.items_count === 1 ? "item" : "itens"}
          </span>
          <div className="ml-auto flex items-center gap-0.5">
            {onArchive && (
              <button
                onClick={(e) => { e.stopPropagation(); onArchive(job.id); }}
                className="p-1.5 rounded-md hover:bg-amber-500/10 text-amber-500/60 hover:text-amber-400 transition-colors"
                title="Arquivar"
              >
                <Archive className="h-3.5 w-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(job.id); }}
                className="p-1.5 rounded-md hover:bg-red-500/10 text-red-500/60 hover:text-red-400 transition-colors"
                title="Excluir"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

JobCard.displayName = "JobCard";
export default JobCard;
