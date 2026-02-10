import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck, ShieldOff, Loader2 } from "lucide-react";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  isAdmin: boolean;
}

const AdminUsuarios = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    // Get all profiles
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, user_id, email, display_name")
      .order("display_name");

    // Get all admin roles
    const { data: roles } = await supabase
      .from("user_roles")
      .select("user_id, role");

    const adminSet = new Set((roles || []).filter(r => r.role === "admin").map(r => r.user_id));

    setUsers(
      (profiles || []).map((p) => ({
        ...p,
        isAdmin: adminSet.has(p.user_id),
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleAdmin = async (user: UserWithRole) => {
    setToggling(user.user_id);
    try {
      if (user.isAdmin) {
        const { error } = await supabase
          .from("user_roles")
          .delete()
          .eq("user_id", user.user_id)
          .eq("role", "admin");
        if (error) throw error;
        toast({ title: `Admin removido de ${user.display_name || user.email}` });
      } else {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: user.user_id, role: "admin" });
        if (error) throw error;
        toast({ title: `Admin concedido a ${user.display_name || user.email}` });
      }
      fetchUsers();
    } catch (e: any) {
      toast({ title: "Erro ao alterar role", description: e.message, variant: "destructive" });
    }
    setToggling(null);
  };

  const getInitials = (name: string | null, email: string | null) => {
    const src = name || email || "?";
    return src.split(/[\s@]/).map(s => s[0]).join("").slice(0, 2).toUpperCase();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Gestão de Usuários</CardTitle>
        <CardDescription>Gerencie permissões e roles dos usuários do sistema</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>E-mail</TableHead>
              <TableHead>Role</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Carregando...</TableCell></TableRow>
            ) : users.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">Nenhum usuário cadastrado.</TableCell></TableRow>
            ) : (
              users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {getInitials(u.display_name, u.email)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium text-sm">{u.display_name || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">{u.email || "—"}</TableCell>
                  <TableCell>
                    {u.isAdmin ? (
                      <Badge className="bg-primary/10 text-primary">Admin</Badge>
                    ) : (
                      <Badge variant="secondary">Usuário</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={u.isAdmin ? "outline" : "default"}
                      size="sm"
                      onClick={() => toggleAdmin(u)}
                      disabled={toggling === u.user_id}
                    >
                      {toggling === u.user_id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : u.isAdmin ? (
                        <><ShieldOff className="h-4 w-4 mr-1" /> Remover Admin</>
                      ) : (
                        <><ShieldCheck className="h-4 w-4 mr-1" /> Tornar Admin</>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default AdminUsuarios;
