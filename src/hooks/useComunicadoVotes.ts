import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Comunicado } from "./useComunicados";

interface UserVote {
  comunicado_id: string;
  tipo: string;
}

export function useComunicadoVotes(userId: string | undefined) {
  const queryClient = useQueryClient();
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [votingId, setVotingId] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    supabase
      .from("comunicado_likes")
      .select("comunicado_id, tipo")
      .eq("user_id", userId)
      .then(({ data }) => {
        if (data) {
          const map: Record<string, string> = {};
          (data as UserVote[]).forEach((v) => { map[v.comunicado_id] = v.tipo; });
          setUserVotes(map);
        }
      });
  }, [userId]);

  const handleVote = useCallback(async (comunicadoId: string, tipo: "like" | "dislike") => {
    if (!userId) return;
    setVotingId(comunicadoId);
    const existing = userVotes[comunicadoId];

    // Optimistic update
    const prevVotes = { ...userVotes };
    if (existing === tipo) {
      setUserVotes((prev) => { const n = { ...prev }; delete n[comunicadoId]; return n; });
    } else {
      setUserVotes((prev) => ({ ...prev, [comunicadoId]: tipo }));
    }

    // Optimistic cache update for comunicados
    queryClient.setQueriesData<Comunicado[]>({ queryKey: ["comunicados"] }, (old) => {
      if (!old) return old;
      return old.map((c) => {
        if (c.id !== comunicadoId) return c;
        const updated = { ...c };
        if (existing === tipo) {
          // Remove vote
          if (tipo === "like") updated.likes_count = Math.max(0, c.likes_count - 1);
          else updated.dislikes_count = Math.max(0, c.dislikes_count - 1);
        } else {
          if (tipo === "like") {
            updated.likes_count = c.likes_count + 1;
            if (existing === "dislike") updated.dislikes_count = Math.max(0, c.dislikes_count - 1);
          } else {
            updated.dislikes_count = c.dislikes_count + 1;
            if (existing === "like") updated.likes_count = Math.max(0, c.likes_count - 1);
          }
        }
        return updated;
      });
    });

    try {
      if (existing === tipo) {
        await supabase.from("comunicado_likes").delete().eq("comunicado_id", comunicadoId).eq("user_id", userId);
        const current = queryClient.getQueriesData<Comunicado[]>({ queryKey: ["comunicados"] })
          .flatMap(([, d]) => d || []).find((c) => c.id === comunicadoId);
        if (current) {
          const countField = tipo === "like" ? "likes_count" : "dislikes_count";
          await supabase.from("comunicados").update({ [countField]: Math.max(0, current[countField]) }).eq("id", comunicadoId);
        }
      } else {
        await supabase.from("comunicado_likes").upsert(
          { comunicado_id: comunicadoId, user_id: userId, tipo },
          { onConflict: "comunicado_id,user_id" }
        );
        const current = queryClient.getQueriesData<Comunicado[]>({ queryKey: ["comunicados"] })
          .flatMap(([, d]) => d || []).find((c) => c.id === comunicadoId);
        if (current) {
          const updates: Record<string, number> = {};
          if (tipo === "like") {
            updates.likes_count = current.likes_count;
            if (existing === "dislike") updates.dislikes_count = current.dislikes_count;
          } else {
            updates.dislikes_count = current.dislikes_count;
            if (existing === "like") updates.likes_count = current.likes_count;
          }
          await supabase.from("comunicados").update(updates).eq("id", comunicadoId);
        }
      }
    } catch {
      // Rollback on error
      setUserVotes(prevVotes);
      queryClient.invalidateQueries({ queryKey: ["comunicados"] });
    } finally {
      setVotingId(null);
    }
  }, [userId, userVotes, queryClient]);

  return { userVotes, votingId, handleVote };
}
