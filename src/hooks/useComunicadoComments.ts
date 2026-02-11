import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Comunicado } from "./useComunicados";

export interface Comentario {
  id: string;
  comunicado_id: string;
  parent_id: string | null;
  user_id: string;
  autor_nome: string;
  conteudo: string;
  moderado: boolean;
  created_at: string;
  replies?: Comentario[];
}

function buildTree(data: Comentario[]): Comentario[] {
  const roots: Comentario[] = [];
  const map = new Map<string, Comentario>();
  data.forEach((c) => { c.replies = []; map.set(c.id, c); });
  data.forEach((c) => {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies!.push(c);
    } else {
      roots.push(c);
    }
  });
  return roots;
}

export function useComunicadoComments(userId: string | undefined, displayName: string) {
  const queryClient = useQueryClient();
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comentario[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async (comunicadoId: string) => {
    const { data } = await supabase
      .from("comunicado_comentarios")
      .select("*")
      .eq("comunicado_id", comunicadoId)
      .order("created_at", { ascending: true });
    if (data) {
      setComments((prev) => ({ ...prev, [comunicadoId]: buildTree(data as Comentario[]) }));
    }
  }, []);

  const toggleComments = useCallback(async (comunicadoId: string) => {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(comunicadoId)) {
        next.delete(comunicadoId);
      } else {
        next.add(comunicadoId);
      }
      return next;
    });
    // Fetch only if not already loaded
    if (!comments[comunicadoId]) {
      await fetchComments(comunicadoId);
    }
  }, [comments, fetchComments]);

  const submitComment = useCallback(async (comunicadoId: string, parentId?: string) => {
    if (!userId) return false;
    const text = parentId ? replyText : (commentText[comunicadoId] || "");
    if (!text.trim()) return false;

    setSubmitting(true);
    const { error } = await supabase.from("comunicado_comentarios").insert({
      comunicado_id: comunicadoId,
      parent_id: parentId || null,
      user_id: userId,
      autor_nome: displayName,
      conteudo: text.trim(),
    });

    if (!error) {
      // Optimistic count update
      queryClient.setQueriesData<Comunicado[]>({ queryKey: ["comunicados"] }, (old) => {
        if (!old) return old;
        return old.map((c) =>
          c.id === comunicadoId ? { ...c, comentarios_count: c.comentarios_count + 1 } : c
        );
      });
      // Also persist count to DB
      const cached = queryClient.getQueriesData<Comunicado[]>({ queryKey: ["comunicados"] })
        .flatMap(([, d]) => d || []).find((c) => c.id === comunicadoId);
      if (cached) {
        await supabase.from("comunicados").update({ comentarios_count: cached.comentarios_count }).eq("id", comunicadoId);
      }

      if (parentId) { setReplyTo(null); setReplyText(""); }
      else setCommentText((prev) => ({ ...prev, [comunicadoId]: "" }));
      await fetchComments(comunicadoId);
    }
    setSubmitting(false);
    return !error;
  }, [userId, displayName, replyText, commentText, queryClient, fetchComments]);

  const moderateComment = useCallback(async (commentId: string, comunicadoId: string) => {
    await supabase.from("comunicado_comentarios").update({ moderado: true }).eq("id", commentId);
    fetchComments(comunicadoId);
  }, [fetchComments]);

  const deleteComment = useCallback(async (commentId: string, comunicadoId: string) => {
    await supabase.from("comunicado_comentarios").delete().eq("id", commentId);
    // Optimistic count
    queryClient.setQueriesData<Comunicado[]>({ queryKey: ["comunicados"] }, (old) => {
      if (!old) return old;
      return old.map((c) =>
        c.id === comunicadoId ? { ...c, comentarios_count: Math.max(0, c.comentarios_count - 1) } : c
      );
    });
    const cached = queryClient.getQueriesData<Comunicado[]>({ queryKey: ["comunicados"] })
      .flatMap(([, d]) => d || []).find((c) => c.id === comunicadoId);
    if (cached) {
      await supabase.from("comunicados").update({ comentarios_count: cached.comentarios_count }).eq("id", comunicadoId);
    }
    fetchComments(comunicadoId);
  }, [queryClient, fetchComments]);

  return {
    expandedComments,
    comments,
    commentText,
    setCommentText,
    replyTo,
    setReplyTo,
    replyText,
    setReplyText,
    submitting,
    toggleComments,
    submitComment,
    moderateComment,
    deleteComment,
  };
}
