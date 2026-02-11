import { forwardRef } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = forwardRef<HTMLDivElement, ProtectedRouteProps>(
  ({ children, requireAdmin = false }, _ref) => {
    const { user, isAdmin, loading } = useAuth();

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (requireAdmin && !isAdmin) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <div className="rounded-full bg-destructive/10 p-4 mb-4">
            <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-foreground">Acesso Restrito</h2>
          <p className="text-muted-foreground mt-2">Você não tem permissão para acessar esta seção.<br />Contate o administrador.</p>
        </div>
      );
    }

    return <>{children}</>;
  }
);

ProtectedRoute.displayName = "ProtectedRoute";

export default ProtectedRoute;
