import { useEffect, useState, useRef, useCallback } from "react";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  X,
  PanelLeft,
  Settings,
  Sun,
  Moon,
  Command as CommandIcon,
  Bot,
  Cpu,
  Check,
  ArrowLeft,
  Sparkles,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";
import type { Agent, Provider } from "@/lib/api";
import type { PlanetAssignment } from "@/App";
import type { SelectedModel } from "@/components/ModelSelector";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    onNewChat: () => void;
    onCloseTab: () => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onSetTheme: (theme: "dark-plus" | "soft-light" | "system") => void;
  };
  agents: Agent[];
  selectedAgent: Agent | null;
  providers: Provider[];
  selectedModel: SelectedModel | null;
  planetsByAgent: Record<string, PlanetAssignment>;
  onAgentSelect: (agent: Agent) => void;
  onModelSelect: (model: SelectedModel) => void;
}

export function CommandMenu({
  isOpen,
  onClose,
  actions,
  agents,
  selectedAgent,
  providers,
  selectedModel,
  planetsByAgent,
  onAgentSelect,
  onModelSelect,
}: CommandMenuProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [pages, setPages] = useState<string[]>(["root"]);
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const activePage = pages[pages.length - 1];

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
      // Focus hack
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setIsVisible(false);
      setTimeout(() => {
        setPages(["root"]); // Reset to root when closed
        setSearch("");
      }, 300);
    }
  }, [isOpen]);

  // Toggle with Cmd+K or Cmd+P
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "p") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  const popPage = useCallback(() => {
    setPages((curr) => {
      if (curr.length > 1) {
        setSearch(""); // Clear search when going back
        return curr.slice(0, -1);
      }
      return curr;
    });
  }, []);

  const pushPage = useCallback((page: string) => {
    setPages((curr) => [...curr, page]);
    setSearch(""); // Clear search when entering new page
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out",
        isVisible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-[480px] max-h-[520px] overflow-hidden",
          "border border-border/60 rounded-xl",
          "bg-background/95 backdrop-blur-xl",
          "shadow-2xl shadow-black/10",
          "transition-all duration-300 ease-out",
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2",
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl" />

        <Command
          label="Global Command Menu"
          loop
          className="w-full h-full bg-transparent"
          onKeyDown={(e) => {
            // Go back on Escape if in submenu, otherwise close
            if (e.key === "Escape") {
              e.preventDefault();
              if (pages.length > 1) {
                popPage();
              } else {
                onClose();
              }
            }
            // Go back on Backspace if search is empty
            if (e.key === "Backspace" && !search && pages.length > 1) {
              e.preventDefault();
              popPage();
            }
          }}
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h2 className="serif-title-lg text-foreground/90 flex items-center gap-2">
              {pages.length > 1 ? (
                <button
                  onClick={popPage}
                  className="hover:bg-muted/50 p-1 rounded-md transition-colors -ml-2 mr-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : (
                <CommandIcon className="w-4 h-4" />
              )}
              {activePage === "root" && "Commands"}
              {activePage === "agents" && "Select Agent"}
              {activePage === "models" && "Select Model"}
            </h2>
            <button
              onClick={onClose}
              className="
                p-1.5 rounded-lg
                text-muted-foreground/60 hover:text-foreground
                hover:bg-muted/50
                transition-all duration-200
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative px-4 py-3">
            <div
              className="
              flex items-center gap-3 px-3.5 py-2.5
              bg-muted/30 border border-border/40 rounded-lg
              focus-within:border-border/80 focus-within:bg-muted/40
              transition-all duration-200
            "
            >
              <Search className="h-4 w-4 text-muted-foreground/50" />
              <Command.Input
                ref={inputRef}
                value={search}
                onValueChange={setSearch}
                placeholder={
                  activePage === "agents"
                    ? "Search agents..."
                    : activePage === "models"
                      ? "Search models..."
                      : "Type a command or search..."
                }
                className="
                  flex-1 bg-transparent text-sm outline-none
                  placeholder:text-muted-foreground/40
                  text-foreground
                "
              />
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground/60 serif-title">
              No results found.
            </Command.Empty>

            {activePage === "root" && (
              <>
                <Command.Group
                  heading="Configuration"
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70"
                >
                  <CommandItem onSelect={() => pushPage("agents")}>
                    <Bot className="mr-2 h-4 w-4" />
                    <span>Change Agent</span>
                    <div className="ml-auto text-xs text-muted-foreground/50 flex items-center gap-2">
                      {selectedAgent?.name}
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </div>
                  </CommandItem>
                  <CommandItem onSelect={() => pushPage("models")}>
                    <Cpu className="mr-2 h-4 w-4" />
                    <span>Change Model</span>
                    <div className="ml-auto text-xs text-muted-foreground/50 flex items-center gap-2">
                      {selectedModel?.modelName || selectedModel?.modelId}
                      <ArrowLeft className="w-3 h-3 rotate-180" />
                    </div>
                  </CommandItem>
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border/30 mx-2" />

                <Command.Group
                  heading="Actions"
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70"
                >
                  <CommandItem
                    onSelect={() => {
                      actions.onNewChat();
                      onClose();
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    <span>New Chat</span>
                    <CommandShortcut>⌘T</CommandShortcut>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      actions.onToggleSidebar();
                      onClose();
                    }}
                  >
                    <PanelLeft className="mr-2 h-4 w-4" />
                    <span>Toggle Sidebar</span>
                    <CommandShortcut>⌘B</CommandShortcut>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      actions.onCloseTab();
                      onClose();
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    <span>Close Tab</span>
                    <CommandShortcut>⌘W</CommandShortcut>
                  </CommandItem>

                  <CommandItem
                    onSelect={() => {
                      actions.onOpenSettings();
                      onClose();
                    }}
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </CommandItem>
                </Command.Group>

                <Command.Separator className="my-1 h-px bg-border/30 mx-2" />

                <Command.Group
                  heading="Theme"
                  className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70"
                >
                  <CommandItem
                    onSelect={() => {
                      actions.onSetTheme("dark-plus");
                      onClose();
                    }}
                  >
                    <Moon className="mr-2 h-4 w-4" />
                    <span>Dark Mode</span>
                  </CommandItem>
                  <CommandItem
                    onSelect={() => {
                      actions.onSetTheme("soft-light");
                      onClose();
                    }}
                  >
                    <Sun className="mr-2 h-4 w-4" />
                    <span>Light Mode</span>
                  </CommandItem>
                </Command.Group>
              </>
            )}

            {activePage === "agents" && (
              <Command.Group>
                {agents.map((agent) => (
                  <CommandItem
                    key={agent.name}
                    onSelect={() => {
                      onAgentSelect(agent);
                      onClose();
                    }}
                  >
                    <div className="mr-2 w-5 h-5 rounded-full overflow-hidden flex items-center justify-center bg-muted/50">
                      {planetsByAgent[agent.name] ? (
                        <img
                          src={`./planets/${planetsByAgent[agent.name].image}`}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>
                    <span>{agent.name}</span>
                    {selectedAgent?.name === agent.name && (
                      <Check className="ml-auto w-4 h-4 text-primary" />
                    )}
                  </CommandItem>
                ))}
              </Command.Group>
            )}

            {activePage === "models" && (
              <>
                {providers.map((provider) => (
                  <Command.Group
                    key={provider.id}
                    heading={provider.name}
                    className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70"
                  >
                    {(Array.isArray(provider.models)
                      ? provider.models
                      : Object.entries(provider.models || {}).map(
                          ([id, data]) => ({
                            id,
                            name:
                              typeof data === "object" && data !== null
                                ? (data as { name?: string }).name || id
                                : id,
                          }),
                        )
                    ).map((model) => (
                      <CommandItem
                        key={`${provider.id}-${model.id}`}
                        onSelect={() => {
                          onModelSelect({
                            providerId: provider.id,
                            providerName: provider.name,
                            modelId: model.id,
                            modelName: model.name || model.id,
                          });
                          onClose();
                        }}
                      >
                        <Sparkles className="mr-2 h-4 w-4 opacity-50" />
                        <span>{model.name || model.id}</span>
                        {selectedModel?.providerId === provider.id &&
                          selectedModel?.modelId === model.id && (
                            <Check className="ml-auto w-4 h-4 text-primary" />
                          )}
                      </CommandItem>
                    ))}
                  </Command.Group>
                ))}
              </>
            )}
          </Command.List>

          {/* Footer */}
          <div className="relative border-t border-border/30 px-4 py-3">
            <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/50">
              <span className="flex items-center gap-1.5">
                <Kbd>↑↓</Kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                <span>Select</span>
              </span>
              {pages.length > 1 && (
                <span className="flex items-center gap-1.5">
                  <Kbd>Esc</Kbd>
                  <span>Back</span>
                </span>
              )}
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

// Helper components for consistency
function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="
        relative flex cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none
        data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground
        text-muted-foreground
        transition-colors duration-150
      "
    >
      {children}
    </Command.Item>
  );
}

function CommandShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-xs tracking-widest text-muted-foreground/60">
      {children}
    </span>
  );
}
