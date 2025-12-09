import { Settings as SettingsIcon } from "lucide-react";
import { ModelSelector, type SelectedModel } from "@/components/ModelSelector";
import { AgentSelector } from "@/components/AgentSelector";
import type { Provider, Agent } from "@/lib/api";
import type { PlanetAssignment } from "@/App";

interface SettingsProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
  agents: Agent[];
  selectedAgent: Agent | null;
  planetsByAgent?: Record<string, PlanetAssignment>;
  onAgentChange: (agent: Agent) => void;
}

export function Settings({
  providers,
  connectedProviders,
  selectedModel,
  onModelChange,
  agents,
  selectedAgent,
  planetsByAgent,
  onAgentChange,
}: SettingsProps) {
  return (
    <div className="flex flex-col h-full overflow-auto">
      <div className="max-w-2xl mx-auto w-full p-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-border/50">
          <div className="p-2 rounded-lg bg-muted/50">
            <SettingsIcon className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-semibold serif-title">Settings</h1>
            <p className="text-sm text-muted-foreground">
              Configure your Mars experience
            </p>
          </div>
        </div>

        {/* Model Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">Model</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Choose the AI model for your conversations
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <ModelSelector
              providers={providers}
              connectedProviders={connectedProviders}
              selectedModel={selectedModel}
              onModelChange={onModelChange}
            />
          </div>
        </section>

        {/* Agent Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">Agent</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Select the agent persona for your assistant
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <AgentSelector
              agents={agents}
              selectedAgent={selectedAgent}
              planetsByAgent={planetsByAgent}
              onAgentChange={onAgentChange}
            />
          </div>
        </section>

        {/* Keyboard Shortcuts */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">
              Keyboard Shortcuts
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Quick actions to boost your productivity
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">New Tab</span>
              <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border/50">
                ⌘ T
              </kbd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Close Tab</span>
              <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border/50">
                ⌘ W
              </kbd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Toggle Sidebar</span>
              <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border/50">
                ⌘ B
              </kbd>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Rotate Agent</span>
              <kbd className="px-2 py-1 text-xs rounded bg-muted border border-border/50">
                Tab
              </kbd>
            </div>
          </div>
        </section>

        {/* About */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">About</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Application information
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 flex items-center gap-4">
            <img src="./logo.png" alt="Mars" className="h-10 w-10" />
            <div>
              <p className="text-sm font-medium">Mars</p>
              <p className="text-xs text-muted-foreground">
                AI-powered coding assistant
              </p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
