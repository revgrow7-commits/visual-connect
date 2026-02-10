import { ThumbsUp, ThumbsDown, MessageCircle, Pin } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Comunicado {
  id: string;
  titulo: string;
  resumo: string;
  categoria: string;
  unidade: string;
  autor: string;
  data: string;
  fixado: boolean;
  likes: number;
  dislikes: number;
  comentarios: number;
}

const mockComunicados: Comunicado[] = [
  {
    id: "1",
    titulo: "Nova Política de Home Office 2026",
    resumo: "A partir de março, todos os colaboradores terão direito a 2 dias de trabalho remoto por semana. Confira as regras e diretrizes atualizadas.",
    categoria: "RH",
    unidade: "Todas",
    autor: "Maria Santos",
    data: "10 Fev 2026",
    fixado: true,
    likes: 42,
    dislikes: 3,
    comentarios: 12,
  },
  {
    id: "2",
    titulo: "Resultado do Trimestre — Meta Superada! 🎯",
    resumo: "Parabéns a toda equipe! Superamos a meta do Q4 em 15%. Confira os destaques por unidade.",
    categoria: "Geral",
    unidade: "Todas",
    autor: "Carlos Pereira",
    data: "08 Fev 2026",
    fixado: false,
    likes: 78,
    dislikes: 0,
    comentarios: 24,
  },
  {
    id: "3",
    titulo: "Treinamento NR-35 — Inscrições Abertas",
    resumo: "Turma de fevereiro com vagas limitadas. Inscreva-se até 15/02 pelo portal.",
    categoria: "Segurança",
    unidade: "POA",
    autor: "João Silva",
    data: "05 Fev 2026",
    fixado: false,
    likes: 15,
    dislikes: 1,
    comentarios: 5,
  },
];

const categoriaCores: Record<string, string> = {
  RH: "bg-primary/10 text-primary",
  Geral: "bg-info/10 text-info",
  Segurança: "bg-warning/10 text-warning",
  Operação: "bg-success/10 text-success",
};

const ComunicadosFeed = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">Comunicados</h2>
        <a href="/noticias" className="text-sm text-primary font-medium hover:underline">Ver todos</a>
      </div>
      {mockComunicados.map((item) => (
        <article
          key={item.id}
          className={cn(
            "bg-card rounded-lg p-4 shadow-card hover:shadow-card-hover transition-shadow duration-200",
            item.fixado && "border-l-4 border-primary"
          )}
        >
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              {item.fixado && <Pin className="h-3.5 w-3.5 text-primary shrink-0" />}
              <Badge className={cn("text-[10px] font-semibold px-2 py-0.5 border-none", categoriaCores[item.categoria] || "bg-muted text-muted-foreground")}>
                {item.categoria}
              </Badge>
              <span className="text-[10px] text-muted-foreground">{item.unidade}</span>
            </div>
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">{item.data}</span>
          </div>
          <h3 className="font-semibold text-sm text-foreground mb-1">{item.titulo}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.resumo}</p>
          <div className="flex items-center gap-4 text-muted-foreground">
            <button className="flex items-center gap-1 text-xs hover:text-primary transition-colors">
              <ThumbsUp className="h-3.5 w-3.5" /> {item.likes}
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-destructive transition-colors">
              <ThumbsDown className="h-3.5 w-3.5" /> {item.dislikes}
            </button>
            <button className="flex items-center gap-1 text-xs hover:text-info transition-colors">
              <MessageCircle className="h-3.5 w-3.5" /> {item.comentarios}
            </button>
            <span className="text-[10px] ml-auto">por {item.autor}</span>
          </div>
        </article>
      ))}
    </div>
  );
};

export default ComunicadosFeed;
