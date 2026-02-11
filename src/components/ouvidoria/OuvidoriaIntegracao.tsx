import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

const OuvidoriaIntegracao = () => (
  <section>
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-6 space-y-3">
        <h3 className="text-base font-bold text-foreground">Integração com Feedback & PDI</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Quando um caso indicar necessidade de treinamento, ajuste de liderança ou melhoria de processo,
          o sistema poderá gerar automaticamente:
        </p>
        <div className="flex flex-col sm:flex-row gap-3 text-sm">
          <div className="flex items-center gap-2 text-foreground">
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            <span>Ação no Feedback & PDI</span>
          </div>
          <div className="flex items-center gap-2 text-foreground">
            <ArrowRight className="h-4 w-4 text-primary shrink-0" />
            <span>Plano de melhoria por área</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">
          Manifestações anônimas permanecem protegidas em todas as integrações.
        </p>
      </CardContent>
    </Card>
  </section>
);

export default OuvidoriaIntegracao;
