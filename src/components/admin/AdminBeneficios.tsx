import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Heart } from "lucide-react";

const AdminBeneficios = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Benefícios</CardTitle>
        <CardDescription>Gerencie os benefícios oferecidos aos colaboradores</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Heart className="h-10 w-10 mb-3 text-muted-foreground/50" />
          <p className="font-medium">Gestão de Benefícios</p>
          <p className="text-sm mt-1">Em breve: cadastro e gestão de planos de saúde, VA, VR e outros benefícios.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminBeneficios;
