import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface AniversarianteHoje {
  nome: string;
  foto: string;
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

interface Props {
  aniversariantes: AniversarianteHoje[];
}

const AniversarioBalloon = ({ aniversariantes }: Props) => {
  const [visible, setVisible] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible || aniversariantes.length === 0) return null;

  return (
    <div className="fixed top-20 right-6 z-50 animate-fade-in">
      <div className="relative rounded-2xl p-6 min-w-[280px] max-w-[320px]">
        {showConfetti && <Confetti />}

        <button
          onClick={() => setVisible(false)}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted/30 transition-colors z-10"
        >
          <X className="h-3.5 w-3.5 text-yellow-400" />
        </button>

        <div className="flex flex-col items-center gap-3 relative z-[1]">
          <span className="text-3xl animate-bounce">🎈</span>
          <p className="text-sm font-bold text-yellow-400 uppercase tracking-wider drop-shadow-md">
            Feliz Aniversário!
          </p>

          <div className="flex flex-col items-center gap-2 w-full">
            {aniversariantes.map((person) => (
              <div key={person.nome} className="flex flex-col items-center gap-2">
                <img
                  src={person.foto}
                  alt={person.nome}
                  className="h-[120px] w-[120px] rounded-full object-cover border-4 border-yellow-400 shadow-md"
                />
                <span className="text-sm font-medium text-yellow-400 drop-shadow-sm">{person.nome}</span>
              </div>
            ))}
          </div>

          <span className="text-lg">🎂🎉</span>

          <button
            onClick={() => setVisible(false)}
            className="mt-2 px-4 py-1.5 rounded-full bg-yellow-400 text-black text-xs font-semibold hover:bg-yellow-300 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default AniversarioBalloon;
