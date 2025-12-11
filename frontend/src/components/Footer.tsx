import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ModelSelector, type SelectedModel } from "@/components/ModelSelector";
import { AgentSelector } from "@/components/AgentSelector";
import type { Provider, Agent } from "@/lib/api";
import type { PlanetAssignment } from "@/App";

interface FooterProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
  collapsedProviders?: string[];
  onCollapseChange?: (providerId: string) => void;
  agents: Agent[];
  selectedAgent: Agent | null;
  planetsByAgent?: Record<string, PlanetAssignment>;
  onAgentChange: (agent: Agent) => void;
  onOpenSettings?: () => void;
}

export function Footer({
  providers,
  connectedProviders,
  selectedModel,
  onModelChange,
  collapsedProviders,
  onCollapseChange,
  agents,
  selectedAgent,
  planetsByAgent,
  onAgentChange,
  onOpenSettings,
}: FooterProps) {
  return (
    <footer className="flex h-9 items-center justify-between px-4 text-xs">
      <div className="flex items-center gap-3">
        <ModelSelector
          providers={providers}
          connectedProviders={connectedProviders}
          selectedModel={selectedModel}
          onModelChange={onModelChange}
          collapsedProviders={collapsedProviders}
          onCollapseChange={onCollapseChange}
        />
        <div className="w-px h-4 bg-border/50 mx-2" />
        <AgentSelector
          agents={agents}
          selectedAgent={selectedAgent}
          planetsByAgent={planetsByAgent}
          onAgentChange={onAgentChange}
        />
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-110 hover:rotate-45 active:scale-95"
          onClick={onOpenSettings}
          title="Open settings in new window"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </footer>
  );
}
