import { DatabaseBackup, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  importing: boolean;
  onImport: () => void;
}

const BancoHorasEmptyState = ({ importing, onImport }: EmptyStateProps) => (
  <Card className="border-dashed">
    <CardContent className="p-10 text-center">
      <DatabaseBackup className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
      <h3 className="font-semibold text-base mb-1">Nenhum dado importado</h3>
      <p className="text-muted-foreground text-sm mb-5 max-w-sm mx-auto">
        Importe os dados do Secullum para visualizar o banco de horas dos colaboradores.
      </p>
      <Button onClick={onImport} disabled={importing} size="sm" className="gap-2">
        {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <DatabaseBackup className="h-4 w-4" />}
        {importing ? "Importando..." : "Importar Agora"}
      </Button>
    </CardContent>
  </Card>
);

export default BancoHorasEmptyState;
