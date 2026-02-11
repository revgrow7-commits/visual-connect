import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useComunicados } from "@/hooks/useComunicados";
import { useComunicadoVotes } from "@/hooks/useComunicadoVotes";
import { useComunicadoComments, type Comentario } from "@/hooks/useComunicadoComments";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const NoticiasPage = () => {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [filtroCategoria, setFiltroCategoria] = useState("Todas");
  const [filtroUnidade, setFiltroUnidade] = useState("Todas");

  const { data: comunicados = [], isLoading: loading } = useComunicados({
    categoria: filtroCategoria,
    unidade: filtroUnidade,
  });

  const { userVotes, votingId, handleVote } = useComunicadoVotes(user?.id);

  const displayName = user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Anônimo";
  const {
    expandedComments, comments, commentText, setCommentText,
    replyTo, setReplyTo, replyText, setReplyText, submitting,
    toggleComments, submitComment, moderateComment, deleteComment,
  } = useComunicadoComments(user?.id, displayName);

  const onVote = async (comunicadoId: string, tipo: "like" | "dislike") => {
    if (!user) { toast({ title: "Faça login para votar", variant: "destructive" }); return; }
    handleVote(comunicadoId, tipo);
  };

  const onSubmitComment = async (comunicadoId: string, parentId?: string) => {
    if (!user) { toast({ title: "Faça login para comentar", variant: "destructive" }); return; }
    const ok = await submitComment(comunicadoId, parentId);
    if (!ok) toast({ title: "Erro ao comentar", variant: "destructive" });
  };

  const onModerate = async (commentId: string, comunicadoId: string) => {
    await moderateComment(commentId, comunicadoId);
    toast({ title: "Comentário moderado" });
  };

  const onDelete = async (commentId: string, comunicadoId: string) => {
    await deleteComment(commentId, comunicadoId);
    toast({ title: "Comentário excluído" });
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
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onDelete(comment.id, comunicadoId)}>
                <Trash2 className="h-3 w-3 text-destructive" />
              </Button>
            )}
            {isAdmin && !comment.moderado && (
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onModerate(comment.id, comunicadoId)} title="Moderar">
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
            onKeyDown={(e) => e.key === "Enter" && onSubmitComment(comunicadoId, comment.id)}
          />
          <Button size="sm" onClick={() => onSubmitComment(comunicadoId, comment.id)} disabled={submitting}>
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

                {c.image_url && (
                  <div className="mb-3 -mx-6 -mt-1">
                    <img src={c.image_url} alt={`Cartaz: ${c.titulo}`} className="w-full max-h-80 object-cover" loading="lazy" />
                  </div>
                )}

                <h3 className="font-semibold text-foreground mb-1">{c.titulo}</h3>
                {c.conteudo && <p className="text-sm text-muted-foreground leading-relaxed mb-3 whitespace-pre-line">{c.conteudo}</p>}

                {/* Actions */}
                <div className="flex items-center gap-4 text-muted-foreground border-t pt-3">
                  <button
                    className={cn("flex items-center gap-1 text-sm transition-colors", userVotes[c.id] === "like" ? "text-primary font-medium" : "hover:text-primary")}
                    onClick={() => onVote(c.id, "like")}
                    disabled={votingId === c.id}
                  >
                    {votingId === c.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <ThumbsUp className="h-4 w-4" />}
                    {c.likes_count || 0}
                  </button>
                  <button
                    className={cn("flex items-center gap-1 text-sm transition-colors", userVotes[c.id] === "dislike" ? "text-destructive font-medium" : "hover:text-destructive")}
                    onClick={() => onVote(c.id, "dislike")}
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

                {/* Comments */}
                {expandedComments.has(c.id) && (
                  <div className="mt-4 space-y-3 border-t pt-4">
                    <div className="flex gap-2">
                      <Input
                        value={commentText[c.id] || ""}
                        onChange={(e) => setCommentText((prev) => ({ ...prev, [c.id]: e.target.value }))}
                        placeholder="Escreva um comentário..."
                        className="text-sm"
                        onKeyDown={(e) => e.key === "Enter" && onSubmitComment(c.id)}
                      />
                      <Button size="sm" onClick={() => onSubmitComment(c.id)} disabled={submitting || !(commentText[c.id] || "").trim()}>
                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                    {comments[c.id]?.length ? (
                      comments[c.id].map((comment) => renderComment(comment, c.id))
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-2">Nenhum comentário ainda.</p>
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
