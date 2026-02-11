import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Scale, Target, Lightbulb } from "lucide-react";

const principios = [
  { icon: Shield, label: "Confidencialidade" },
  { icon: Scale, label: "Não retaliação" },
  { icon: Eye, label: "Auditoria transparente" },
  { icon: Target, label: "Foco em solução" },
  { icon: Lightbulb, label: "Visão estratégica" },
];

const OuvidoriaPrincipios = () => (
  <section className="space-y-4">
    <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
      <Shield className="h-5 w-5 text-primary" />
      Princípios do Canal
    </h2>
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
      {principios.map((p) => (
        <Card key={p.label}>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <p.icon className="h-6 w-6 text-primary" />
            <span className="text-xs font-medium text-foreground">{p.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>
  </section>
);

export default OuvidoriaPrincipios;
