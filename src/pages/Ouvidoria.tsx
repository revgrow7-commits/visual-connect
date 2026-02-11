import { useState } from "react";
import OuvidoriaHero from "@/components/ouvidoria/OuvidoriaHero";
import OuvidoriaObjetivos from "@/components/ouvidoria/OuvidoriaObjetivos";
import OuvidoriaForm from "@/components/ouvidoria/OuvidoriaForm";
import OuvidoriaFluxo from "@/components/ouvidoria/OuvidoriaFluxo";
import OuvidoriaDashboard from "@/components/ouvidoria/OuvidoriaDashboard";
import OuvidoriaIncidentes from "@/components/ouvidoria/OuvidoriaIncidentes";
import OuvidoriaPrincipios from "@/components/ouvidoria/OuvidoriaPrincipios";
import OuvidoriaIntegracao from "@/components/ouvidoria/OuvidoriaIntegracao";

const Ouvidoria = () => {
  return (
    <div className="space-y-8 pb-12">
      <OuvidoriaHero />
      <OuvidoriaObjetivos />
      <OuvidoriaForm />
      <OuvidoriaFluxo />
      <OuvidoriaDashboard />
      <OuvidoriaIncidentes />
      <OuvidoriaPrincipios />
      <OuvidoriaIntegracao />
    </div>
  );
};

export default Ouvidoria;
