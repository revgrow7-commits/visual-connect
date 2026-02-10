import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  CheckSquare, Video, FileText, CheckCircle2, Circle, ExternalLink, Play, ChevronRight,
} from "lucide-react";

const TIPO_ICONS = {
  checklist: CheckSquare,
  video: Video,
  documento: FileText,
};

type TrilhaWithEtapas = {
  id: string;
  nome: string;
  descricao: string | null;
  cargo: string;
  unidade: string;
  etapas: any[];
};

export default function OnboardingTrilhas() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [trilhas, setTrilhas] = useState<TrilhaWithEtapas[]>([]);
  const [progresso, setProgresso] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [activeTrilha, setActiveTrilha] = useState<string | null>(null);

  const fetchData = async () => {
    if (!user) return;

    // Fetch all active trilhas
    const { data: trilhasData } = await supabase
      .from("onboarding_trilhas")
      .select("*")
      .eq("ativo", true)
      .order("created_at");

    if (!trilhasData || trilhasData.length === 0) {
      setTrilhas([]);
      setLoading(false);
      return;
    }

    // Fetch all etapas for those trilhas
    const trilhaIds = trilhasData.map((t: any) => t.id);
    const { data: etapasData } = await supabase
      .from("onboarding_etapas")
      .select("*")
      .in("trilha_id", trilhaIds)
      .order("ordem");

    // Fetch user progress
    const { data: progressoData } = await supabase
      .from("onboarding_progresso")
      .select("*")
      .eq("user_id", user.id);

    const progressoMap: Record<string, boolean> = {};
    (progressoData || []).forEach((p: any) => {
      progressoMap[p.etapa_id] = p.concluida;
    });

    const trilhasWithEtapas = trilhasData.map((t: any) => ({
      ...t,
      etapas: (etapasData || []).filter((e: any) => e.trilha_id === t.id),
    }));

    setTrilhas(trilhasWithEtapas);
    setProgresso(progressoMap);
    if (!activeTrilha && trilhasWithEtapas.length > 0) {
      setActiveTrilha(trilhasWithEtapas[0].id);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const toggleEtapa = async (etapaId: string) => {
    if (!user) return;
    const current = progresso[etapaId] || false;
    const newValue = !current;

    setProgresso((prev) => ({ ...prev, [etapaId]: newValue }));

    const { error } = await supabase
      .from("onboarding_progresso")
      .upsert(
        {
          user_id: user.id,
          etapa_id: etapaId,
          concluida: newValue,
          concluida_em: newValue ? new Date().toISOString() : null,
        } as any,
        { onConflict: "user_id,etapa_id" }
      );

    if (error) {
      setProgresso((prev) => ({ ...prev, [etapaId]: current }));
      toast({ title: "Erro ao salvar progresso", description: error.message, variant: "destructive" });
    }
  };

  if (loading) return <div className="text-center py-8 text-muted-foreground">Carregando trilhas...</div>;

  if (trilhas.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckSquare className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Nenhuma trilha de onboarding disponível no momento.</p>
        </CardContent>
      </Card>
    );
  }

  const currentTrilha = trilhas.find((t) => t.id === activeTrilha) || trilhas[0];
  const totalEtapas = currentTrilha.etapas.length;
  const completedEtapas = currentTrilha.etapas.filter((e: any) => progresso[e.id]).length;
  const progressPercent = totalEtapas > 0 ? Math.round((completedEtapas / totalEtapas) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Trail Selector */}
      {trilhas.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {trilhas.map((t) => {
            const tTotal = t.etapas.length;
            const tDone = t.etapas.filter((e: any) => progresso[e.id]).length;
            return (
              <Button
                key={t.id}
                variant={activeTrilha === t.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveTrilha(t.id)}
                className="gap-2"
              >
                {t.nome}
                <Badge variant="secondary" className="text-[10px]">
                  {tDone}/{tTotal}
                </Badge>
              </Button>
            );
          })}
        </div>
      )}

      {/* Progress Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{currentTrilha.nome}</CardTitle>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{currentTrilha.cargo}</Badge>
                <Badge variant="secondary" className="text-xs">{currentTrilha.unidade}</Badge>
              </div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-bold text-primary">{progressPercent}%</span>
              <p className="text-xs text-muted-foreground">{completedEtapas} de {totalEtapas} etapas</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Progress value={progressPercent} className="h-2" />
          {currentTrilha.descricao && (
            <p className="text-sm text-muted-foreground mt-3">{currentTrilha.descricao}</p>
          )}
        </CardContent>
      </Card>

      {/* Steps Checklist */}
      <div className="space-y-2">
        {currentTrilha.etapas.map((etapa: any, idx: number) => {
          const isDone = progresso[etapa.id] || false;
          const TipoIcon = TIPO_ICONS[etapa.tipo as keyof typeof TIPO_ICONS] || CheckSquare;
          return (
            <Card
              key={etapa.id}
              className={`transition-all ${isDone ? "opacity-75" : ""}`}
            >
              <CardContent className="flex items-center gap-4 p-4">
                <button
                  onClick={() => toggleEtapa(etapa.id)}
                  className="shrink-0 focus:outline-none"
                >
                  {isDone ? (
                    <CheckCircle2 className="h-6 w-6 text-primary" />
                  ) : (
                    <Circle className="h-6 w-6 text-muted-foreground hover:text-primary transition-colors" />
                  )}
                </button>
                <span className="text-xs font-bold text-muted-foreground w-6">{idx + 1}</span>
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <TipoIcon className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${isDone ? "line-through text-muted-foreground" : ""}`}>
                    {etapa.titulo}
                  </p>
                  {etapa.descricao && (
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{etapa.descricao}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-[10px]">
                      {etapa.tipo === "video" ? "🎬 Vídeo" : etapa.tipo === "documento" ? "📄 Documento" : "✅ Checklist"}
                    </Badge>
                    {etapa.obrigatoria && <Badge className="text-[10px] bg-primary/20 text-primary border-0">Obrigatória</Badge>}
                  </div>
                </div>
                {etapa.conteudo_url && (
                  <a
                    href={etapa.conteudo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      {etapa.tipo === "video" ? <Play className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
