import { Factory } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const OperacaoPage = () => (
  <GestaoSectorPage
    sector="operacao"
    sectorLabel="Operação"
    icon={Factory}
    description="Kanban de produção, tasks, progresso, custos realizados e feedstocks."
  />
);
export default OperacaoPage;
