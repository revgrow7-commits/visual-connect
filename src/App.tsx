import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LoginPage from "./pages/Login";
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
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
              <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminPage /></ProtectedRoute>} />
              {/* RH - Admin only */}
              <Route path="/rh/admissao" element={<ProtectedRoute requireAdmin><RhAdmissaoPage /></ProtectedRoute>} />
              <Route path="/rh/colaboradores" element={<ProtectedRoute requireAdmin><ColaboradoresPage /></ProtectedRoute>} />
              <Route path="/rh/banco-horas" element={<ProtectedRoute requireAdmin><BancoHorasPage /></ProtectedRoute>} />
              <Route path="/rh/contratos" element={<ProtectedRoute requireAdmin><ContratosPage /></ProtectedRoute>} />
              <Route path="/rh/gerar-link" element={<ProtectedRoute requireAdmin><GerarLinkPage /></ProtectedRoute>} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
