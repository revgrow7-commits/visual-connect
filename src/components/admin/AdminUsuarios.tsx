import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Loader2, Search, Pencil, Trash2, Plus, Key, UserCog, Phone, Building2 } from "lucide-react";

interface GatewayUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  permissions: Record<string, any>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "gestao", label: "Gestão" },
  { value: "rh", label: "RH" },
  { value: "operacao", label: "Operação" },
  { value: "comercial", label: "Comercial" },
  { value: "financeiro", label: "Financeiro" },
  { value: "user", label: "Usuário" },
];

const systemOptions = ["rh_visual", "feedback", "instalador", "gateway"];

const roleColors: Record<string, string> = {
  admin: "bg-destructive/15 text-destructive border-destructive/30",
  gestao: "bg-purple-500/15 text-purple-700 dark:text-purple-400 border-purple-500/30",
  rh: "bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30",
  operacao: "bg-orange-500/15 text-orange-700 dark:text-orange-400 border-orange-500/30",
  comercial: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  financeiro: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  user: "bg-muted text-muted-foreground border-border",
};

const togglePerm = (p: Record<string, boolean>, s: string) => ({ ...p, [s]: !p[s] });

/** Extract roles array from user data - checks both `role` field and `permissions.roles` */
function getUserRoles(u: GatewayUser): string[] {
  const permsRoles = (u.permissions as any)?.roles as string[] | undefined;
  if (permsRoles && Array.isArray(permsRoles) && permsRoles.length > 0) return permsRoles;
  return u.role ? [u.role] : ["user"];
}

const toggleRole = (roles: string[], role: string): string[] => {
  if (roles.includes(role)) {
    const next = roles.filter(r => r !== role);
    return next.length === 0 ? ["user"] : next;
  }
  // If adding a non-user role, remove "user" from the list
  const next = [...roles.filter(r => r !== "user"), role];
  return next;
};

