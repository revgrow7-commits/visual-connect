import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const grupos = [
  {
    id: "instalacao",
    icon: "🔧",
    title: "Instalação",
    items: [
      "Falta de checklist pré-instalação",
      "Equipes sem EPI adequado",
      "Atrasos recorrentes em eventos",
      "Falta de conferência pós-instalação",
    ],
  },
  {
    id: "impressao",
    icon: "🖨",
    title: "Impressão / Acabamentos",
    items: [
      "Retrabalho por calibração incorreta",
      "Materiais trocados sem verificação",
      "Perda de prazo por manutenção não programada",
    ],
  },
  {
    id: "comercial",
    icon: "💰",
    title: "Comercial",
    items: [
      "Orçamentos com margem negativa",
      "Promessas de prazo inviáveis",
      "Falta de briefing completo do cliente",
    ],
  },
  {
    id: "logistica",
    icon: "🚚",
    title: "Logística",
    items: [
      "Entregas sem conferência de volumes",
      "Rotas não otimizadas",
      "Danos em transporte por embalagem inadequada",
    ],
  },
  {
    id: "cultura",
    icon: "🏢",
    title: "Cultura / Liderança",
    items: [
      "Falta de feedback estruturado",
      "Sobrecarga em setores específicos",
      "Conflitos não mediados entre equipes",
    ],
  },
];

const OuvidoriaIncidentes = () => (
  <section className="space-y-4">
    <h2 className="text-xl font-bold text-foreground">Maiores Incidentes Mapeados</h2>
    <Accordion type="multiple" className="space-y-2">
      {grupos.map((g) => (
        <AccordionItem key={g.id} value={g.id} className="border rounded-lg px-4">
          <AccordionTrigger className="text-sm font-semibold">
            {g.icon} {g.title}
          </AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              {g.items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  </section>
);

export default OuvidoriaIncidentes;
