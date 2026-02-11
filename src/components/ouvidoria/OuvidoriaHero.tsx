import { Shield } from "lucide-react";

const OuvidoriaHero = () => (
  <section className="relative overflow-hidden rounded-xl gradient-bordo p-8 md:p-12 text-primary-foreground">
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,hsl(320_43%_30%/0.4),transparent_70%)]" />
    <div className="relative z-10 max-w-3xl">
      <div className="flex items-center gap-3 mb-4">
        <Shield className="h-8 w-8" />
        <span className="text-xs font-semibold uppercase tracking-widest opacity-80">
          Canal Estratégico
        </span>
      </div>
      <h1 className="text-3xl md:text-4xl font-bold mb-2">
        Ouvidoria Estratégica – Indústria Visual
      </h1>
      <p className="text-lg md:text-xl font-medium opacity-90 mb-4">
        Canal Direto Bruno
      </p>
      <blockquote className="border-l-4 border-primary-foreground/40 pl-4 text-sm md:text-base opacity-85 italic leading-relaxed">
        "O Canal Direto Bruno não é sobre reclamação.
        <br />
        É sobre evolução estrutural da Indústria Visual."
      </blockquote>
    </div>
  </section>
);

export default OuvidoriaHero;
