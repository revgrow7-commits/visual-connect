import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Settings, Users, Layers, Link2, Database, GripVertical } from "lucide-react";
import { DEAL_STAGES } from "@/lib/crm/types";

export default function CRMConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Configurações CRM</h1>
      </div>

      <Tabs defaultValue="geral" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="geral">Geral</TabsTrigger>
          <TabsTrigger value="usuarios">Usuários</TabsTrigger>
          <TabsTrigger value="campos">Campos</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="integracoes">Integrações</TabsTrigger>
          <TabsTrigger value="dados">Dados</TabsTrigger>
        </TabsList>

        <TabsContent value="geral">
          <Card><CardContent className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Nome do Workspace</Label><Input defaultValue="Holdprint CRM" /></div>
              <div className="space-y-2"><Label>Moeda Padrão</Label><Input defaultValue="BRL (R$)" /></div>
              <div className="space-y-2"><Label>Timezone</Label><Input defaultValue="America/Sao_Paulo" /></div>
              <div className="space-y-2"><Label>Idioma</Label><Input defaultValue="Português (BR)" /></div>
            </div>
            <Button>Salvar Alterações</Button>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="usuarios">
          <Card><CardContent className="p-0">
            <Table><TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Email</TableHead><TableHead>Role</TableHead><TableHead>Unidade</TableHead><TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell className="font-medium">Rafael Oribes</TableCell><TableCell>rafael@holdprint.com</TableCell><TableCell><Badge>Admin</Badge></TableCell><TableCell>POA</TableCell><TableCell><Badge variant="default">Ativo</Badge></TableCell></TableRow>
                <TableRow><TableCell className="font-medium">Bruno Garbin</TableCell><TableCell>bruno@holdprint.com</TableCell><TableCell><Badge variant="secondary">Vendedor</Badge></TableCell><TableCell>POA</TableCell><TableCell><Badge variant="default">Ativo</Badge></TableCell></TableRow>
              </TableBody>
            </Table>
          </CardContent></Card>
        </TabsContent>

        <TabsContent value="campos">
          <Card><CardContent className="flex items-center justify-center py-20"><p className="text-muted-foreground">Campos personalizados — Em desenvolvimento</p></CardContent></Card>
        </TabsContent>

        <TabsContent value="pipeline">
          <Card><CardHeader><CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" /> Etapas do Pipeline</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {DEAL_STAGES.map((s, i) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg border">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                  <div className={`h-3 w-3 rounded-full ${s.color}`} />
                  <span className="text-sm font-medium flex-1">{s.label}</span>
                  <span className="text-xs text-muted-foreground">Prob. padrão: {(i + 1) * 15}%</span>
                </div>
              ))}
              <Button variant="outline" className="w-full mt-2">+ Adicionar Etapa</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integracoes">
          <div className="space-y-3">
            {[
              { name: "Holdprint ERP", status: true, desc: "Sincronização de clientes e processos" },
              { name: "Portal RH", status: true, desc: "Dados de colaboradores" },
              { name: "Email (Gmail)", status: false, desc: "Envio de propostas e follow-ups" },
              { name: "Calendário", status: false, desc: "Sincronização de eventos" },
              { name: "WhatsApp", status: false, desc: "Mensagens e notificações" },
            ].map(i => (
              <Card key={i.name}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3"><Link2 className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium">{i.name}</p><p className="text-xs text-muted-foreground">{i.desc}</p></div></div>
                  <div className="flex items-center gap-3">
                    <Badge variant={i.status ? "default" : "secondary"}>{i.status ? "Conectado" : "Desconectado"}</Badge>
                    <Switch checked={i.status} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="dados">
          <Card><CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3"><Database className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium">Importação de Dados</p><p className="text-xs text-muted-foreground">Importe contatos, empresas e deals via CSV</p></div><Button variant="outline" className="ml-auto">Importar CSV</Button></div>
            <div className="flex items-center gap-3"><Database className="h-5 w-5 text-muted-foreground" /><div><p className="text-sm font-medium">Backup</p><p className="text-xs text-muted-foreground">Último backup: 11/03/2026 às 03:00</p></div><Button variant="outline" className="ml-auto">Gerar Backup</Button></div>
          </CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
