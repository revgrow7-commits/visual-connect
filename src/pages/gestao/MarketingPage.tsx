import { Megaphone } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const MarketingPage = () => (
  <GestaoSectorPage
    sector="marketing"
    sectorLabel="Marketing"
    icon={Megaphone}
    description="Campanhas, portfólio, segmentação de clientes e análise de conversão."
  />
);
export default MarketingPage;
