import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, MessageCircle, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Comunicado {
  id: string;
  titulo: string;
  conteudo: string | null;
  categoria: string;
  unidade: string;
  fixado: boolean;
  created_at: string;
  likes_count: number;
  dislikes_count: number;
  comentarios_count: number;
  image_url: string | null;
}

const categoriaCores: Record<string, string> = {
  RH: "bg-primary/10 text-primary",
  Geral: "bg-blue-500/10 text-blue-600",
  Segurança: "bg-yellow-500/10 text-yellow-700",
  Institucional: "bg-purple-500/10 text-purple-600",
  Resultados: "bg-green-500/10 text-green-600",
  Eventos: "bg-pink-500/10 text-pink-600",
  TI: "bg-cyan-500/10 text-cyan-600",
};

const ComunicadosFeed = () => {
  const [comunicados, setComunicados] = useState<Comunicado[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from("comunicados")
        .select("*")
        .eq("status", "ativo")
        .order("fixado", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5);
      setComunicados((data || []) as Comunicado[]);
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Comunicados</h2>
        {[1, 2].map((i) => (
          <div key={i} className="bg-card rounded-lg p-4 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Comunicados</h2>
        <a href="/noticias" className="text-sm text-primary font-medium hover:underline">Ver todos</a>
      </div>
      {comunicados.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum comunicado ativo.</p>
      ) : (
        comunicados.map((item) => (
          <article
            key={item.id}
            className={cn(
              "bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow duration-200",
              item.fixado && "border-l-4 border-primary"
            )}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                {item.fixado && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
                <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 border-none", categoriaCores[item.categoria] || "bg-muted text-muted-foreground")}>
                  {item.categoria}
                </Badge>
                <span className="text-[10px] text-muted-foreground">{item.unidade}</span>
              </div>
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true, locale: ptBR })}
              </span>
            </div>
            {item.image_url && (
              <div className="-mx-4 mb-2">
                <img src={item.image_url} alt={item.titulo} className="w-full max-h-40 object-cover rounded" />
              </div>
            )}
            <h3 className="font-semibold text-sm text-foreground mb-1">{item.titulo}</h3>
            {item.conteudo && (
              <p className="text-xs text-muted-foreground leading-relaxed mb-3 line-clamp-2">{item.conteudo}</p>
            )}
            <div className="flex items-center gap-4 text-muted-foreground">
              <span className="flex items-center gap-1 text-xs">
                <ThumbsUp className="h-3.5 w-3.5" /> {item.likes_count || 0}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <ThumbsDown className="h-3.5 w-3.5" /> {item.dislikes_count || 0}
              </span>
              <span className="flex items-center gap-1 text-xs">
                <MessageCircle className="h-3.5 w-3.5" /> {item.comentarios_count || 0}
              </span>
            </div>
          </article>
        ))
      )}
    </div>
  );
};

export default ComunicadosFeed;
