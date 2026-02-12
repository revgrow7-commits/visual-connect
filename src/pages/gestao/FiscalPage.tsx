import { Landmark } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const FiscalPage = () => (
  <GestaoSectorPage
    sector="fiscal"
    sectorLabel="Fiscal"
    icon={Landmark}
    description="Apuração de impostos, NFs, CFOP e SPED."
  />
);
export default FiscalPage;
