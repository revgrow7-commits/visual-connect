import { HeadphonesIcon } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const CsPage = () => (
  <GestaoSectorPage
    sector="cs"
    sectorLabel="Customer Success"
    icon={HeadphonesIcon}
    description="Pós-venda, garantias, histórico de entregas e reclamações."
  />
);
export default CsPage;
