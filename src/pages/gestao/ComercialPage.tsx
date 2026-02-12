import { TrendingUp } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const ComercialPage = () => (
  <GestaoSectorPage
    sector="comercial"
    sectorLabel="Comercial"
    icon={TrendingUp}
    description="Pipeline de vendas, orçamentos, taxa de conversão e histórico de clientes."
  />
);
export default ComercialPage;
