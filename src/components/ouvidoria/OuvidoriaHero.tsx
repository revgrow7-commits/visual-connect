import { Shield } from "lucide-react";

const OuvidoriaHero = () => (
  <section className="relative overflow-hidden rounded-xl gradient-bordo px-6 py-5 md:px-8 md:py-6 text-primary-foreground">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(320_43%_30%/0.4),transparent_70%)]" />
    <div className="relative z-10 flex items-center gap-3">
      <Shield className="h-6 w-6 shrink-0" />
      <div>
        <h1 className="text-xl md:text-2xl font-bold">
          Ouvidoria Estratégica – Indústria Visual
        </h1>
        <p className="text-xs opacity-70 mt-0.5">Canal de inteligência estratégica</p>
      </div>
    </div>
  </section>
);

export default OuvidoriaHero;
