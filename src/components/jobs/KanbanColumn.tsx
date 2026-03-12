import React, { useCallback } from "react";
import { Droppable, Draggable } from "@hello-pangea/dnd";
import { Badge } from "@/components/ui/badge";
import { formatBRL } from "./types";
import type { Job, JobsByStage } from "./types";
import type { FlexField } from "@/stores/boardsStore";
import JobCard from "./JobCard";
import type { JobAssignmentBadge, JobCollabBadge, JobEquipmentBadge, JobEtiquetaBadge } from "./JobCard";

interface KanbanColumnProps {
  col: JobsByStage;
  selectionMode: boolean;
  selectedJobIds: Set<string>;
  visibleFlexfields: FlexField[];
  onDrillDownToStage: (stageId: string) => void;
  onDrillDownToJob: (job: Job) => void;
  onToggleSelect: (jobId: string, e: React.MouseEvent) => void;
  onArchive: (job: Job) => void;
  onDelete: (jobId: string) => void;
  boardAssignmentsByJob: Map<string, JobAssignmentBadge[]>;
  collabAssignmentsByJob: Map<string, JobCollabBadge[]>;
  equipmentByJob: Map<string, JobEquipmentBadge[]>;
  etiquetasByJob: Map<string, JobEtiquetaBadge[]>;
}

const KanbanColumn: React.FC<KanbanColumnProps> = React.memo(({
  col,
  selectionMode,
  selectedJobIds,
  visibleFlexfields,
  onDrillDownToStage,
  onDrillDownToJob,
  onToggleSelect,
  onArchive,
  onDelete,
  boardAssignmentsByJob,
  collabAssignmentsByJob,
  equipmentByJob,
  etiquetasByJob,
}) => {
  const handleArchive = useCallback((id: string) => {
    const j = col.jobs.find(j => j.id === id);
    if (j) onArchive(j);
  }, [col.jobs, onArchive]);

  return (
    <div className="min-w-[220px] flex-1 max-w-[260px] flex flex-col">
      {/* Column header */}
      <div
        onClick={() => onDrillDownToStage(col.stage.id)}
        className="bg-[#161b26] rounded-t-xl p-3 border border-[#2a2f3d] border-b-0 cursor-pointer hover:bg-[#1e2330] transition-colors group"
        style={{ borderTopWidth: 3, borderTopColor: col.stage.color }}
      >
        <div className="flex items-center justify-between">
          <p className="font-bold text-xs text-gray-200 group-hover:text-gray-100 transition-colors truncate">{col.stage.name}</p>
          <Badge className="text-[10px] text-white font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: col.stage.color }}>
            {col.jobs.length}
          </Badge>
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5 font-medium">{formatBRL(col.totalValue)}</p>
      </div>

      {/* Column body */}
      <Droppable droppableId={col.stage.id} isDropDisabled={selectionMode}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            className={`flex-1 bg-[#0f1318] border border-[#2a2f3d] border-t-0 rounded-b-xl p-1.5 space-y-2 transition-colors ${snapshot.isDraggingOver ? "bg-emerald-900/20 border-emerald-500/30" : ""}`}>
            {col.jobs.map((job, idx) => (
              <Draggable key={job.id} draggableId={job.id} index={idx} isDragDisabled={selectionMode}>
                {(prov, snap) => (
                  <div ref={prov.innerRef} {...prov.draggableProps} {...prov.dragHandleProps}>
                    <JobCard
                      job={job}
                      onClick={() => { if (!selectionMode) onDrillDownToJob(job); }}
                      isDragging={snap.isDragging}
                      visibleFlexfields={visibleFlexfields}
                      selectionMode={selectionMode}
                      isSelected={selectedJobIds.has(job.id)}
                      onToggleSelect={onToggleSelect}
                      onArchive={handleArchive}
                      onDelete={onDelete}
                      boardAssignments={boardAssignmentsByJob.get(job.id)}
                      collabAssignments={collabAssignmentsByJob.get(job.id)}
                      equipmentAssignments={equipmentByJob.get(job.id)}
                      etiquetas={etiquetasByJob.get(job.id)}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {col.jobs.length === 0 && <div className="text-center py-8 text-gray-600 text-xs">Nenhum job</div>}
          </div>
        )}
      </Droppable>
    </div>
  );
});

KanbanColumn.displayName = "KanbanColumn";
export default KanbanColumn;
