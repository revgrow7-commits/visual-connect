import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Megaphone } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Cartaz {
  id: string;
  titulo: string;
  tema: string;
  tom: string;
  spec: any;
  image_url: string | null;
  created_at: string;
}

const CartazesRecentes = () => {
  const { data: cartazes = [], isLoading } = useQuery({
    queryKey: ["cartazes-home"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cartazes_endomarketing")
        .select("id, titulo, tema, tom, spec, image_url, created_at")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return (data || []) as Cartaz[];
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-bold text-foreground">Cartazes</h2>
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
        <h2 className="text-lg font-bold text-foreground">Cartazes</h2>
        <a href="/endomarketing" className="text-sm text-primary font-medium hover:underline">Ver todos</a>
      </div>
      {cartazes.length === 0 ? (
        <div className="bg-card rounded-lg p-6 text-center">
          <Megaphone className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Nenhum cartaz criado ainda.</p>
        </div>
      ) : (
        cartazes.map((cartaz) => {
          const spec = cartaz.spec as any;
          return (
            <article
              key={cartaz.id}
              className="bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow duration-200"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Megaphone className="h-3.5 w-3.5 text-primary shrink-0" />
                  <Badge className="text-[10px] font-semibold px-2 py-0.5 border-none bg-primary/10 text-primary">
                    {cartaz.tom}
                  </Badge>
                </div>
                <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                  {formatDistanceToNow(new Date(cartaz.created_at), { addSuffix: true, locale: ptBR })}
                </span>
              </div>
              {cartaz.image_url && (
                <div className="-mx-4 mb-2">
                  <img src={cartaz.image_url} alt={cartaz.titulo} className="w-full max-h-40 object-cover rounded" loading="lazy" />
                </div>
              )}
              <h3 className="font-semibold text-sm text-foreground mb-1">{cartaz.titulo}</h3>
              {spec?.corpo && (
                <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{spec.corpo}</p>
              )}
            </article>
          );
        })
      )}
    </div>
  );
};

export default CartazesRecentes;
