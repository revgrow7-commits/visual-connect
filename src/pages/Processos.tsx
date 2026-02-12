import { 
  BookOpen, FileText, ClipboardCheck, ShieldCheck, Users, Truck, 
  Calculator, Scale, Receipt, Megaphone, HeadphonesIcon, Briefcase,
  ArrowLeft
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { type LucideIcon } from "lucide-react";

interface Atalho {
  label: string;
  icon: LucideIcon;
  desc: string;
  href: string;
}

const atalhos: Atalho[] = [
  { label: "Operação", icon: Truck, desc: "Produção, PCP, Kanban e logística", href: "/gestao/operacao" },
  { label: "Comercial", icon: Briefcase, desc: "Pipeline, orçamentos e CRM", href: "/gestao/comercial" },
  { label: "Financeiro", icon: Calculator, desc: "Contas a pagar/receber, fluxo de caixa", href: "/gestao/financeiro" },
  { label: "Faturamento", icon: Receipt, desc: "NFs, ordens de serviço", href: "/gestao/faturamento" },
  { label: "Compras", icon: ClipboardCheck, desc: "Fornecedores, cotações e pedidos", href: "/gestao/compras" },
  { label: "Contábil", icon: FileText, desc: "Escrituração, DRE e balanços", href: "/gestao/contabil" },
  { label: "Fiscal", icon: ShieldCheck, desc: "Impostos, SPED e obrigações", href: "/gestao/fiscal" },
  { label: "Jurídico", icon: Scale, desc: "Contratos, compliance e LGPD", href: "/gestao/juridico" },
  { label: "Marketing", icon: Megaphone, desc: "Campanhas, portfólio e branding", href: "/gestao/marketing" },
  { label: "CS", icon: HeadphonesIcon, desc: "Pós-venda, garantias e satisfação", href: "/gestao/cs" },
  { label: "RH", icon: Users, desc: "Admissão, banco de horas e equipe", href: "/rh/colaboradores" },
  { label: "Wiki Geral", icon: BookOpen, desc: "Documentos e procedimentos gerais", href: "/processos" },
];

const ProcessosPage = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Processos</h1>
          <p className="text-sm text-muted-foreground">Acesse rapidamente os processos e gestão de cada área</p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {atalhos.map((item) => (
          <button
            key={item.label}
            onClick={() => navigate(item.href)}
            className="group flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-5 
                       transition-all hover:shadow-md hover:border-primary/30 hover:-translate-y-0.5
                       focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center 
                            group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <item.icon className="h-6 w-6 text-primary group-hover:text-primary-foreground transition-colors" />
            </div>
            <div className="text-center">
              <span className="text-sm font-semibold text-foreground">{item.label}</span>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default ProcessosPage;
