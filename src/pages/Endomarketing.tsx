import { useState } from "react";
import { Megaphone, Sparkles, Download, Loader2, RotateCcw, Image as ImageIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

type PosterSpec = {
  titulo?: string;
  subtitulo?: string;
  corpo?: string;
  callToAction?: string;
  layout?: { orientacao?: string; fundo?: string; elementosVisuais?: string[] };
  cores?: Record<string, string>;
  tipografia?: Record<string, any>;
  sugestoes?: string[];
  raw?: string;
};

const TONS = [
  { value: "formal", label: "Formal", desc: "Tom corporativo e profissional" },
  { value: "motivacional", label: "Motivacional", desc: "Inspirador e engajante" },
  { value: "direto", label: "Direto", desc: "Objetivo e informativo" },
  { value: "celebracao", label: "Celebração", desc: "Festivo e comemorativo" },
];

export default function EndomarketingPage() {
  const { toast } = useToast();
  const [tema, setTema] = useState("");
  const [tom, setTom] = useState("motivacional");
  const [detalhes, setDetalhes] = useState("");
  const [gerarImagem, setGerarImagem] = useState(true);
  const [loading, setLoading] = useState(false);
  const [spec, setSpec] = useState<PosterSpec | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!tema.trim()) {
      toast({ title: "Informe o tema do cartaz", variant: "destructive" });
      return;
    }
    setLoading(true);
    setSpec(null);
    setImageUrl(null);

    try {
      const { data, error } = await supabase.functions.invoke("endomarketing-agent", {
        body: { tema, tom, detalhes, gerarImagem },
      });

      if (error) throw error;
      setSpec(data.spec);
      setImageUrl(data.imageUrl);
      toast({ title: "Cartaz gerado com sucesso!" });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Erro ao gerar cartaz", description: e.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setTema("");
    setDetalhes("");
    setTom("motivacional");
    setSpec(null);
    setImageUrl(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-lg gradient-bordo">
          <Megaphone className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Endomarketing</h1>
          <p className="text-sm text-muted-foreground">Agente IA para criação de cartazes de comunicação interna</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="h-5 w-5 text-primary" />
              Briefing do Cartaz
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tema">Tema / Assunto *</Label>
              <Input
                id="tema"
                placeholder="Ex: Semana da Segurança no Trabalho"
                value={tema}
                onChange={(e) => setTema(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tom de Voz</Label>
              <Select value={tom} onValueChange={setTom}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="font-medium">{t.label}</span>
                      <span className="text-muted-foreground ml-2 text-xs">— {t.desc}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="detalhes">Detalhes adicionais</Label>
              <Textarea
                id="detalhes"
                placeholder="Data do evento, local, público-alvo, elementos específicos..."
                value={detalhes}
                onChange={(e) => setDetalhes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="img-switch" className="cursor-pointer">Gerar imagem preview</Label>
                <p className="text-xs text-muted-foreground">Cria um preview visual do cartaz com IA</p>
              </div>
              <Switch id="img-switch" checked={gerarImagem} onCheckedChange={setGerarImagem} />
            </div>

            <div className="flex gap-2 pt-2">
              <Button onClick={handleGenerate} disabled={loading} className="flex-1 gradient-bordo text-primary-foreground">
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {loading ? "Gerando..." : "Gerar Cartaz"}
              </Button>
              <Button variant="outline" onClick={handleReset} disabled={loading}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preview */}
        <div className="space-y-4">
          {/* Image preview */}
          {imageUrl ? (
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <img src={imageUrl} alt="Preview do cartaz" className="w-full rounded-lg" />
              </CardContent>
            </Card>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <ImageIcon className="h-12 w-12 mb-3 opacity-40" />
                <p className="font-medium">Preview do cartaz</p>
                <p className="text-xs">Preencha o briefing e clique em Gerar</p>
              </CardContent>
            </Card>
          )}

          {/* Spec card */}
          {spec && !spec.raw && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Especificação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {spec.titulo && (
                  <div>
                    <span className="font-semibold text-foreground">Título:</span>{" "}
                    <span className="text-muted-foreground">{spec.titulo}</span>
                  </div>
                )}
                {spec.subtitulo && (
                  <div>
                    <span className="font-semibold text-foreground">Subtítulo:</span>{" "}
                    <span className="text-muted-foreground">{spec.subtitulo}</span>
                  </div>
                )}
                {spec.corpo && (
                  <div>
                    <span className="font-semibold text-foreground">Corpo:</span>{" "}
                    <span className="text-muted-foreground">{spec.corpo}</span>
                  </div>
                )}
                {spec.callToAction && (
                  <div>
                    <span className="font-semibold text-foreground">CTA:</span>{" "}
                    <Badge variant="secondary">{spec.callToAction}</Badge>
                  </div>
                )}

                <Separator />

                {/* Color swatches */}
                {spec.cores && (
                  <div>
                    <span className="font-semibold text-foreground block mb-2">Paleta:</span>
                    <div className="flex gap-2 flex-wrap">
                      {Object.entries(spec.cores).map(([key, hex]) => (
                        <div key={key} className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded border border-border" style={{ backgroundColor: hex }} />
                          <span className="text-xs text-muted-foreground">{key}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {spec.sugestoes && spec.sugestoes.length > 0 && (
                  <div>
                    <span className="font-semibold text-foreground block mb-1">Sugestões:</span>
                    <ul className="list-disc list-inside text-muted-foreground text-xs space-y-0.5">
                      {spec.sugestoes.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Raw fallback */}
          {spec?.raw && (
            <Card>
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap text-xs text-muted-foreground">{spec.raw}</pre>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
