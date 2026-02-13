import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Search, Plus, Pencil, Trash2, Globe, Key } from "lucide-react";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Gerente" },
  { value: "user", label: "Usuário" },
];

const systemOptions = ["rh_visual", "feedback", "instalador", "gateway"];

interface GatewayUser {
  id: string;
  email: string;
  name: string;
  role: string;
  department: string | null;
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

async function fetchGatewayUsers(): Promise<GatewayUser[]> {
  const { data, error } = await supabase
    .from("gateway_users_safe")
    .select("*")
    .order("name");
  if (error) throw new Error(error.message);
  return (data || []) as unknown as GatewayUser[];
}

const AdminGatewayUsers = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<GatewayUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<GatewayUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<GatewayUser | null>(null);

  // Create form
  const [form, setForm] = useState({ email: "", password: "", name: "", role: "user", department: "", permissions: {} as Record<string, boolean> });
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editForm, setEditForm] = useState({ name: "", role: "", department: "", is_active: true, permissions: {} as Record<string, boolean> });

  // Reset pw
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["gateway-users"],
    queryFn: fetchGatewayUsers,
    staleTime: 30_000,
  });

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.name) {
      toast.error("Preencha email, senha e nome");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", {
        body: { action: "create-user", ...form },
      });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário gateway criado");
      setShowCreate(false);
      setForm({ email: "", password: "", name: "", role: "user", department: "", permissions: {} });
      queryClient.invalidateQueries({ queryKey: ["gateway-users"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (u: GatewayUser) => {
    setEditUser(u);
    setEditForm({
      name: u.name,
      role: u.role,
      department: u.department || "",
      is_active: u.is_active,
      permissions: (u.permissions || {}) as Record<string, boolean>,
    });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("gateway_users")
        .update({
          name: editForm.name,
          role: editForm.role,
          department: editForm.department || null,
          is_active: editForm.is_active,
          permissions: editForm.permissions,
        })
        .eq("id", editUser.id);
      if (error) throw error;
      toast.success("Usuário atualizado");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["gateway-users"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gateway_users").delete().eq("id", deleteUser.id);
      if (error) throw error;
      toast.success("Usuário removido");
      setDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ["gateway-users"] });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
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
      toast.success("Senha resetada");
      setResetPwUser(null);
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const togglePermission = (perms: Record<string, boolean>, sys: string) => {
    return { ...perms, [sys]: !perms[sys] };
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Globe className="h-5 w-5" /> Usuários do Gateway SSO
              </CardTitle>
              <CardDescription>Gerencie credenciais de acesso unificado entre sistemas</CardDescription>
            </div>
            <Button onClick={() => setShowCreate(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" /> Novo Usuário
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Departamento</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sistemas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto" /></TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum usuário encontrado</TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize">{u.role}</Badge></TableCell>
                    <TableCell className="text-sm">{u.department || "—"}</TableCell>
                    <TableCell>
                      <Badge variant={u.is_active ? "default" : "secondary"} className={u.is_active ? "bg-green-500/15 text-green-700" : ""}>
                        {u.is_active ? "Ativo" : "Inativo"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(u.permissions || {}).filter(([, v]) => v).map(([sys]) => (
                          <Badge key={sys} variant="outline" className="text-xs">{sys}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="Editar"><Pencil className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setResetPwUser(u)} title="Resetar senha"><Key className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeleteUser(u)} title="Remover" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Usuário Gateway</DialogTitle>
            <DialogDescription>Crie credenciais SSO para acesso entre sistemas</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Departamento</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Permissões de Sistema</Label>
              <div className="flex flex-wrap gap-2">
                {systemOptions.map(sys => (
                  <Button key={sys} type="button" size="sm" variant={form.permissions[sys] ? "default" : "outline"} onClick={() => setForm({ ...form, permissions: togglePermission(form.permissions, sys) })}>
                    {sys}
                  </Button>
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
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1"><Label>Departamento</Label><Input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={editForm.is_active} onCheckedChange={v => setEditForm({ ...editForm, is_active: v })} />
              <Label>Ativo</Label>
            </div>
            <div className="space-y-2">
              <Label>Permissões de Sistema</Label>
              <div className="flex flex-wrap gap-2">
                {systemOptions.map(sys => (
                  <Button key={sys} type="button" size="sm" variant={editForm.permissions[sys] ? "default" : "outline"} onClick={() => setEditForm({ ...editForm, permissions: togglePermission(editForm.permissions, sys) })}>
                    {sys}
                  </Button>
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
            <DialogDescription>Nova senha para {resetPwUser?.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Nova Senha</Label>
            <Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} />
          </div>
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
            <DialogDescription>Tem certeza que deseja remover <strong>{deleteUser?.name}</strong> do gateway?</DialogDescription>
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

export default AdminGatewayUsers;
