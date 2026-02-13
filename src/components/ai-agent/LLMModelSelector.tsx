import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles } from "lucide-react";

export type LLMProvider = "gemini" | "claude" | "openai" | "perplexity";

interface LLMModelSelectorProps {
  value: LLMProvider;
  onChange: (value: LLMProvider) => void;
  disabled?: boolean;
}

const PROVIDERS: { value: LLMProvider; label: string; icon: string }[] = [
  { value: "gemini", label: "Gemini", icon: "✦" },
  { value: "claude", label: "Claude", icon: "◈" },
  { value: "openai", label: "OpenAI", icon: "◉" },
  { value: "perplexity", label: "Perplexity", icon: "⊛" },
];

const LLMModelSelector = ({ value, onChange, disabled }: LLMModelSelectorProps) => {
  return (
    <Select value={value} onValueChange={(v) => onChange(v as LLMProvider)} disabled={disabled}>
      <SelectTrigger className="h-7 w-[130px] text-xs border-border/50 bg-background/50">
        <Sparkles className="h-3 w-3 mr-1 text-primary" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {PROVIDERS.map((p) => (
          <SelectItem key={p.value} value={p.value} className="text-xs">
            <span className="mr-1.5">{p.icon}</span>
            {p.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default LLMModelSelector;
