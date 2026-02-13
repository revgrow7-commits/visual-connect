import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Globe } from "lucide-react";


interface GatewayUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  is_active: boolean;
  last_login_at: string | null;
}

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const UsuariosWidget = () => {
  

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["home-gateway-users"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gateway_users_safe")
        .select("id, name, email, role, department, is_active, last_login_at")
        .eq("is_active", true)
        .order("name")
        .limit(8);
      if (error) throw error;
      return (data || []) as unknown as GatewayUser[];
    },
    staleTime: 60_000,
  });


  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-semibold flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" />
          Usuários Gateway SSO
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1 flex-1">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-2.5 w-32" />
              </div>
            </div>
          ))
        ) : users.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Nenhum usuário gateway cadastrado
          </p>
        ) : (
          <>
            {users.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {getInitials(u.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.department || u.email}</p>
                </div>
                <Badge variant="secondary" className="text-[10px] capitalize shrink-0">
                  {u.role}
                </Badge>
              </div>
            ))}
            <div className="pt-1 text-center">
              <a href="/admin?tab=gateway" className="text-xs text-primary hover:underline">
                Ver todos →
              </a>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default UsuariosWidget;
