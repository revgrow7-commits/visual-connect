import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { Globe, Plus, Pencil, Trash2, Key, Search, Loader2, Users } from "lucide-react";

const roleOptions = [
  { value: "admin", label: "Admin" },
  { value: "manager", label: "Gerente" },
  { value: "user", label: "Usuário" },
];
const systemOptions = ["rh_visual", "feedback", "instalador", "gateway"];

interface GatewayUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string | null;
  permissions: Record<string, boolean>;
  is_active: boolean;
  last_login_at: string | null;
  created_at: string;
}

function getInitials(name: string) {
  return name.split(/\s+/).map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

const togglePerm = (p: Record<string, boolean>, s: string) => ({ ...p, [s]: !p[s] });

const HomeUsuariosAdmin = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<GatewayUser | null>(null);
  const [deleteUser, setDeleteUser] = useState<GatewayUser | null>(null);
  const [resetPwUser, setResetPwUser] = useState<GatewayUser | null>(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({ email: "", password: "", name: "", role: "user", department: "", permissions: {} as Record<string, boolean> });
  const [editForm, setEditForm] = useState({ name: "", role: "", department: "", is_active: true, permissions: {} as Record<string, boolean> });
  const [newPassword, setNewPassword] = useState("");

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["home-gateway-users-admin"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gateway_users_safe").select("*").order("name");
      if (error) throw error;
      return (data || []) as unknown as GatewayUser[];
    },
    enabled: isAdmin,
    staleTime: 30_000,
  });

  if (!isAdmin) return null;

  const filtered = users.filter(u =>
    !search || u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!form.email || !form.password || !form.name) { toast.error("Preencha email, senha e nome"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", { body: { action: "create-user", ...form } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Usuário criado");
      setShowCreate(false);
      setForm({ email: "", password: "", name: "", role: "user", department: "", permissions: {} });
      queryClient.invalidateQueries({ queryKey: ["home-gateway-users-admin"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const openEdit = (u: GatewayUser) => {
    setEditUser(u);
    setEditForm({ name: u.name, role: u.role, department: u.department || "", is_active: u.is_active, permissions: (u.permissions || {}) as Record<string, boolean> });
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gateway_users").update({ name: editForm.name, role: editForm.role, department: editForm.department || null, is_active: editForm.is_active, permissions: editForm.permissions }).eq("id", editUser.id);
      if (error) throw error;
      toast.success("Atualizado");
      setEditUser(null);
      queryClient.invalidateQueries({ queryKey: ["home-gateway-users-admin"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteUser) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("gateway_users").delete().eq("id", deleteUser.id);
      if (error) throw error;
      toast.success("Removido");
      setDeleteUser(null);
      queryClient.invalidateQueries({ queryKey: ["home-gateway-users-admin"] });
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const handleResetPassword = async () => {
    if (!resetPwUser || !newPassword) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("gateway-auth", { body: { action: "reset-password", userId: resetPwUser.id, password: newPassword } });
      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);
      toast.success("Senha resetada");
      setResetPwUser(null);
      setNewPassword("");
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Usuários Gateway SSO
            </CardTitle>
            <CardDescription className="text-xs">Gerencie acessos unificados entre sistemas</CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="h-4 w-4 mr-1" /> Novo
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20 ml-auto" />
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Dept.</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sistemas</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="h-16 text-center text-muted-foreground text-sm">Nenhum usuário encontrado</TableCell></TableRow>
                ) : filtered.map(u => (
                  <TableRow key={u.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Avatar className="h-7 w-7">
                          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{getInitials(u.name)}</AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{u.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="secondary" className="capitalize text-[10px]">{u.role}</Badge></TableCell>
                    <TableCell className="text-xs">{u.department || "—"}</TableCell>
                    <TableCell>
                      <span className={`inline-block h-2 w-2 rounded-full ${u.is_active ? "bg-green-500" : "bg-muted-foreground"}`} />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-0.5 flex-wrap">
                        {Object.entries(u.permissions || {}).filter(([, v]) => v).map(([s]) => (
                          <Badge key={s} variant="outline" className="text-[9px] px-1">{s}</Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-0.5">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(u)}><Pencil className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setResetPwUser(u)}><Key className="h-3.5 w-3.5" /></Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => setDeleteUser(u)}><Trash2 className="h-3.5 w-3.5" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>

      {/* Create */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Novo Usuário Gateway</DialogTitle><DialogDescription>Crie credenciais SSO</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div className="space-y-1"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
            <div className="space-y-1"><Label>Senha</Label><Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select>
              </div>
              <div className="space-y-1"><Label>Departamento</Label><Input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} /></div>
            </div>
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="flex flex-wrap gap-2">{systemOptions.map(s => <Button key={s} type="button" size="sm" variant={form.permissions[s] ? "default" : "outline"} onClick={() => setForm({ ...form, permissions: togglePerm(form.permissions, s) })}>{s}</Button>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Criar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit */}
      <Dialog open={!!editUser} onOpenChange={o => { if (!o) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar Usuário</DialogTitle><DialogDescription>{editUser?.email}</DialogDescription></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1"><Label>Nome</Label><Input value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Role</Label><Select value={editForm.role} onValueChange={v => setEditForm({ ...editForm, role: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{roleOptions.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1"><Label>Departamento</Label><Input value={editForm.department} onChange={e => setEditForm({ ...editForm, department: e.target.value })} /></div>
            </div>
            <div className="flex items-center gap-2"><Switch checked={editForm.is_active} onCheckedChange={v => setEditForm({ ...editForm, is_active: v })} /><Label>Ativo</Label></div>
            <div className="space-y-2">
              <Label>Permissões</Label>
              <div className="flex flex-wrap gap-2">{systemOptions.map(s => <Button key={s} type="button" size="sm" variant={editForm.permissions[s] ? "default" : "outline"} onClick={() => setEditForm({ ...editForm, permissions: togglePerm(editForm.permissions, s) })}>{s}</Button>)}</div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>Cancelar</Button>
            <Button onClick={handleSaveEdit} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reset Password */}
      <Dialog open={!!resetPwUser} onOpenChange={o => { if (!o) setResetPwUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Resetar Senha</DialogTitle><DialogDescription>{resetPwUser?.name}</DialogDescription></DialogHeader>
          <div className="space-y-2"><Label>Nova Senha</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={6} /></div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPwUser(null)}>Cancelar</Button>
            <Button onClick={handleResetPassword} disabled={saving || !newPassword}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Resetar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <Dialog open={!!deleteUser} onOpenChange={o => { if (!o) setDeleteUser(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Remover Usuário</DialogTitle><DialogDescription>Remover <strong>{deleteUser?.name}</strong> do gateway?</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteUser(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}Remover</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default HomeUsuariosAdmin;
