import { Settings, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector, type SelectedModel } from "@/components/ModelSelector";
import type { Provider } from "@/lib/api";

interface FooterProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
}

export function Footer({
  providers,
  connectedProviders,
  selectedModel,
  onModelChange,
}: FooterProps) {
  return (
    <footer className="flex h-9 items-center justify-between border-t border-border/50 px-4 text-xs">
      <div className="flex items-center gap-3">
        <ModelSelector
          providers={providers}
          connectedProviders={connectedProviders}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />

      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </footer>
  );
}