const AdminUsuarios = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<GatewayUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<GatewayUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<GatewayUser | null>(null);
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    email: "", password: "", name: "", roles: ["user"] as string[], department: "",
    phone: "", filial: "",
    permissions: {} as Record<string, boolean>,
  });
  const [editForm, setEditForm] = useState({
    name: "", roles: ["user"] as string[], department: "", is_active: true,
    phone: "", filial: "",
    permissions: {} as Record<string, boolean>,
  });
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-gateway-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gateway_users_safe").select("*").order("name");
      if (error) throw error;
      return (data || []) as unknown as GatewayUser[];
    },
    staleTime: 30_000,
  });

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.name) { toast.error("Preencha email, senha e nome"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", {
        body: {
          action: "create-user",
          ...form,
          role: form.roles[0] || "user",
          permissions: { ...form.permissions, roles: form.roles, phone: form.phone, filial: form.filial },
        },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário criado com sucesso");
      setShowCreate(false);
      setForm({ email: "", password: "", name: "", roles: ["user"], department: "", phone: "", filial: "", permissions: {} });
      queryClient.invalidateQueries({ queryKey: ["admin-gateway-users"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const openEdit = (u: GatewayUser) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      roles: getUserRoles(u),
      department: u.department || "",
      is_active: u.is_active,
      phone: (u.permissions as any)?.phone || "",
      filial: (u.permissions as any)?.filial || "",
      permissions: (u.permissions || {}) as Record<string, boolean>,
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gateway_users").update({
        name: editForm.name,
        role: editForm.roles[0] || "user",
        department: editForm.department || null,
        is_active: editForm.is_active,
        permissions: { ...editForm.permissions, roles: editForm.roles, phone: editForm.phone, filial: editForm.filial },
      }).eq("id", editUser.id);
      if (error) throw error;
      toast.success("Usuário atualizado");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-gateway-users"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleToggleActive = async (u: GatewayUser) => {
    setTogglingId(u.id);
    try {
      const { error } = await supabase.from("gateway_users").update({ is_active: !u.is_active }).eq("id", u.id);
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ["admin-gateway-users"] });
    } catch (e: any) { toast.error(e.message); } finally { setTogglingId(null); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gateway_users").delete().eq("id", deleteUser.id);
      if (error) throw error;
      toast.success("Usuário removido");
      setDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ["admin-gateway-users"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !newPassword) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", {
        body: { action: "reset-password", userId: resetPwUser.id, password: newPassword },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Senha resetada com sucesso");
      setResetPwUser(null);
      setNewPassword("");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const RolesMultiSelect = ({ selectedRoles, onChange }: { selectedRoles: string[]; onChange: (roles: string[]) => void }) => (
    <div className="space-y-2">
      {roleOptions.map(r => (
        <label key={r.value} className="flex items-center gap-2 cursor-pointer py-1 px-2 rounded hover:bg-muted/50 transition-colors">
          <Checkbox
            checked={selectedRoles.includes(r.value)}
            onCheckedChange={() => onChange(toggleRole(selectedRoles, r.value))}
          />
          <Badge variant="outline" className={`text-[10px] uppercase font-bold tracking-wider ${roleColors[r.value] || roleColors.user}`}>
            {r.label}
          </Badge>
        </label>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <UserCog className="h-6 w-6" /> Usuários
          </h2>
          <p className="text-sm text-muted-foreground">
            Gerencie usuários e permissões do sistema ({users.length} usuários)
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar usuário..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Button onClick={() => setShowCreate(true)} className="bg-primary hover:bg-primary/90 shrink-0">
            <Plus className="h-4 w-4 mr-1" /> Novo Usuário
          </Button>
        </div>
      </div>

      {/* Grid Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="p-5">
              <div className="flex items-start gap-3">
                <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-5 w-20 mt-2" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">Nenhum usuário encontrado</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(u => {
            const roles = getUserRoles(u);
            return (
              <Card key={u.id} className="relative overflow-hidden transition-shadow hover:shadow-md">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <UserCog className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-semibold text-sm text-foreground truncate">{u.name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] text-muted-foreground">Ativo</span>
                      <Switch checked={u.is_active} onCheckedChange={() => handleToggleActive(u)} disabled={togglingId === u.id} className="scale-90" />
                    </div>
                  </div>

                  {/* Role badges - multiple */}
                  <div className="flex flex-wrap gap-1">
                    {roles.map(role => (
                      <Badge key={role} variant="outline" className={`uppercase text-[10px] font-bold tracking-wider px-2.5 py-0.5 ${roleColors[role] || roleColors.user}`}>
                        {roleOptions.find(r => r.value === role)?.label || role}
                      </Badge>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    {(u.permissions as any)?.phone && (
                      <div className="flex items-center gap-1.5">
                        <Phone className="h-3.5 w-3.5" />
                        <span>{(u.permissions as any).phone}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5">
                      <Building2 className="h-3.5 w-3.5" />
                      <span>Filial: {(u.permissions as any)?.filial || u.department || "—"}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={() => openEdit(u)}>
                      <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                    </Button>
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => setResetPwUser(u)}>
                      <Key className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="outline" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/30" onClick={() => setDeleteUser(u)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário</DialogTitle>
            <DialogDescription>Crie credenciais de acesso ao sistema</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Departamento</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
              <div className="space-y-1"><Label>Filial</Label><Input value={form.filial} onChange={e => setForm({ ...form, filial: e.target.value })} placeholder="POA" /></div>
            </div>
            <div className="space-y-1"><Label>Telefone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="5551999999999" /></div>
            <div className="space-y-2">
              <Label>Perfis de Acesso</Label>
              <RolesMultiSelect selectedRoles={form.roles} onChange={roles => setForm({ ...form, roles })} />
            </div>
            <div className="space-y-2">
              <Label>Permissões de Sistema</Label>
              <div className="flex flex-wrap gap-2">
                {systemOptions.map(s => (
                  <Button key={s} type="button" size="sm" variant={form.permissions[s] ? "default" : "outline"} onClick={() => setForm({ ...form, permissions: togglePerm(form.permissions, s) })}>{s}</Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editUser} onOpenChange={o => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>{editUser?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Departamento</Label><Input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} /></div>
              <div className="space-y-1"><Label>Filial</Label><Input value={editForm.filial} onChange={e => setEditForm({ ...editForm, filial: e.target.value })} /></div>
            </div>
            <div className="space-y-1"><Label>Telefone</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
            <div className="flex items-center gap-2"><Switch checked={editForm.is_active} onCheckedChange={v => setEditForm({ ...editForm, is_active: v })} /><Label>Ativo</Label></div>
            <div className="space-y-2">
              <Label>Perfis de Acesso</Label>
              <RolesMultiSelect selectedRoles={editForm.roles} onChange={roles => setEditForm({ ...editForm, roles })} />
            </div>
            <div className="space-y-2">
              <Label>Permissões de Sistema</Label>
              <div className="flex flex-wrap gap-2">
                {systemOptions.map(s => (
                  <Button key={s} type="button" size="sm" variant={editForm.permissions[s] ? "default" : "outline"} onClick={() => setEditForm({ ...editForm, permissions: togglePerm(editForm.permissions, s) })}>{s}</Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetPwUser} onOpenChange={o => { if (!o) setResetPwUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Resetar Senha</DialogTitle>
            <DialogDescription>{resetPwUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2"><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={saving || !newPassword}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Resetar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={!!deleteUser} onOpenChange={o => { if (!o) setDeleteUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Remover Usuário</DialogTitle>
            <DialogDescription>Remover <strong>{deleteUser?.name}</strong> do sistema?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsuarios;
