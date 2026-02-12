import { Calculator } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const ContabilPage = () => (
  <GestaoSectorPage
    sector="contabil"
    sectorLabel="Contábil"
    icon={Calculator}
    description="Relatórios contábeis, custos 4 fases, centros de custo e conciliações."
  />
);
export default ContabilPage;
