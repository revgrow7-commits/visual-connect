import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import LoginPage from "./pages/Login";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 min
      gcTime: 10 * 60 * 1000,   // 10 min
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<PageLoader />}>
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
                <Route path="/admin" element={<AdminPage />} />
                <Route path="/rh/admissao" element={<RhAdmissaoPage />} />
                <Route path="/rh/colaboradores" element={<ColaboradoresPage />} />
                <Route path="/rh/banco-horas" element={<BancoHorasPage />} />
                <Route path="/rh/contratos" element={<ContratosPage />} />
                <Route path="/rh/gerar-link" element={<GerarLinkPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
