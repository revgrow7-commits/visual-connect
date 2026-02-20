import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const NoticiasPage = lazy(() => import("./pages/Noticias"));
const OnboardingPage = lazy(() => import("./pages/Onboarding"));
const BeneficiosPage = lazy(() => import("./pages/Beneficios"));
const ProcessosPage = lazy(() => import("./pages/Processos"));
const KanbanPage = lazy(() => import("./pages/KanbanPage"));
const FaixaPretaPage = lazy(() => import("./pages/FaixaPreta"));
const QuestionariosPage = lazy(() => import("./pages/Questionarios"));
const UnidadesPage = lazy(() => import("./pages/Unidades"));
const RhAdmissaoPage = lazy(() => import("./pages/rh/Admissao"));
const ColaboradoresPage = lazy(() => import("./pages/rh/Colaboradores"));
const BancoHorasPage = lazy(() => import("./pages/rh/BancoHoras"));
const ContratosPage = lazy(() => import("./pages/rh/Contratos"));
const EndomarketingPage = lazy(() => import("./pages/Endomarketing"));
const PerfilPage = lazy(() => import("./pages/Perfil"));
const AdminPage = lazy(() => import("./pages/Admin"));
const GerarLinkPage = lazy(() => import("./pages/rh/GerarLink"));
const FormularioCandidato = lazy(() => import("./pages/FormularioCandidato"));
const OuvidoriaPage = lazy(() => import("./pages/Ouvidoria"));
const PesquisaSatisfacao = lazy(() => import("./pages/PesquisaSatisfacao"));

// Gestão pages
const OperacaoPage = lazy(() => import("./pages/gestao/OperacaoPage"));
const ComercialPage = lazy(() => import("./pages/gestao/ComercialPage"));
const ComprasPage = lazy(() => import("./pages/gestao/ComprasPage"));
const FinanceiroPage = lazy(() => import("./pages/gestao/FinanceiroPage"));
const FaturamentoPage = lazy(() => import("./pages/gestao/FaturamentoPage"));
const ContabilPage = lazy(() => import("./pages/gestao/ContabilPage"));
const FiscalPage = lazy(() => import("./pages/gestao/FiscalPage"));
const MarketingPage = lazy(() => import("./pages/gestao/MarketingPage"));
const CsPage = lazy(() => import("./pages/gestao/CsPage"));
const JuridicoPage = lazy(() => import("./pages/gestao/JuridicoPage"));
const OrquestradorPage = lazy(() => import("./pages/OrquestradorPage"));
const GatewayLogin = lazy(() => import("./pages/GatewayLogin"));

// Holdprint ERP pages
const HoldprintProcessos = lazy(() => import("./pages/holdprint/ProcessosPage"));
const HoldprintClientes = lazy(() => import("./pages/holdprint/ClientesPage"));
const HoldprintOportunidades = lazy(() => import("./pages/holdprint/OportunidadesPage"));
const HoldprintRelatorios = lazy(() => import("./pages/holdprint/RelatoriosPage"));
const HoldprintRelatorioDetalhe = lazy(() => import("./pages/holdprint/RelatorioDetalhePage"));
const HoldprintConfiguracoes = lazy(() => import("./pages/holdprint/ConfiguracoesPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/gateway-login" element={<GatewayLogin />} />
            <Route path="/pesquisa/:token" element={<PesquisaSatisfacao />} />
            <Route path="/formulario/:token" element={<FormularioCandidato />} />
            <Route element={<AppLayout />}>
              <Route path="/" element={<Index />} />
              <Route path="/noticias" element={<NoticiasPage />} />
              <Route path="/onboarding" element={<OnboardingPage />} />
              <Route path="/beneficios" element={<BeneficiosPage />} />
              <Route path="/processos" element={<ProcessosPage />} />
              <Route path="/kanban" element={<KanbanPage />} />
              <Route path="/faixa-preta" element={<FaixaPretaPage />} />
              <Route path="/questionarios" element={<QuestionariosPage />} />
              <Route path="/unidades" element={<UnidadesPage />} />
              <Route path="/endomarketing" element={<EndomarketingPage />} />
              <Route path="/perfil" element={<PerfilPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/rh/admissao" element={<RhAdmissaoPage />} />
              <Route path="/rh/colaboradores" element={<ColaboradoresPage />} />
              <Route path="/rh/banco-horas" element={<BancoHorasPage />} />
              <Route path="/rh/contratos" element={<ContratosPage />} />
              <Route path="/rh/gerar-link" element={<GerarLinkPage />} />
              <Route path="/ouvidoria" element={<OuvidoriaPage />} />
              {/* Gestão */}
              <Route path="/gestao/operacao" element={<OperacaoPage />} />
              <Route path="/gestao/comercial" element={<ComercialPage />} />
              <Route path="/gestao/compras" element={<ComprasPage />} />
              <Route path="/gestao/financeiro" element={<FinanceiroPage />} />
              <Route path="/gestao/faturamento" element={<FaturamentoPage />} />
              <Route path="/gestao/contabil" element={<ContabilPage />} />
              <Route path="/gestao/fiscal" element={<FiscalPage />} />
              <Route path="/gestao/marketing" element={<MarketingPage />} />
              <Route path="/gestao/cs" element={<CsPage />} />
              <Route path="/gestao/juridico" element={<JuridicoPage />} />
              <Route path="/orquestrador" element={<OrquestradorPage />} />
              {/* Holdprint ERP */}
              <Route path="/holdprint/processos" element={<HoldprintProcessos />} />
              <Route path="/holdprint/clientes" element={<HoldprintClientes />} />
              <Route path="/holdprint/oportunidades" element={<HoldprintOportunidades />} />
              <Route path="/holdprint/relatorios" element={<HoldprintRelatorios />} />
              <Route path="/holdprint/relatorios/:slug" element={<HoldprintRelatorioDetalhe />} />
              <Route path="/holdprint/configuracoes" element={<HoldprintConfiguracoes />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
