import { useState } from "react";
import { Settings, Upload, Newspaper, Users, Heart, ShieldCheck, GraduationCap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import AdminComunicados from "@/components/admin/AdminComunicados";
import AdminColaboradores from "@/components/admin/AdminColaboradores";
import AdminBeneficios from "@/components/admin/AdminBeneficios";
import AdminUsuarios from "@/components/admin/AdminUsuarios";
import AdminTrilhas from "@/components/admin/AdminTrilhas";

const AdminPage = () => {
  const [tab, setTab] = useState("comunicados");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Painel Administrativo</h1>
          <p className="text-muted-foreground text-sm">Gerencie comunicados, colaboradores e benefícios</p>
        </div>
        <Button variant="outline">
          <Upload className="h-4 w-4 mr-2" /> Importar CSV
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="comunicados" className="gap-1.5">
            <Newspaper className="h-4 w-4" /> Comunicados
          </TabsTrigger>
          <TabsTrigger value="colaboradores" className="gap-1.5">
            <Users className="h-4 w-4" /> Colaboradores
          </TabsTrigger>
          <TabsTrigger value="beneficios" className="gap-1.5">
            <Heart className="h-4 w-4" /> Benefícios
          </TabsTrigger>
          <TabsTrigger value="usuarios" className="gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Usuários
          </TabsTrigger>
          <TabsTrigger value="trilhas" className="gap-1.5">
            <GraduationCap className="h-4 w-4" /> Trilhas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="comunicados">
          <AdminComunicados />
        </TabsContent>
        <TabsContent value="colaboradores">
          <AdminColaboradores />
        </TabsContent>
        <TabsContent value="beneficios">
          <AdminBeneficios />
        </TabsContent>
        <TabsContent value="usuarios">
          <AdminUsuarios />
        </TabsContent>
        <TabsContent value="trilhas">
          <AdminTrilhas />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminPage;
