import { Wallet } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const FinanceiroPage = () => (
  <GestaoSectorPage
    sector="financeiro"
    sectorLabel="Financeiro"
    icon={Wallet}
    description="Contas a pagar/receber, fluxo de caixa, inadimplência e DRE gerencial."
  />
);
export default FinanceiroPage;
