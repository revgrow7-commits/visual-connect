import { Receipt } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const FaturamentoPage = () => (
  <GestaoSectorPage
    sector="faturamento"
    sectorLabel="Faturamento"
    icon={Receipt}
    description="Notas fiscais, ordens de serviço e controle de faturamento."
  />
);
export default FaturamentoPage;
