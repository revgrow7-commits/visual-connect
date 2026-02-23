import React from "react";
import type { Job } from "./types";
import { formatBRL, formatDateBR, isOverdue } from "./types";
import { DEFAULT_STAGES } from "./types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { TabItens, TabInfo, TabProducao, TabMateriais, TabHistorico } from "./detail/JobDetailTabs";

interface Props {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStageChange?: (jobId: string, newStage: string) => void;
}

const JobDetailDrawer: React.FC<Props> = ({ job, open, onOpenChange, onStageChange }) => {
  if (!job) return null;

  const stageCfg = DEFAULT_STAGES.find(s => s.id === job.stage);
  const overdue = isOverdue(job.delivery_date);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[90vw] sm:w-[80vw] sm:max-w-[900px] p-0 flex flex-col">
        {/* Header - dark navy */}
        <div className="bg-[#1a2332] text-white p-5 space-y-3 flex-shrink-0">
          <SheetHeader>
            <div className="flex items-start justify-between gap-4">
              <SheetTitle className="text-white text-xl font-bold leading-tight">
                {job.description || job.client_name}
              </SheetTitle>
              <Badge className="text-white font-mono text-xs flex-shrink-0 bg-white/10 border-white/20">
                J{job.code || job.id}
              </Badge>
            </div>
          </SheetHeader>

          <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
            <div>
              <span className="text-gray-400 font-semibold">Cliente:</span>{" "}
              <span>{job.client_name}</span>
            </div>
            <div>
              <span className="text-gray-400 font-semibold">Criado:</span>{" "}
              <span>{formatDateBR(job.created_at)}</span>
            </div>
            {job.responsible.length > 0 && (
              <div>
                <span className="text-gray-400 font-semibold">Responsável:</span>{" "}
                <span>{job.responsible.map(r => r.name).join(", ")}</span>
              </div>
            )}
            <div>
              <span className="text-gray-400 font-semibold">Necessidade de entrega:</span>{" "}
              <span className={overdue ? "text-red-400 font-semibold" : ""}>
                {formatDateBR(job.delivery_date)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400">Progresso</span>
            <Progress
              value={job.progress_percent}
              className="flex-1 h-2 bg-[#374151]"
            />
            <span className="text-sm font-bold">{job.progress_percent}%</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="producao" className="flex-1 flex flex-col overflow-hidden">
          <TabsList className="px-5 pt-3 bg-background border-b rounded-none h-auto justify-start gap-1 flex-shrink-0">
            {[
              { value: "itens", label: "Itens" },
              { value: "info", label: "Informações gerais" },
              { value: "producao", label: "Produção" },
              { value: "materiais", label: "Matéria Prima" },
              { value: "historico", label: "Histórico" },
            ].map(tab => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className="data-[state=active]:text-[#1DB899] data-[state=active]:border-b-2 data-[state=active]:border-[#1DB899] rounded-none"
              >
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <ScrollArea className="flex-1">
            <TabsContent value="itens" className="mt-0">
              <TabItens job={job} />
            </TabsContent>
            <TabsContent value="info" className="mt-0">
              <TabInfo job={job} />
            </TabsContent>
            <TabsContent value="producao" className="mt-0">
              <TabProducao job={job} onStageChange={onStageChange} />
            </TabsContent>
            <TabsContent value="materiais" className="mt-0">
              <TabMateriais job={job} />
            </TabsContent>
            <TabsContent value="historico" className="mt-0">
              <TabHistorico job={job} />
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default JobDetailDrawer;
