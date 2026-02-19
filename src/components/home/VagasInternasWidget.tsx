import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Building2 } from "lucide-react";

interface Vaga {
  id: string;
  titulo: string;
  setor: string;
  unidade: string;
  tipo: string;
  created_at: string;
}

const VagasInternasWidget = () => {
  const { data: vagas = [], isLoading } = useQuery({
    queryKey: ["home-vagas-internas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vagas_internas")
        .select("id, titulo, setor, unidade, tipo, created_at")
        .eq("status", "aberta")
        .order("created_at", { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as Vaga[];
    },
    staleTime: 60_000,
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-primary" />
          Vagas Internas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))
        ) : vagas.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhuma vaga aberta no momento
          </p>
        ) : (
          <>
            {vagas.map((v) => (
              <div key={v.id} className="border rounded-lg p-3 space-y-1.5 hover:bg-muted/50 transition-colors">
                <p className="text-sm font-medium leading-tight">{v.titulo}</p>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" /> {v.setor}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {v.unidade}
                  </span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    {v.tipo}
                  </Badge>
                </div>
              </div>
            ))}
            <div className="pt-1 text-center">
              <a href="/rh/colaboradores" className="text-xs text-primary hover:underline">
                Ver todas as vagas →
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default VagasInternasWidget;
