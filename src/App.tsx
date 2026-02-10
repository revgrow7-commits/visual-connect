import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import NoticiasPage from "./pages/Noticias";
import OnboardingPage from "./pages/Onboarding";
import BeneficiosPage from "./pages/Beneficios";
import ProcessosPage from "./pages/Processos";
import KanbanPage from "./pages/KanbanPage";
import FaixaPretaPage from "./pages/FaixaPreta";
import QuestionariosPage from "./pages/Questionarios";
import UnidadesPage from "./pages/Unidades";
import RhAdmissaoPage from "./pages/rh/Admissao";
import ColaboradoresPage from "./pages/rh/Colaboradores";
import BancoHorasPage from "./pages/rh/BancoHoras";
import ContratosPage from "./pages/rh/Contratos";
import EndomarketingPage from "./pages/Endomarketing";
import PerfilPage from "./pages/Perfil";
import AdminPage from "./pages/Admin";
import GerarLinkPage from "./pages/rh/GerarLink";
import FormularioCandidato from "./pages/FormularioCandidato";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
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
            <Route path="/rh/admissao" element={<RhAdmissaoPage />} />
            <Route path="/rh/colaboradores" element={<ColaboradoresPage />} />
            <Route path="/rh/banco-horas" element={<BancoHorasPage />} />
            <Route path="/rh/contratos" element={<ContratosPage />} />
            <Route path="/rh/gerar-link" element={<GerarLinkPage />} />
            <Route path="/endomarketing" element={<EndomarketingPage />} />
            <Route path="/perfil" element={<PerfilPage />} />
            <Route path="/admin" element={<AdminPage />} />
          </Route>
          <Route path="/formulario/:token" element={<FormularioCandidato />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
