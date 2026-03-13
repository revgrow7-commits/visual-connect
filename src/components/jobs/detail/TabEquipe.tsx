import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Job } from "../types";
import { useJobDetail } from "@/hooks/useJobDetail";
import { useJobItems } from "@/hooks/useJobLocalData";
import { useItemAssignments, useAssignItemsToCollaborators } from "@/hooks/useJobItemAssignments";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save, Users, Bell } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { DEFAULT_STAGES } from "../types";
import { logHistory } from "@/hooks/useJobLocalData";

interface Props { job: Job }

const TabEquipe: React.FC<Props> = ({ job }) => {
  const { data: apiDetail, isLoading: apiLoading } = useJobDetail(job);
  const { data: localItems = [], isLoading: localLoading } = useJobItems(job.id);
  const { data: itemAssignments = [] } = useItemAssignments(job.id);
  const assignItems = useAssignItemsToCollaborators(job.id);

  const [colaboradores, setColaboradores] = useState<{ nome: string; cargo: string | null }[]>([]);
  const [assignments, setAssignments] = useState<Record<string, Record<string, string>>>({});
  const [notifying, setNotifying] = useState(false);
  useEffect(() => {
    supabase.from("colaboradores").select("nome, cargo").eq("status", "ativo").order("nome").then(({ data }) => {
      if (data) setColaboradores(data);
    });
  }, []);

  // Merge items
  const apiItems = apiDetail?.items || [];
  const allItems = useMemo(() => {
    const items: { id: string; name: string; source: string }[] = [];
    const seenNames = new Set<string>();
    for (const li of localItems) {
      items.push({ id: li.id, name: li.name, source: "local" });
      seenNames.add(li.name.toLowerCase().trim());
    }
    for (const ai of apiItems) {
      if (!seenNames.has(ai.name.toLowerCase().trim())) {
        items.push({ id: ai.id, name: ai.name, source: "api" });
      }
    }
    return items;
  }, [apiItems, localItems]);

  // Production stages as teams
  const teams = DEFAULT_STAGES.map(s => ({ id: s.id, name: s.name, color: s.color }));

  // Init assignments from existing data
  useEffect(() => {
    if (itemAssignments.length === 0) return;
    const map: Record<string, Record<string, string>> = {};
    for (const a of itemAssignments) {
      if (!a.is_active) continue;
      const key = a.item_name.toLowerCase().trim();
      if (!map[key]) map[key] = {};
      // We don't have team info in assignments, so just track collaborator
      map[key]["_collab"] = a.collaborator_name;
    }
    setAssignments(map);
  }, [itemAssignments]);

  const handleAssign = (itemName: string, teamId: string, colabName: string) => {
    setAssignments(prev => ({
      ...prev,
      [itemName.toLowerCase().trim()]: {
        ...(prev[itemName.toLowerCase().trim()] || {}),
        [teamId]: colabName,
      },
    }));
  };

  const handleSave = async () => {
    try {
      // Collect unique collaborators and their items for notification
      const collabItemsMap = new Map<string, string[]>();

      for (const item of allItems) {
        const itemAssigns = assignments[item.name.toLowerCase().trim()];
        if (!itemAssigns) continue;
        const collabs = Object.values(itemAssigns).filter(v => v && v !== "—");
        if (collabs.length === 0) continue;
        await assignItems.mutateAsync({
          items: [{ item_id: item.source === "local" ? item.id : undefined, item_name: item.name }],
          collaborators: collabs,
          deadline: null,
        });
        // Track for notification
        for (const colabName of collabs) {
          if (!collabItemsMap.has(colabName)) collabItemsMap.set(colabName, []);
          collabItemsMap.get(colabName)!.push(item.name);
        }
      }
      toast({ title: "Distribuição salva" });

      // Auto-send PCP invite email to assigned collaborators
      if (collabItemsMap.size > 0) {
        try {
          // Lookup emails for assigned collaborators
          const collabNames = Array.from(collabItemsMap.keys());
          const { data: collabData } = await supabase
            .from("colaboradores")
            .select("nome, email_pessoal")
            .in("nome", collabNames)
            .eq("status", "ativo");

          const recipients = (collabData || [])
            .filter(c => c.email_pessoal)
            .map(c => ({ name: c.nome, email: c.email_pessoal! }));

          if (recipients.length > 0) {
            const itemsList = allItems.map(i => ({ name: i.name }));
            const membersList = collabNames.map(n => ({ nome: n }));

            await supabase.functions.invoke("pcp-invite-notify", {
              body: {
                recipients,
                job_id: job.id,
                job_code: job.code,
                job_title: job.description || job.client_name,
                customer_name: job.client_name,
                board_name: "Produção",
                stage_name: "Atribuído",
                tags: [],
                members: membersList,
                items: itemsList,
                invited_by: "Sistema",
              },
            });

            await logHistory(
              job.id,
              "notification_sent",
              `E-mail PCP enviado automaticamente para ${recipients.length} colaborador(es): ${recipients.map(r => r.name).join(", ")}`,
              { notified_count: String(recipients.length) }
            );

            toast({
              title: "📧 E-mail enviado",
              description: `${recipients.length} colaborador(es) notificado(s) automaticamente`,
            });
          }
        } catch (notifyErr: any) {
          console.error("Erro ao enviar notificação automática:", notifyErr);
          // Don't fail the save if notification fails
        }
      }
    } catch (err: any) {
      toast({ title: "Erro ao salvar", description: err.message, variant: "destructive" });
    }
  };

  const handleNotify = async () => {
    // Collect all unique collaborators with their items
    const collabItems = new Map<string, string[]>();
    for (const item of allItems) {
      const itemAssigns = assignments[item.name.toLowerCase().trim()];
      if (!itemAssigns) continue;
      for (const [teamId, colabName] of Object.entries(itemAssigns)) {
        if (!colabName || colabName === "—") continue;
        if (!collabItems.has(colabName)) collabItems.set(colabName, []);
        const teamName = DEFAULT_STAGES.find(s => s.id === teamId)?.name || teamId;
        collabItems.get(colabName)!.push(`${item.name} (${teamName})`);
      }
    }

    if (collabItems.size === 0) {
      toast({ title: "Nenhum colaborador atribuído", description: "Atribua colaboradores antes de notificar.", variant: "destructive" });
      return;
    }

    setNotifying(true);
    try {
      const { data, error } = await supabase.functions.invoke("job-movement-notify", {
        body: {
          action: "item_assignment",
          job_id: job.id,
          job_code: job.code,
          job_title: job.description || job.client_name,
          customer_name: job.client_name,
          item_names: Array.from(collabItems.values()).flat(),
          collaborators: Array.from(collabItems.keys()),
          assigned_by: "Sistema",
        },
      });

      if (error) throw error;

      await logHistory(
        job.id,
        "notification_sent",
        `Notificação enviada para ${collabItems.size} colaborador(es): ${Array.from(collabItems.keys()).join(", ")}`,
        { notified_count: String(collabItems.size) }
      );

      toast({
        title: "📧 Notificação enviada",
        description: `${data?.notified || collabItems.size} colaborador(es) notificado(s) por e-mail`,
      });
    } catch (err: any) {
      toast({ title: "Erro ao notificar", description: err.message, variant: "destructive" });
    } finally {
      setNotifying(false);
    }
  };

  if (apiLoading || localLoading) return <div className="p-5 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>;

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-1.5"><Users className="h-4 w-4" /> Distribuição de Itens por Equipe</h3>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handleNotify} disabled={notifying} className="gap-1.5 text-xs">
            {notifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Bell className="h-3.5 w-3.5" />}
            Enviar Notificação
          </Button>
          <Button size="sm" onClick={handleSave} disabled={assignItems.isPending} className="gap-1.5 text-xs">
            {assignItems.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
            Salvar distribuição
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-muted/50">
              <th className="text-left p-2.5 font-semibold min-w-[180px] sticky left-0 bg-muted/50 z-10">Item</th>
              {teams.map(t => (
                <th key={t.id} className="text-center p-2 min-w-[140px]">
                  <Badge className="text-[9px] text-white" style={{ backgroundColor: t.color }}>{t.name}</Badge>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {allItems.map(item => (
              <tr key={item.id} className="border-t hover:bg-muted/20">
                <td className="p-2.5 font-medium sticky left-0 bg-background z-10">{item.name}</td>
                {teams.map(team => {
                  const key = item.name.toLowerCase().trim();
                  const current = assignments[key]?.[team.id] || "";
                  return (
                    <td key={team.id} className="p-1.5">
                      <Select value={current} onValueChange={v => handleAssign(item.name, team.id, v)}>
                        <SelectTrigger className="h-7 text-[10px] w-full">
                          <SelectValue placeholder="—" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="—">—</SelectItem>
                          {colaboradores.map(c => (
                            <SelectItem key={c.nome} value={c.nome}>
                              {c.nome} {c.cargo ? `(${c.cargo})` : ""}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {allItems.length === 0 && (
        <div className="text-center py-8 text-muted-foreground text-sm">
          Nenhum item disponível. Adicione itens na aba "Itens" primeiro.
        </div>
      )}
    </div>
  );
};

export default TabEquipe;
