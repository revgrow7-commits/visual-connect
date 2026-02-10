import { type LucideIcon } from "lucide-react";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface PlaceholderPageProps {
  title: string;
  description: string;
  icon: LucideIcon;
}

const PlaceholderPage = ({ title, description, icon: Icon }: PlaceholderPageProps) => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] animate-fade-in">
      <div className="h-16 w-16 rounded-2xl gradient-bordo flex items-center justify-center mb-6">
        <Icon className="h-8 w-8 text-primary-foreground" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-2">{title}</h1>
      <p className="text-muted-foreground text-sm text-center max-w-md mb-6">{description}</p>
      <Button variant="outline" size="sm" onClick={() => navigate("/")}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar ao Início
      </Button>
    </div>
  );
};

export default PlaceholderPage;
