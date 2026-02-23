import React from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, formatTimeMins, isOverdue } from "./types";
import { Zap, Users, AlignLeft, Clock } from "lucide-react";

interface Props {
  job: Job;
  onClick: () => void;
  isDragging?: boolean;
}

const JobCard: React.FC<Props> = React.memo(({ job, onClick, isDragging }) => {
  const overdue = isOverdue(job.delivery_date);

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-lg border border-[#e5e7eb] p-3 cursor-pointer transition-all space-y-2 ${
        isDragging
          ? "shadow-xl ring-2 ring-[#1DB899] rotate-1 scale-[1.02]"
          : "hover:shadow-md hover:-translate-y-0.5"
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: overdue ? "#ef4444" : "transparent" }}
    >
      {/* Client name + urgent */}
      <div className="flex items-center justify-between gap-1">
        <p className="font-bold text-[13px] text-[#1a2332] truncate leading-tight">
          {job.client_name}
        </p>
        {job.urgent && <Zap className="h-4 w-4 text-amber-500 flex-shrink-0" />}
      </div>

      {/* Description */}
      <p className="text-[11px] text-[#6b7280] leading-tight line-clamp-1">{job.description}</p>

      {/* Date + code + value */}
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className={overdue ? "text-red-600 font-semibold" : "text-[#6b7280]"}>
            {formatDateBR(job.delivery_date)}
          </span>
        </div>
        <span className="font-mono text-[#6b7280]">J{job.code || job.id}</span>
      </div>

      <p className="text-[12px] font-semibold text-[#1a2332]">{formatBRL(job.value)}</p>

      {/* Footer: items | responsible | progress | time */}
      <div className="flex items-center gap-2 text-[10px] text-[#6b7280] border-t border-[#e5e7eb] pt-1.5">
        <span className="flex items-center gap-0.5">
          <AlignLeft className="h-3 w-3" /> {job.items_count}
        </span>
        {job.responsible.length > 0 && (
          <span className="flex items-center gap-0.5">
            <Users className="h-3 w-3" /> {job.responsible[0].name}
          </span>
        )}
        <span className="flex items-center gap-0.5 ml-auto">
          <Clock className="h-3 w-3" />
          {job.progress_percent}%
          <span className={`w-2 h-2 rounded-full ${job.progress_percent > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
          {formatTimeMins(job.time_spent_minutes)}
        </span>
      </div>
    </div>
  );
});

JobCard.displayName = "JobCard";
export default JobCard;
