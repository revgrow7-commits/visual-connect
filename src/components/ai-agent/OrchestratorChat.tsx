import { useState } from "react";
import { Brain, X, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import AgentChat from "./AgentChat";
import { cn } from "@/lib/utils";

const OrchestratorChat = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* FAB */}
      <Button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-50 h-14 w-14 rounded-full shadow-lg",
          "bg-gradient-to-br from-primary to-secondary hover:opacity-90 transition-all",
          open && "rotate-90"
        )}
        size="icon"
      >
        {open ? <X className="h-6 w-6 text-white" /> : <Brain className="h-6 w-6 text-white" />}
      </Button>

      {/* Chat Panel */}
      {open && (
        <div className="fixed bottom-36 right-4 lg:bottom-24 lg:right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)]">
          <AgentChat
            sector="orquestrador"
            sectorLabel="Orquestrador"
            className="h-[500px] shadow-xl"
          />
        </div>
      )}
    </>
  );
};

export default OrchestratorChat;
