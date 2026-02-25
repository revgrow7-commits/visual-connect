import React from "react";
import type { Job, JobItem, JobMaterial } from "./types";
import { formatBRL } from "./types";
import { Badge } from "@/components/ui/badge";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobItems } from "@/hooks/useJobLocalData";
import { Skeleton } from "@/components/ui/skeleton";
import { Package, Layers, FileText, Ruler } from "lucide-react";

interface Props {
  job: Job;
  itemId: string;
}

const ItemDrillDown: React.FC<Props> = ({ job, itemId }) => {
  const { data: apiDetail, isLoading: apiLoading } = useJobDetail(job);
  const { data: localItems = [], isLoading: localLoading } = useJobItems(job.id);

  if (apiLoading || localLoading) {
    return (
      <div className="p-6 space-y-4">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  // Find item from API or local
  const apiItems = apiDetail?.items || [];
  const apiItem = apiItems.find(i => i.id === itemId);
  const localItem = localItems.find(i => i.id === itemId);

  const item = apiItem || (localItem ? {
    id: localItem.id,
    name: localItem.name,
    quantity: localItem.quantity,
    unit: localItem.unit,
    unitPrice: localItem.unit_value,
    subtotal: localItem.total_value,
    description: localItem.observation || "",
    done: localItem.checked,
    materials: [] as JobMaterial[],
  } : null);

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center text-muted-foreground">
        Item não encontrado
      </div>
    );
  }

  const materials = (item as any).materials || [];

  return (
    <div className="flex-1 overflow-auto p-6 space-y-6">
      {/* Item header */}
      <div className="bg-card border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-foreground">{item.name}</h2>
            {item.description && (
              <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
            )}
          </div>
          <Badge variant={item.done ? "default" : "secondary"} className="text-xs">
            {item.done ? "Concluído" : "Pendente"}
          </Badge>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
              <Package className="h-3.5 w-3.5" /> Quantidade
            </div>
            <p className="text-lg font-semibold">{item.quantity} {item.unit}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
              <Ruler className="h-3.5 w-3.5" /> Valor Unitário
            </div>
            <p className="text-lg font-semibold">{formatBRL(item.unitPrice || 0)}</p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
              <Layers className="h-3.5 w-3.5" /> Subtotal
            </div>
            <p className="text-lg font-semibold">{formatBRL(item.subtotal || 0)}</p>
          </div>
        </div>
      </div>

      {/* Materials */}
      {materials.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4" /> Matéria Prima ({materials.length})
          </h3>
          <div className="border rounded-lg overflow-hidden bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b text-muted-foreground text-xs">
                  <th className="text-left p-3">Material</th>
                  <th className="text-left p-3">Processo</th>
                  <th className="text-right p-3">Qtd Prevista</th>
                  <th className="text-right p-3">Qtd Usada</th>
                  <th className="text-left p-3">Centro</th>
                </tr>
              </thead>
              <tbody>
                {materials.map((mat: JobMaterial, idx: number) => (
                  <tr key={idx} className="border-b">
                    <td className="p-3 text-xs font-medium">{mat.name}</td>
                    <td className="p-3 text-xs text-muted-foreground">{mat.process || "—"}</td>
                    <td className="p-3 text-xs text-right">{mat.expectedQuantity ?? "—"}</td>
                    <td className="p-3 text-xs text-right">{mat.usedQuantity ?? "—"}</td>
                    <td className="p-3 text-xs text-muted-foreground">{mat.stockCenter || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attributes */}
      {materials.some((m: JobMaterial) => m.attributes && Object.keys(m.attributes).length > 0) && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Atributos dos Materiais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {materials.filter((m: JobMaterial) => m.attributes).map((mat: JobMaterial, idx: number) => (
              <div key={idx} className="bg-card border rounded-lg p-4 space-y-2">
                <p className="text-xs font-medium text-foreground">{mat.name}</p>
                <div className="flex flex-wrap gap-1.5">
                  {Object.entries(mat.attributes || {}).map(([k, v]) => (
                    <Badge key={k} variant="secondary" className="text-[10px]">
                      {k}: {v}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemDrillDown;
