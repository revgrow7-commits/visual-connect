import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const flows = [
  {
    emoji: "🔴",
    title: "Casos Críticos",
    color: "border-destructive/50 bg-destructive/5",
    dotColor: "bg-destructive",
    steps: ["Notificação imediata ao Bruno", "Registro automático", "SLA 24–48h"],
  },
  {
    emoji: "🟠",
    title: "Operacionais",
    color: "border-warning/50 bg-warning/5",
    dotColor: "bg-warning",
    steps: ["Triagem", "Encaminhamento gestor", "Relatório semanal ao Bruno"],
  },
  {
    emoji: "🔵",
    title: "Estratégicos",
    color: "border-info/50 bg-info/5",
    dotColor: "bg-info",
    steps: ["Classificados como Ideias", "Avaliação Diretoria", "Pode virar projeto"],
  },
];

const OuvidoriaFluxo = () => (
  <section className="space-y-4">
    <h2 className="text-xl font-bold text-foreground">Fluxo Interno</h2>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {flows.map((f) => (
        <Card key={f.title} className={cn("border-2", f.color)}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{f.emoji} {f.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {f.steps.map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="flex flex-col items-center mt-1">
                  <div className={cn("h-3 w-3 rounded-full shrink-0", f.dotColor)} />
                  {i < f.steps.length - 1 && <div className="w-px h-6 bg-border" />}
                </div>
                <span className="text-sm text-foreground">{s}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

export default OuvidoriaFluxo;
