import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Cake, PartyPopper } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { useEffect, useRef, useCallback } from "react";

interface Aniversariante {
  id: string;
  nome: string;
  cargo: string | null;
  foto_url: string | null;
  dia: number;
  hoje: boolean;
}

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
  const hoje = now.getDate();

  const { data, error } = await supabase
    .from("colaboradores")
    .select("id, nome, cargo, data_nascimento, foto_url, status")
    .not("data_nascimento", "is", null)
    .eq("status", "ativo");

  if (error || !data) return [];

  return data
    .map((c: any) => {
      const dn = new Date(c.data_nascimento + "T00:00:00");
      const dia = dn.getDate();
      const mes = dn.getMonth() + 1;
      return {
        id: c.id,
        nome: c.nome,
        cargo: c.cargo,
        foto_url: c.foto_url,
        dia,
        mes,
        hoje: mes === mesAtual && dia === hoje,
      };
    })
    .filter((a) => a.mes === mesAtual)
    .sort((a, b) => a.dia - b.dia);
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
    queryKey: ["aniversariantes-carousel", mesAtual],
    queryFn: fetchAniversariantes,
    staleTime: 10 * 60 * 1000,
  });

  const hasToday = aniversariantes.some((a) => a.hoje);
  const aniversariantesHoje = aniversariantes.filter((a) => a.hoje);
  useConfetti(boxRef, hasToday);

  if (aniversariantes.length === 0) return null;

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
          Aniversariantes de {MESES[mesAtual]}
        </h3>
        <span className="text-xs text-muted-foreground">
          ({aniversariantes.length})
        </span>
      </div>

      <ScrollArea className="w-full">
        <div className="flex gap-4 pb-2">
          {aniversariantes.map((person) => (
            <div
              key={person.id}
              className={cn(
                "flex flex-col items-center gap-1.5 min-w-[80px] p-2 rounded-lg transition-colors",
                person.hoje ? "gradient-bordo-light" : "hover:bg-muted/40"
              )}
            >
              <div className="relative">
                <Avatar className={cn(
                  "h-14 w-14 border-2",
                  person.hoje ? "border-primary ring-2 ring-primary/30" : "border-muted"
                )}>
                  {person.foto_url && (
                    <AvatarImage src={person.foto_url} alt={person.nome} className="object-cover" />
                  )}
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {getInitials(person.nome)}
                  </AvatarFallback>
                </Avatar>
                {person.hoje && (
                  <span className="absolute -top-1 -right-1 text-sm">🎂</span>
                )}
              </div>
              <p className="text-[11px] font-medium text-foreground text-center leading-tight max-w-[76px] truncate">
                {person.nome.split(" ")[0]}
              </p>
              <span className="text-[10px] text-muted-foreground font-medium">
                {String(person.dia).padStart(2, "0")}/{String(mesAtual).padStart(2, "0")}
              </span>
            </div>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default AniversariantesCarousel;
