import React from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, formatTimeMins, isOverdue } from "./types";
import { Zap, Users, AlignLeft, Clock, Check, Ruler } from "lucide-react";
import type { FlexField } from "@/stores/boardsStore";

interface Props {
  job: Job;
  onClick: () => void;
  isDragging?: boolean;
  visibleFlexfields?: FlexField[];
  selectionMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: (jobId: string, e: React.MouseEvent) => void;
}

const JobCard: React.FC<Props> = React.memo(({ job, onClick, isDragging, visibleFlexfields, selectionMode, isSelected, onToggleSelect }) => {
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

  return (
    <div
      onClick={handleClick}
      className={`bg-white rounded-lg border p-3 cursor-pointer transition-all space-y-2 relative ${
        isDragging
          ? "shadow-xl ring-2 ring-[#1DB899] rotate-1 scale-[1.02]"
          : isSelected
          ? "shadow-md ring-2 ring-[#1DB899] bg-emerald-50/50"
          : "hover:shadow-md hover:-translate-y-0.5"
      } ${isSelected ? "border-[#1DB899]" : "border-[#e5e7eb]"}`}
      style={{ borderLeftWidth: 4, borderLeftColor: isSelected ? "#1DB899" : overdue ? "#ef4444" : "transparent" }}
    >
      {/* Selection checkbox */}
      {(selectionMode || isSelected) && (
        <div
          className={`absolute -top-1.5 -left-1.5 z-10 w-5 h-5 rounded-full flex items-center justify-center border-2 transition-colors ${
            isSelected
              ? "bg-[#1DB899] border-[#1DB899] text-white"
              : "bg-white border-[#d1d5db] hover:border-[#1DB899]"
          }`}
          onClick={(e) => { e.stopPropagation(); onToggleSelect?.(job.id, e); }}
        >
          {isSelected && <Check className="h-3 w-3" />}
        </div>
      )}

      {/* Client name + urgent + alert */}
      <div className="flex items-center justify-between gap-1">
        <p className="font-bold text-[13px] text-[#1a2332] truncate leading-tight">
          {job.client_name}
        </p>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[10px] bg-[#f0f2f5] text-[#6b7280] rounded px-1.5 py-0.5 font-medium whitespace-nowrap">
            {job.items_count} {job.items_count === 1 ? "item" : "itens"}
          </span>
          {job.has_alert && <span className="w-2 h-2 rounded-full bg-red-500" />}
          {job.urgent && <Zap className="h-4 w-4 text-amber-500" />}
        </div>
      </div>

      {/* Current item tag (green badge) */}
      {job.current_item_tag && (
        <span className="inline-block text-[10px] bg-emerald-100 text-emerald-700 rounded px-1.5 py-0.5 truncate max-w-full">
          {job.current_item_tag} ({job.items_count})
        </span>
      )}

      {/* Description */}
      <p className="text-[11px] text-[#6b7280] leading-tight line-clamp-1">{job.description}</p>

      {/* Flexfields visible on card */}
      {visibleFlexfields && visibleFlexfields.length > 0 && job.flexfields && (
        <div className="flex flex-wrap gap-1">
          {visibleFlexfields.map((ff) => {
            const val = job.flexfields?.[ff.key];
            if (val == null || val === "") return null;
            return (
              <span key={ff.key} className="text-[10px] bg-[#f0f2f5] text-[#6b7280] rounded px-1.5 py-0.5">
                {ff.label}: {String(val)}
              </span>
            );
          })}
        </div>
      )}

      {/* Date + code + value */}
      <div className="flex items-center justify-between text-[11px]">
        <span className={overdue ? "text-red-600 font-semibold" : "text-[#6b7280]"}>
          {formatDateBR(job.delivery_date)}
        </span>
        <span className="font-mono text-[#6b7280]">{job.job_number || `J${job.code || job.id}`}</span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[12px] font-semibold text-[#1a2332]">{formatBRL(job.value)}</p>
        {(job.total_m2 ?? 0) > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] text-[#6b7280] bg-[#f0f2f5] rounded px-1.5 py-0.5 font-medium">
            <Ruler className="h-3 w-3" />
            {job.total_m2?.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} m²
          </span>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center gap-2 text-[10px] text-[#6b7280] border-t border-[#e5e7eb] pt-1.5">
        <span className="flex items-center gap-0.5"><AlignLeft className="h-3 w-3" /> {job.items_count}</span>
        {job.responsible.length > 0 && (
          <span className="flex items-center gap-0.5"><Users className="h-3 w-3" /> {job.responsible[0].name}</span>
        )}
        <span className="flex items-center gap-0.5 ml-auto">
          <Clock className="h-3 w-3" />
          {job.progress_percent}%
          <span className={`w-2 h-2 rounded-full ${job.progress_percent > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
          {job.time_tracked || formatTimeMins(job.time_spent_minutes)}
        </span>
      </div>
    </div>
  );
});

JobCard.displayName = "JobCard";
export default JobCard;
