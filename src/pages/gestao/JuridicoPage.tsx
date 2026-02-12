import { Scale } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const JuridicoPage = () => (
  <GestaoSectorPage
    sector="juridico"
    sectorLabel="Jurídico"
    icon={Scale}
    description="Contratos, licenças, compliance e dados cadastrais."
  />
);
export default JuridicoPage;
