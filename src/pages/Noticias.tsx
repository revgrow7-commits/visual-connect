import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ThumbsUp, ThumbsDown, MessageCircle, Pin, Send, ChevronDown, ChevronUp,
  Newspaper, Filter, Trash2, ShieldAlert, Reply, Loader2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

const CATEGORIAS = ["Todas", "Geral", "RH", "Institucional", "Resultados", "Eventos", "TI", "Segurança"];
const UNIDADES = ["Todas", "POA", "SP", "RJ", "BH"];

const categoriaCores: Record<string, string> = {
  RH: "bg-primary/10 text-primary",
  Geral: "bg-blue-500/10 text-blue-600",
  Segurança: "bg-yellow-500/10 text-yellow-700",
  Institucional: "bg-purple-500/10 text-purple-600",
  Resultados: "bg-green-500/10 text-green-600",
  Eventos: "bg-pink-500/10 text-pink-600",
  TI: "bg-cyan-500/10 text-cyan-600",
};

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string | null;
  categoria: string;
  unidade: string;
  fixado: boolean;
  status: string;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  comentarios_count: number;
}

interface Comentario {
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

interface UserVote {
  comunicado_id: string;
  tipo: string;
}

const NoticiasPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();

  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroUnidade, setFiltroUnidade] = useState("Todas");
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [comments, setComments] = useState<Record<string, Comentario[]>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);

  const fetchComunicados = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("comunicados")
      .select("*")
      .eq("status", "ativo")
      .order("fixado", { ascending: false })
      .order("created_at", { ascending: false });

    if (filtroCategoria !== "Todas") query = query.eq("categoria", filtroCategoria);
    if (filtroUnidade !== "Todas") query = query.or(`unidade.eq.${filtroUnidade},unidade.eq.Todas`);

    const { data, error } = await query;
    if (error) {
      toast({ title: "Erro ao carregar", description: error.message, variant: "destructive" });
    } else {
      setComunicados((data || []) as Comunicado[]);
    }
    setLoading(false);
  }, [filtroCategoria, filtroUnidade, toast]);

  const fetchUserVotes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("comunicado_likes")
      .select("comunicado_id, tipo")
      .eq("user_id", user.id) as { data: UserVote[] | null };
    if (data) {
      const map: Record<string, string> = {};
      data.forEach((v) => { map[v.comunicado_id] = v.tipo; });
      setUserVotes(map);
    }
  }, [user]);

  useEffect(() => { fetchComunicados(); }, [fetchComunicados]);
  useEffect(() => { fetchUserVotes(); }, [fetchUserVotes]);

  const handleVote = async (comunicadoId: string, tipo: "like" | "dislike") => {
    if (!user) { toast({ title: "Faça login para votar", variant: "destructive" }); return; }
    setVotingId(comunicadoId);

    const existing = userVotes[comunicadoId];

    try {
      if (existing === tipo) {
        // Remove vote
        await supabase.from("comunicado_likes").delete().eq("comunicado_id", comunicadoId).eq("user_id", user.id);
        const countField = tipo === "like" ? "likes_count" : "dislikes_count";
        const current = comunicados.find((c) => c.id === comunicadoId);
        if (current) {
          await supabase.from("comunicados").update({ [countField]: Math.max(0, (current[countField] || 0) - 1) }).eq("id", comunicadoId);
        }
        setUserVotes((prev) => { const n = { ...prev }; delete n[comunicadoId]; return n; });
      } else {
        // Upsert vote
        const { error } = await supabase.from("comunicado_likes").upsert(
          { comunicado_id: comunicadoId, user_id: user.id, tipo },
          { onConflict: "comunicado_id,user_id" }
        );
        if (error) throw error;

        // Update counts
        const current = comunicados.find((c) => c.id === comunicadoId);
        if (current) {
          const updates: Record<string, number> = {};
          if (tipo === "like") {
            updates.likes_count = (current.likes_count || 0) + 1;
            if (existing === "dislike") updates.dislikes_count = Math.max(0, (current.dislikes_count || 0) - 1);
          } else {
            updates.dislikes_count = (current.dislikes_count || 0) + 1;
            if (existing === "like") updates.likes_count = Math.max(0, (current.likes_count || 0) - 1);
          }
          await supabase.from("comunicados").update(updates).eq("id", comunicadoId);
        }
        setUserVotes((prev) => ({ ...prev, [comunicadoId]: tipo }));
      }
      fetchComunicados();
    } catch (err: any) {
      toast({ title: "Erro ao votar", description: err.message, variant: "destructive" });
    } finally {
      setVotingId(null);
    }
  };

  const toggleComments = async (comunicadoId: string) => {
    const next = new Set(expandedComments);
    if (next.has(comunicadoId)) {
      next.delete(comunicadoId);
    } else {
      next.add(comunicadoId);
      if (!comments[comunicadoId]) {
        await fetchComments(comunicadoId);
      }
    }
    setExpandedComments(next);
  };

  const fetchComments = async (comunicadoId: string) => {
    const { data } = await supabase
      .from("comunicado_comentarios")
      .select("*")
      .eq("comunicado_id", comunicadoId)
      .order("created_at", { ascending: true }) as { data: Comentario[] | null };

    if (data) {
      // Build tree
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
      setComments((prev) => ({ ...prev, [comunicadoId]: roots }));
    }
  };

  const submitComment = async (comunicadoId: string, parentId?: string) => {
    if (!user) { toast({ title: "Faça login para comentar", variant: "destructive" }); return; }
    const text = parentId ? replyText : (commentText[comunicadoId] || "");
    if (!text.trim()) return;

    setSubmittingComment(true);
    const displayName = user.user_metadata?.display_name || user.email?.split("@")[0] || "Anônimo";

    const { error } = await supabase.from("comunicado_comentarios").insert({
      comunicado_id: comunicadoId,
      parent_id: parentId || null,
      user_id: user.id,
      autor_nome: displayName,
      conteudo: text.trim(),
    });

    if (error) {
      toast({ title: "Erro ao comentar", description: error.message, variant: "destructive" });
    } else {
      // Update count
      const current = comunicados.find((c) => c.id === comunicadoId);
      if (current) {
        await supabase.from("comunicados").update({ comentarios_count: (current.comentarios_count || 0) + 1 }).eq("id", comunicadoId);
      }
      if (parentId) { setReplyTo(null); setReplyText(""); }
      else setCommentText((prev) => ({ ...prev, [comunicadoId]: "" }));
      await fetchComments(comunicadoId);
      fetchComunicados();
    }
    setSubmittingComment(false);
  };

  const moderateComment = async (commentId: string, comunicadoId: string) => {
    await supabase.from("comunicado_comentarios").update({ moderado: true }).eq("id", commentId);
    toast({ title: "Comentário moderado" });
    fetchComments(comunicadoId);
  };

  const deleteComment = async (commentId: string, comunicadoId: string) => {
    await supabase.from("comunicado_comentarios").delete().eq("id", commentId);
    const current = comunicados.find((c) => c.id === comunicadoId);
    if (current) {
      await supabase.from("comunicados").update({ comentarios_count: Math.max(0, (current.comentarios_count || 0) - 1) }).eq("id", comunicadoId);
    }
    toast({ title: "Comentário excluído" });
    fetchComments(comunicadoId);
    fetchComunicados();
  };

  const renderComment = (comment: Comentario, comunicadoId: string, depth = 0) => (
    <div key={comment.id} className={cn("space-y-2", depth > 0 && "ml-6 border-l-2 border-muted pl-4")}>
      <div className="bg-muted/50 rounded-lg p-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-semibold text-foreground">{comment.autor_nome}</span>
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-muted-foreground">
              {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: ptBR })}
            </span>
            {(isAdmin || comment.user_id === user?.id) && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => deleteComment(comment.id, comunicadoId)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
            {isAdmin && !comment.moderado && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => moderateComment(comment.id, comunicadoId)} title="Moderar">
                <ShieldAlert className="h-3 w-3 text-yellow-600" />
              </Button>
            )}
          </div>
        </div>
        <p className="text-sm text-foreground">{comment.conteudo}</p>
        {depth < 2 && (
          <button
            className="text-[10px] text-primary mt-1 flex items-center gap-1 hover:underline"
            onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
          >
            <Reply className="h-3 w-3" /> Responder
          </button>
        )}
      </div>
      {replyTo === comment.id && (
        <div className="flex gap-2 ml-2">
          <Input
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Sua resposta..."
            className="text-sm"
            onKeyDown={(e) => e.key === "Enter" && submitComment(comunicadoId, comment.id)}
          />
          <Button size="sm" onClick={() => submitComment(comunicadoId, comment.id)} disabled={submittingComment}>
            <Send className="h-3 w-3" />
          </Button>
        </div>
      )}
      {comment.replies?.map((r) => renderComment(r, comunicadoId, depth + 1))}
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Newspaper className="h-6 w-6 text-primary" />
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notícias e Comunicados</h1>
          <p className="text-sm text-muted-foreground">Fique por dentro de tudo que acontece na empresa.</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <Select value={filtroCategoria} onValueChange={setFiltroCategoria}>
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            {CATEGORIAS.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroUnidade} onValueChange={setFiltroUnidade}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            {UNIDADES.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Feed */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}><CardContent className="pt-6 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </CardContent></Card>
          ))}
        </div>
      ) : comunicados.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">
          <Newspaper className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>Nenhum comunicado encontrado com esses filtros.</p>
        </CardContent></Card>
      ) : (
        <div className="space-y-4">
          {comunicados.map((c) => (
            <Card key={c.id} className={cn(c.fixado && "border-l-4 border-primary")}>
              <CardContent className="pt-5 pb-4">
                {/* Header */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    {c.fixado && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                    <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 border-none", categoriaCores[c.categoria] || "bg-muted text-muted-foreground")}>
                      {c.categoria}
                    </Badge>
                    <span className="text-[10px] text-muted-foreground">{c.unidade}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>

                {/* Body */}
                <h3 className="font-semibold text-foreground mb-1">{c.titulo}</h3>
                {c.conteudo && <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">{c.conteudo}</p>}

                {/* Actions */}
                <div className="flex items-center gap-4 text-muted-foreground border-t pt-3">
                  <button
                    className={cn("flex items-center gap-1 text-sm transition-colors", userVotes[c.id] === "like" ? "text-primary font-medium" : "hover:text-primary")}
                    onClick={() => handleVote(c.id, "like")}
                    disabled={votingId === c.id}
                  >
                    {votingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    {c.likes_count || 0}
                  </button>
                  <button
                    className={cn("flex items-center gap-1 text-sm transition-colors", userVotes[c.id] === "dislike" ? "text-destructive font-medium" : "hover:text-destructive")}
                    onClick={() => handleVote(c.id, "dislike")}
                    disabled={votingId === c.id}
                  >
                    <ThumbsDown className="h-4 w-4" /> {c.dislikes_count || 0}
                  </button>
                  <button
                    className="flex items-center gap-1 text-sm hover:text-primary transition-colors"
                    onClick={() => toggleComments(c.id)}
                  >
                    <MessageCircle className="h-4 w-4" /> {c.comentarios_count || 0}
                    {expandedComments.has(c.id) ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                  </button>
                </div>

                {/* Comments section */}
                {expandedComments.has(c.id) && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    {/* New comment input */}
                    <div className="flex gap-2">
                      <Input
                        value={commentText[c.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Escreva um comentário..."
                        className="text-sm"
                        onKeyDown={(e) => e.key === "Enter" && submitComment(c.id)}
                      />
                      <Button size="sm" onClick={() => submitComment(c.id)} disabled={submittingComment || !(commentText[c.id] || "").trim()}>
                        {submittingComment ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>

                    {/* Comments tree */}
                    {comments[c.id]?.length ? (
                      comments[c.id].map((comment) => renderComment(comment, c.id))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda. Seja o primeiro!</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NoticiasPage;
