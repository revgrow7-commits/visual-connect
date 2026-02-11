import {
  AlertTriangle,
  ShieldAlert,
  Lightbulb,
  AlertCircle,
  Scale,
  Rocket,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const items = [
  { icon: AlertTriangle, label: "Relatar riscos operacionais" },
  { icon: ShieldAlert, label: "Comunicar incidentes críticos" },
  { icon: Lightbulb, label: "Sugerir melhorias estruturais" },
  { icon: AlertCircle, label: "Alertar sobre falhas recorrentes" },
  { icon: Scale, label: "Registrar situações éticas ou de conduta" },
  { icon: Rocket, label: "Contribuir com ideias estratégicas" },
];

const OuvidoriaObjetivos = () => (
  <section className="space-y-6">
    <h2 className="text-xl font-bold text-foreground">Objetivo do Canal</h2>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <Card key={item.label} className="hover:shadow-card-hover transition-shadow">
          <CardContent className="flex items-start gap-3 p-5">
            <item.icon className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <span className="text-sm font-medium text-foreground">{item.label}</span>
          </CardContent>
        </Card>
      ))}
    </div>

    <div className="rounded-lg border-2 border-warning bg-warning/10 p-4 text-sm text-foreground">
      <p className="font-semibold mb-1">⚠️ Atenção</p>
      <p>
        Este canal <strong>NÃO</strong> é para demandas operacionais do dia a dia.
        <br />
        Trata-se de um canal de <strong>inteligência estratégica</strong>.
      </p>
    </div>
  </section>
);

export default OuvidoriaObjetivos;
