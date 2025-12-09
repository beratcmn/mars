import { useState, useMemo } from "react";
import {
  Settings as SettingsIcon,
  ChevronDown,
  Check,
  Search,
  Sun,
  Moon,
} from "lucide-react";
import { ModelSelector, type SelectedModel } from "@/components/ModelSelector";
import { AgentSelector } from "@/components/AgentSelector";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Provider, Agent } from "@/lib/api";
import type { PlanetAssignment } from "@/App";
import { useTheme } from "@/hooks/useTheme";
import { searchThemes, type Theme } from "@/themes";

// Available planet icons for selection
const availableIcons: PlanetAssignment[] = [
  { image: "mars.png" },
  { image: "jupiter.png" },
  { image: "mercury.png" },
  { image: "venus_1.png" },
  { image: "venus_2.png" },
  { image: "venus_3.png" },
  { image: "planet.png" },
  { image: "planet_1.png" },
  { image: "planet_2.png" },
  { image: "person.png" },
];

interface SettingsProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
  agents: Agent[];
  selectedAgent: Agent | null;
  planetsByAgent?: Record<string, PlanetAssignment>;
  onAgentChange: (agent: Agent) => void;
  onIconChange?: (agentName: string, icon: PlanetAssignment) => void;
}

function IconPicker({
  currentIcon,
  onSelect,
}: {
  currentIcon?: PlanetAssignment;
  onSelect: (icon: PlanetAssignment) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 p-2 rounded-lg border border-border/50 bg-background hover:bg-muted/50 transition-colors">
          <img
            src={`./planets/${currentIcon?.image || "planet.png"}`}
            alt="Icon"
            className="h-6 w-6"
          />
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="grid grid-cols-5 gap-1">
          {availableIcons.map((icon) => (
            <button
              key={icon.image}
              onClick={() => {
                onSelect(icon);
                setOpen(false);
              }}
              className={`p-2 rounded-lg transition-all hover:bg-muted ${
                currentIcon?.image === icon.image
                  ? "bg-primary/10 ring-1 ring-primary"
                  : ""
              }`}
            >
              <img
                src={`./planets/${icon.image}`}
                alt={icon.image}
                className="h-6 w-6"
              />
              {currentIcon?.image === icon.image && (
                <Check className="absolute top-0.5 right-0.5 h-3 w-3 text-primary" />
              )}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * Theme preview card component
 */
function ThemeCard({
  theme,
  isSelected,
  onSelect,
}: {
  theme: Theme;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isDark = theme.category === "dark";

  return (
    <button
      onClick={onSelect}
      className={`
        relative w-full p-3 rounded-lg border text-left transition-all duration-150
        hover:border-primary/50 hover:shadow-sm
        ${
          isSelected
            ? "border-primary bg-primary/5 ring-1 ring-primary/20"
            : "border-border/50 bg-muted/20 hover:bg-muted/40"
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Color preview squares */}
        <div className="flex-shrink-0 grid grid-cols-2 gap-0.5 w-8 h-8 rounded overflow-hidden border border-border/30">
          <div
            className="w-4 h-4"
            style={{ backgroundColor: theme.variables.background }}
          />
          <div
            className="w-4 h-4"
            style={{ backgroundColor: theme.variables.primary }}
          />
          <div
            className="w-4 h-4"
            style={{ backgroundColor: theme.variables.muted }}
          />
          <div
            className="w-4 h-4"
            style={{ backgroundColor: theme.variables.accent }}
          />
        </div>

        {/* Theme info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium truncate">{theme.name}</span>
            {isDark ? (
              <Moon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            ) : (
              <Sun className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {theme.description}
          </p>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
            <Check className="h-3 w-3 text-primary-foreground" />
          </div>
        )}
      </div>
    </button>
  );
}

/**
 * Searchable theme selector component
 */
function ThemeSelector() {
  const { currentTheme, setTheme } = useTheme();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredThemes = useMemo(
    () => searchThemes(searchQuery),
    [searchQuery],
  );

  return (
    <div className="space-y-3">
      {/* Search input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search themes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-border/50 bg-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/50 transition-colors"
        />
      </div>

      {/* Theme list */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {filteredThemes.length === 0 ? (
          <div className="text-sm text-muted-foreground text-center py-4">
            No themes found
          </div>
        ) : (
          filteredThemes.map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={currentTheme.id === theme.id}
              onSelect={() => setTheme(theme.id)}
            />
          ))
        )}
      </div>
    </div>
  );
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
  onIconChange,
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

        {/* Theme Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">Theme</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Choose your visual style
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20">
            <ThemeSelector />
          </div>
        </section>

        {/* Model Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">Model</h2>
            <p className="text-xs text-muted-foreground mb-3">
              Choose the AI model for your conversations
            </p>
          </div>
          <div className="p-4 rounded-lg border border-border/50 bg-muted/20 flex items-center">
            <div className="flex-1">
              <ModelSelector
                providers={providers}
                connectedProviders={connectedProviders}
                selectedModel={selectedModel}
                onModelChange={onModelChange}
              />
            </div>
          </div>
        </section>

        {/* Default Agent Selection */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">
              Default Agent
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Select the default agent for new conversations
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

        {/* Agent Icons */}
        <section className="space-y-4">
          <div>
            <h2 className="text-sm font-medium text-foreground mb-1">
              Agent Icons
            </h2>
            <p className="text-xs text-muted-foreground mb-3">
              Customize the icon for each agent
            </p>
          </div>
          <div className="rounded-lg border border-border/50 bg-muted/20 divide-y divide-border/50">
            {agents.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground text-center">
                No agents available
              </div>
            ) : (
              agents.map((agent) => (
                <div
                  key={agent.name}
                  className="flex items-center justify-between p-4"
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={`./planets/${planetsByAgent?.[agent.name]?.image || "planet.png"}`}
                      alt={agent.name}
                      className="h-8 w-8"
                    />
                    <div>
                      <p className="text-sm font-medium">{agent.name}</p>
                      {agent.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">
                          {agent.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <IconPicker
                    currentIcon={planetsByAgent?.[agent.name]}
                    onSelect={(icon) => onIconChange?.(agent.name, icon)}
                  />
                </div>
              ))
            )}
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
