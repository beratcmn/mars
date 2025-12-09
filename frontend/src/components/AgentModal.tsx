import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Earth } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Agent } from "@/lib/api";
import type { PlanetAssignment } from "@/App";

interface AgentModalProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  planetsByAgent?: Record<string, PlanetAssignment>;
  isOpen: boolean;
  onClose: () => void;
  onAgentSelect: (agent: Agent) => void;
}

export function AgentModal({
  agents,
  selectedAgent,
  planetsByAgent = {},
  isOpen,
  onClose,
  onAgentSelect,
}: AgentModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => 
      agent.name.toLowerCase().includes(query) ||
      agent.description?.toLowerCase().includes(query)
    );
  }, [agents, searchQuery]);

  // Reset highlighted index when filtered agents change
  useEffect(() => {
    setHighlightedIndex(0);
  }, [filteredAgents]);

  // Set initial highlighted index to selected agent
  useEffect(() => {
    if (isOpen && selectedAgent) {
      const selectedIndex = filteredAgents.findIndex(
        (agent) => agent.name === selectedAgent.name
      );
      setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
    }
  }, [isOpen, selectedAgent, filteredAgents]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % filteredAgents.length);
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((prev) => 
            prev === 0 ? filteredAgents.length - 1 : prev - 1
          );
          break;
        case "Enter":
          e.preventDefault();
          if (filteredAgents[highlightedIndex]) {
            onAgentSelect(filteredAgents[highlightedIndex]);
            onClose();
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
        case "Tab":
          e.preventDefault();
          setHighlightedIndex((prev) => (prev + 1) % filteredAgents.length);
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, filteredAgents, highlightedIndex, onAgentSelect, onClose]);

  // Close on backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className="bg-background border rounded-lg shadow-lg w-[400px] max-h-[500px] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Select Agent</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search */}
        <div className="flex items-center border-b px-4 py-3">
          <Search className="mr-3 h-4 w-4 text-muted-foreground" />
          <input
            ref={searchInputRef}
            type="text"
            className="flex-1 bg-transparent outline-none text-sm placeholder:text-muted-foreground"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Agent List */}
        <ScrollArea className="flex-1 max-h-[350px]">
          {filteredAgents.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No agents found
            </div>
          ) : (
            <div className="p-2">
              {filteredAgents.map((agent, index) => {
                const isSelected = selectedAgent?.name === agent.name;
                const isHighlighted = index === highlightedIndex;
                const assignment = planetsByAgent[agent.name];

                return (
                  <button
                    key={agent.name}
                    onClick={() => {
                      onAgentSelect(agent);
                      onClose();
                    }}
                    className={`
                      w-full flex items-center gap-3 px-3 py-3 text-sm rounded-md text-left transition-all duration-150
                      ${isHighlighted
                        ? "bg-accent text-accent-foreground"
                        : isSelected
                        ? "bg-primary/10 text-primary"
                        : "hover:bg-accent/50 hover:text-accent-foreground"
                      }
                    `}
                  >
                    {/* Agent Icon */}
                    <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                      {assignment ? (
                        <img
                          src={`./planets/${assignment.image}`}
                          alt={agent.name}
                          className="w-5 h-5 object-cover rounded-full"
                        />
                      ) : (
                        <Earth className="h-5 w-5 text-red-400" />
                      )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{agent.name}</div>
                      {agent.description && (
                        <div className="text-xs text-muted-foreground truncate mt-0.5">
                          {agent.description}
                        </div>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="border-t p-3 text-xs text-muted-foreground">
          <div className="flex justify-between">
            <span>↑↓ Navigate</span>
            <span>Tab Select</span>
            <span>Enter Confirm</span>
            <span>Esc Close</span>
          </div>
        </div>
      </div>
    </div>
  );
}