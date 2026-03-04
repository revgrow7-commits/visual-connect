import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface AniversarianteHoje {
  nome: string;
  cargo: string | null;
  dia: number;
}

const confettiColors = [
  "bg-primary", "bg-yellow-400", "bg-pink-400", "bg-blue-400", "bg-green-400", "bg-orange-400",
];

function Confetti() {
  const [pieces] = useState(() =>
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 1.5 + Math.random() * 2.5,
      size: 5 + Math.random() * 8,
      color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
      rotation: Math.random() * 360,
      drift: (Math.random() - 0.5) * 60,
    }))
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-2xl">
      {pieces.map((p) => (
        <span
          key={p.id}
          className={cn("absolute rounded-sm opacity-0", p.color)}
          style={{
            left: `${p.left}%`,
            top: "-8px",
            width: p.size,
            height: p.size * 0.6,
            transform: `rotate(${p.rotation}deg)`,
            animation: `confetti-fall ${p.duration}s ease-out ${p.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

const getInitials = (nome: string) => {
  const parts = nome.split(" ").filter(Boolean);
  return `${parts[0]?.[0] || ""}${parts[parts.length - 1]?.[0] || ""}`.toUpperCase();
};

async function fetchProximosAniversariantes(): Promise<AniversarianteHoje[]> {
  const now = new Date();
  const mesAtual = now.getMonth() + 1;
  const diaAtual = now.getDate();

  const { data, error } = await supabase
    .from("colaboradores")
    .select("nome, cargo, data_nascimento")
    .not("data_nascimento", "is", null)
    .eq("status", "ativo");

  if (error || !data) return [];

  const aniversariantes = data
    .map((c: any) => {
      const dn = new Date(c.data_nascimento + "T00:00:00");
      const dia = dn.getDate();
      const mes = dn.getMonth() + 1;
      return { nome: c.nome, cargo: c.cargo, dia, mes };
    })
    .filter((a) => a.mes === mesAtual && a.dia >= diaAtual)
    .sort((a, b) => a.dia - b.dia)
    .slice(0, 3);

  return aniversariantes;
}

const AniversarioBalloon = () => {
  const [visible, setVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  const { data: aniversariantes = [] } = useQuery({
    queryKey: ["proximos-aniversariantes"],
    queryFn: fetchProximosAniversariantes,
    staleTime: 30 * 60 * 1000,
  });

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || aniversariantes.length === 0) return null;

  const hoje = new Date().getDate();
  const temHoje = aniversariantes.some((a) => a.dia === hoje);

  return (
    <div className="fixed top-20 right-6 z-50 animate-fade-in">
      <div className="relative rounded-2xl bg-card border border-border shadow-lg p-5 min-w-[260px] max-w-[300px]">
        {showConfetti && temHoje && <Confetti />}

        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/50 transition-colors z-10"
        >
          <X className="h-3.5 w-3.5 text-muted-foreground" />
        </button>

        <div className="flex flex-col items-center gap-3 relative z-[1]">
          <div className="flex gap-1">
            {["🎈", "🎈", "🎈"].map((b, i) => (
              <span
                key={i}
                className="text-2xl"
                style={{ animation: `bounce 1.${i + 2}s ease-in-out infinite` }}
              >
                {b}
              </span>
            ))}
          </div>

          <p className="text-xs font-bold text-primary uppercase tracking-wider">
            {temHoje ? "Feliz Aniversário!" : "Próximos Aniversários"}
          </p>

          <div className="flex flex-col gap-2.5 w-full">
            {aniversariantes.map((person) => {
              const isToday = person.dia === hoje;
              return (
                <div
                  key={person.nome}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-lg",
                    isToday ? "gradient-bordo-light" : "bg-muted/30"
                  )}
                >
                  <Avatar className={cn(
                    "h-10 w-10 shrink-0 border-2",
                    isToday ? "border-primary" : "border-muted"
                  )}>
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {getInitials(person.nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-foreground truncate">{person.nome}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {person.cargo || "—"} · {String(person.dia).padStart(2, "0")}/03
                    </p>
                  </div>
                  {isToday && <span className="text-lg shrink-0">🎂</span>}
                </div>
              );
            })}
          </div>

          <button
            onClick={() => setVisible(false)}
            className="mt-1 px-4 py-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AniversarioBalloon;
