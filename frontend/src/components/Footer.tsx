import { Settings, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector, type SelectedModel } from "@/components/ModelSelector";
import { AgentSelector } from "@/components/AgentSelector";
import type { Provider, Agent } from "@/lib/api";

interface FooterProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
  agents: Agent[];
  selectedAgent: Agent | null;
  onAgentChange: (agent: Agent) => void;
}

export function Footer({
  providers,
  connectedProviders,
  selectedModel,
  onModelChange,
  agents,
  selectedAgent,
  onAgentChange,
}: FooterProps) {
  return (
    <footer className="flex h-9 items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-3">
        <ModelSelector
          providers={providers}
          connectedProviders={connectedProviders}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
        />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          onAgentChange={onAgentChange}
        />
      </div>
      <div className="flex items-center gap-1">
        <img src="/logo.png" alt="Mars" className="h-4 w-4 mr-2 opacity-40" />
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-110 active:scale-95"
        >
          <Paperclip className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-110 hover:rotate-45 active:scale-95"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </footer>
  );
}
