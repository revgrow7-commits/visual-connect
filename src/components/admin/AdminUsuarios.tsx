import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2, Search, Pencil, Trash2, Eye, UserCog } from "lucide-react";

type AppRole = "admin" | "user" | "rh" | "colaborador" | "gestor";

interface UserWithRole {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  roles: AppRole[];
}

const roleConfig: Record<AppRole, { label: string; color: string }> = {
  admin: { label: "Administrador", color: "bg-destructive/15 text-destructive" },
  rh: { label: "RH", color: "bg-blue-500/15 text-blue-700 dark:text-blue-400" },
  gestor: { label: "Gestor", color: "bg-purple-500/15 text-purple-700 dark:text-purple-400" },
  colaborador: { label: "Colaborador", color: "bg-green-500/15 text-green-700 dark:text-green-400" },
  user: { label: "Usuário", color: "bg-muted text-muted-foreground" },
};

const allRoles: AppRole[] = ["admin", "rh", "gestor", "colaborador", "user"];

function getInitials(name: string | null, email: string | null) {
  const src = name || email || "?";
  return src.split(/[\s@]/).map((s) => s[0]).join("").slice(0, 2).toUpperCase();
}

function getHighestRole(roles: AppRole[]): AppRole {
  for (const r of allRoles) {
    if (roles.includes(r)) return r;
  }
  return "user";
}

async function fetchUsers(): Promise<UserWithRole[]> {
  const [profilesRes, rolesRes] = await Promise.all([
    supabase.from("profiles").select("id, user_id, email, display_name, avatar_url").order("display_name"),
    supabase.from("user_roles").select("user_id, role"),
  ]);

  if (profilesRes.error) {
    console.error("Erro ao buscar perfis:", profilesRes.error);
    throw new Error(profilesRes.error.message);
  }

  const roleMap = new Map<string, AppRole[]>();
  (rolesRes.data || []).forEach((r) => {
    const arr = roleMap.get(r.user_id) || [];
    arr.push(r.role as AppRole);
    roleMap.set(r.user_id, arr);
  });

  return (profilesRes.data || []).map((p) => ({
    ...p,
    roles: roleMap.get(p.user_id) || [],
  }));
}

function RoleBadges({ roles }: { roles: AppRole[] }) {
  if (roles.length === 0) {
    return (
      <Badge variant="secondary" className={roleConfig.user.color}>
        {roleConfig.user.label}
      </Badge>
    );
  }
  return (
    <div className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} variant="secondary" className={roleConfig[r]?.color || ""}>
          {roleConfig[r]?.label || r}
        </Badge>
      ))}
    </div>
  );
}

const AdminUsuarios = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todos");

  const [viewUser, setViewUser] = useState<UserWithRole | null>(null);
  const [editUser, setEditUser] = useState<UserWithRole | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState<AppRole>("user");
  const [saving, setSaving] = useState(false);
  const [deleteUser, setDeleteUser] = useState<UserWithRole | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: users = [], isLoading, isError, error } = useQuery({
    queryKey: ["admin-usuarios"],
    queryFn: fetchUsers,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      (u.display_name || "").toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    const matchRole =
      filterRole === "todos" ||
      (filterRole === "user" ? u.roles.length === 0 : u.roles.includes(filterRole as AppRole));
    return matchSearch && matchRole;
  });

  const openEdit = (u: UserWithRole) => {
    setEditUser(u);
    setEditName(u.display_name || "");
    setEditRole(getHighestRole(u.roles));
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      if (editName !== editUser.display_name) {
        const { error } = await supabase
          .from("profiles")
          .update({ display_name: editName })
          .eq("user_id", editUser.user_id);
        if (error) throw error;
      }
      await supabase.from("user_roles").delete().eq("user_id", editUser.user_id);
      if (editRole !== "user") {
        const { error } = await supabase
          .from("user_roles")
          .insert({ user_id: editUser.user_id, role: editRole });
        if (error) throw error;
      }
      toast.success("Usuário atualizado com sucesso");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setDeleting(true);
    try {
      await supabase.from("user_roles").delete().eq("user_id", deleteUser.user_id);
      const { error } = await supabase.from("profiles").delete().eq("user_id", deleteUser.user_id);
      if (error) throw error;
      toast.success("Perfil removido com sucesso");
      setDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
    } catch (e: any) {
      toast.error(e.message || "Erro ao remover");
    } finally {
      setDeleting(false);
    }
  };

  const renderTableBody = () => {
    if (isLoading) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mx-auto" />
          </TableCell>
        </TableRow>
      );
    }

    if (isError) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-destructive">
            Erro ao carregar: {(error as Error)?.message || "Tente novamente"}
          </TableCell>
        </TableRow>
      );
    }

    if (filtered.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
            Nenhum usuário encontrado.
          </TableCell>
        </TableRow>
      );
    }

    return filtered.map((u) => (
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
          <RoleBadges roles={u.roles} />
        </TableCell>
        <TableCell className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setViewUser(u)} title="Ver perfil">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setDeleteUser(u)} title="Remover" className="text-destructive hover:text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="h-5 w-5" /> Gestão de Usuários
          </CardTitle>
          <CardDescription>Edite perfis, atribua roles e gerencie permissões</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nome ou e-mail..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Filtrar role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                {allRoles.map((r) => (
                  <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span>{users.length} usuários</span>
            <span>•</span>
            <span>{users.filter((u) => u.roles.includes("admin")).length} admins</span>
            <span>•</span>
            <span>{users.filter((u) => u.roles.includes("rh")).length} RH</span>
            <span>•</span>
            <span>{users.filter((u) => u.roles.includes("gestor")).length} gestores</span>
            <span>•</span>
            <span>{users.filter((u) => u.roles.includes("colaborador")).length} colaboradores</span>
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Perfil / Role</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>{renderTableBody()}</TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Dialogs fora do Card para evitar conflito de refs */}
      <Dialog open={!!viewUser} onOpenChange={(o) => { if (!o) setViewUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Perfil do Usuário</DialogTitle>
            <DialogDescription>Informações do perfil</DialogDescription>
          </DialogHeader>
          {viewUser && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/10 text-primary text-lg">
                  {getInitials(viewUser.display_name, viewUser.email)}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold text-lg">{viewUser.display_name || "Sem nome"}</h3>
              <p className="text-sm text-muted-foreground">{viewUser.email || "Sem e-mail"}</p>
              <RoleBadges roles={viewUser.roles} />
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewUser(null)}>Fechar</Button>
            <Button onClick={() => { if (viewUser) { const u = viewUser; setViewUser(null); openEdit(u); } }}>Editar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editUser} onOpenChange={(o) => { if (!o) setEditUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>{editUser?.email || "Editar dados do usuário"}</DialogDescription>
          </DialogHeader>
          {editUser && (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label>Nome de exibição</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Perfil / Role</Label>
                <Select value={editRole} onValueChange={(v) => setEditRole(v as AppRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {allRoles.map((r) => (
                      <SelectItem key={r} value={r}>{roleConfig[r].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">Define o nível de acesso principal do usuário.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleteUser} onOpenChange={(o) => { if (!o) setDeleteUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Usuário</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja remover o perfil de <strong>{deleteUser?.display_name || deleteUser?.email}</strong>?
              Esta ação remove o perfil e roles, mas não exclui a conta de autenticação.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              Remover
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminUsuarios;
