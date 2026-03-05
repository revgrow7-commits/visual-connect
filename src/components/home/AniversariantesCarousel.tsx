import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Cake, PartyPopper, Building2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useRef, useCallback } from "react";

interface Aniversariante {
  id: string;
  nome: string;
  cargo: string | null;
  foto_url: string | null;
  dia: number;
  mes: number;
  hoje: boolean;
  anosEmpresa: number | null;
}

const MESES_CURTO = [
  "", "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
  "Jul", "Ago", "Set", "Out", "Nov", "Dez",
];

const MESES = [
  "", "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const getInitials = (nome: string) => {
  const parts = nome.split(" ").filter(Boolean);
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
};

async function fetchAniversariantes(): Promise<Aniversariante[]> {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const diaAtual = now.getDate();
  const anoAtual = now.getFullYear();

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome, cargo, data_nascimento, data_admissao, foto_url, status")
    .not("data_nascimento", "is", null)
    .eq("status", "ativo");

  if (error || !data) return [];

  return data
    .map((c: any) => {
      const dn = new Date(c.data_nascimento + "T00:00:00");
      const dia = dn.getDate();
      const mes = dn.getMonth() + 1;

      let anosEmpresa: number | null = null;
      if (c.data_admissao) {
        const da = new Date(c.data_admissao + "T00:00:00");
        anosEmpresa = anoAtual - da.getFullYear();
        // Ajusta se ainda não chegou o aniversário de empresa este ano
        if (mes < mesAtual || (mes === mesAtual && dia < diaAtual)) {
          // já passou
        } else if (mes > mesAtual || (mes === mesAtual && dia > diaAtual)) {
          // ainda não passou - mas queremos mostrar quantos anos faz quando chegar
        }
        // Calcula anos de empresa no próximo aniversário
        const admMes = da.getMonth() + 1;
        const admDia = da.getDate();
        anosEmpresa = anoAtual - da.getFullYear();
        if (admMes > mesAtual || (admMes === mesAtual && admDia > diaAtual)) {
          anosEmpresa = anosEmpresa - 1;
        }
        if (anosEmpresa < 0) anosEmpresa = 0;
      }

      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        foto_url: c.foto_url,
        dia,
        mes,
        hoje: mes === mesAtual && dia === diaAtual,
        anosEmpresa,
      };
    })
    .sort((a, b) => {
      // Ordena por proximidade: mês atual primeiro, depois os próximos meses, wrap around
      const aMesOrd = a.mes >= mesAtual ? a.mes - mesAtual : a.mes - mesAtual + 12;
      const bMesOrd = b.mes >= mesAtual ? b.mes - mesAtual : b.mes - mesAtual + 12;
      if (aMesOrd !== bMesOrd) return aMesOrd - bMesOrd;
      return a.dia - b.dia;
    });
}

const CONFETTI_COLORS = [
  "hsl(var(--primary))",
  "#FFD700",
  "#FF6B6B",
  "#4ECDC4",
  "#A78BFA",
  "#FB923C",
  "#34D399",
  "#F472B6",
];

function useConfetti(containerRef: React.RefObject<HTMLDivElement | null>, active: boolean) {
  const animFrameRef = useRef<number>(0);

  const run = useCallback(() => {
    const container = containerRef.current;
    if (!container || !active) return;

    const canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;pointer-events:none;z-index:10;border-radius:inherit;";
    container.style.position = "relative";
    container.style.overflow = "hidden";
    container.appendChild(canvas);

    const ctx = canvas.getContext("2d")!;
    const rect = container.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    interface Particle {
      x: number; y: number; w: number; h: number;
      color: string; vx: number; vy: number;
      rotation: number; rotSpeed: number; opacity: number;
    }

    const particles: Particle[] = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -10 - Math.random() * 40,
      w: 4 + Math.random() * 4,
      h: 6 + Math.random() * 8,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      vx: (Math.random() - 0.5) * 2,
      vy: 1.2 + Math.random() * 2.5,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.15,
      opacity: 1,
    }));

    let done = 0;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > canvas.height * 0.7) p.opacity = Math.max(0, p.opacity - 0.02);
        if (p.opacity <= 0) { done++; return; }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (done < particles.length) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        canvas.remove();
      }
    };
    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      canvas.remove();
    };
  }, [containerRef, active]);

  useEffect(() => {
    const cleanup = run();
    return cleanup;
  }, [run]);
}

