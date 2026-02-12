import { ShoppingCart } from "lucide-react";
import GestaoSectorPage from "./GestaoSectorPage";

const ComprasPage = () => (
  <GestaoSectorPage
    sector="compras"
    sectorLabel="Compras"
    icon={ShoppingCart}
    description="Fornecedores, cotações, gastos por categoria de insumos."
  />
);
export default ComprasPage;