const AniversariantesCarousel = () => {
  const mesAtual = new Date().getMonth() + 1;
  const boxRef = useRef<HTMLDivElement>(null);

  const { data: aniversariantes = [] } = useQuery({
    queryKey: ["aniversariantes-carousel-year"],
    queryFn: fetchAniversariantes,
    staleTime: 10 * 60 * 1000,
  });

  const hasToday = aniversariantes.some((a) => a.hoje);
  const aniversariantesHoje = aniversariantes.filter((a) => a.hoje);
  useConfetti(boxRef, hasToday);

  if (aniversariantes.length === 0) return null;

  // Agrupar por mês para separadores visuais
  let lastMes = 0;

  return (
    <div ref={boxRef} className="bg-card rounded-xl p-4 shadow-card relative overflow-hidden">
      {/* Banner de parabéns */}
      {aniversariantesHoje.length > 0 && (
        <div className="mb-3 rounded-lg gradient-bordo p-3 flex items-center gap-3 animate-fade-in">
          <PartyPopper className="h-6 w-6 text-primary-foreground shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-primary-foreground">
              🎉 Parabéns{aniversariantesHoje.length > 1 ? "" : ""},{" "}
              {aniversariantesHoje.map((a, i) => (
                <span key={a.id}>
                  {a.nome.split(" ")[0]}
                  {i < aniversariantesHoje.length - 2 && ", "}
                  {i === aniversariantesHoje.length - 2 && " e "}
                </span>
              ))}
              ! 🥳
            </p>
            <p className="text-xs text-primary-foreground/80 mt-0.5">
              Desejamos um dia incrível cheio de alegria e realizações!
            </p>
          </div>
          <span className="text-2xl">🎂</span>
        </div>
      )}

      <div className="flex items-center gap-2 mb-3">
        <Cake className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold text-foreground">
          Próximos Aniversários
        </h3>
        <span className="text-xs text-muted-foreground">
          ({aniversariantes.length})
        </span>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-3 pb-2 items-end">
          {aniversariantes.map((person) => {
            const showMonthLabel = person.mes !== lastMes;
            lastMes = person.mes;

            return (
              <div key={person.id} className="flex flex-col items-center gap-1 flex-shrink-0">
                {/* Label do mês */}
                {showMonthLabel && (
                  <span className={cn(
                    "text-[10px] font-bold px-2 py-0.5 rounded-full mb-1",
                    person.mes === mesAtual
                      ? "bg-primary/15 text-primary"
                      : "bg-muted text-muted-foreground"
                  )}>
                    {MESES_CURTO[person.mes]}
                  </span>
                )}
                {!showMonthLabel && <div className="h-[22px]" />}

                <div
                  className={cn(
                    "relative w-[130px] rounded-xl overflow-hidden shadow-md transition-transform hover:scale-[1.03]",
                    person.hoje ? "ring-2 ring-primary ring-offset-2 ring-offset-card" : ""
                  )}
                >
                  <div className="relative w-full h-[155px] bg-muted">
                    {person.foto_url ? (
                      <img
                        src={person.foto_url}
                        alt={person.nome}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-primary/10">
                        <span className="text-3xl font-bold text-primary/60">
                          {getInitials(person.nome)}
                        </span>
                      </div>
                    )}
                    {person.hoje && (
                      <span className="absolute top-1.5 right-1.5 text-lg drop-shadow-md">🎂</span>
                    )}
                    {/* Gradient overlay */}
                    <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-2">
                      <p className="text-[11px] font-bold text-white leading-tight truncate">
                        {person.nome.split(" ").slice(0, 2).join(" ")}
                      </p>
                      <span className="text-[10px] text-white/70 font-medium">
                        {String(person.dia).padStart(2, "0")}/{String(person.mes).padStart(2, "0")}
                      </span>
                      {person.anosEmpresa != null && person.anosEmpresa > 0 && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Building2 className="h-2.5 w-2.5 text-white/60" />
                          <span className="text-[9px] text-white/60 font-medium">
                            {person.anosEmpresa} {person.anosEmpresa === 1 ? "ano" : "anos"} de IV
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AniversariantesCarousel;
