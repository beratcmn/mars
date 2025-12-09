import { useState, useEffect, useRef, useMemo, startTransition } from "react";
import { Search, X, Earth, Check } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Kbd } from "@/components/ui/kbd";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
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
  const [isVisible, setIsVisible] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(query) ||
        agent.description?.toLowerCase().includes(query),
    );
  }, [agents, searchQuery]);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      // Small delay for smooth entrance
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      startTransition(() => setIsVisible(false));
    }
  }, [isOpen]);

  // Reset highlighted index when filtered agents change
  useEffect(() => {
    startTransition(() => setHighlightedIndex(0));
  }, [filteredAgents]);

  // Set initial highlighted index to selected agent
  useEffect(() => {
    if (isOpen && selectedAgent) {
      const selectedIndex = filteredAgents.findIndex(
        (agent) => agent.name === selectedAgent.name,
      );
      startTransition(() =>
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0),
      );
    }
  }, [isOpen, selectedAgent, filteredAgents]);

  // Focus search input when modal opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
      startTransition(() => setSearchQuery("")); // Reset search on open
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
            prev === 0 ? filteredAgents.length - 1 : prev - 1,
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
      className={`
        fixed inset-0 z-50 flex items-center justify-center
        transition-all duration-300 ease-out
        ${isVisible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent"}
      `}
      onClick={handleBackdropClick}
    >
      <div
        ref={modalRef}
        className={`
          relative w-[480px] max-h-[520px] overflow-hidden
          border border-border/60 rounded-xl
          bg-background/95 backdrop-blur-xl
          shadow-2xl shadow-black/10
          transition-all duration-300 ease-out
          ${
            isVisible
              ? "opacity-100 scale-100 translate-y-0"
              : "opacity-0 scale-95 translate-y-2"
          }
        `}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl" />

        {/* Header */}
        <div className="relative flex items-center justify-between px-5 py-4">
          <h2 className="serif-title-lg text-foreground/90">Select Agent</h2>
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

        {/* Search */}
        <div className="relative mx-4 mb-3">
          <div
            className="
            flex items-center gap-3 px-3.5 py-2.5
            bg-muted/30 border border-border/40 rounded-lg
            focus-within:border-border/80 focus-within:bg-muted/40
            transition-all duration-200
          "
          >
            <Search className="h-4 w-4 text-muted-foreground/50" />
            <input
              ref={searchInputRef}
              type="text"
              className="
                flex-1 bg-transparent text-sm outline-none
                placeholder:text-muted-foreground/40
              "
              placeholder="Search agents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Subtle separator */}
        <div className="mx-4 h-px bg-border/30" />

        {/* Agent List */}
        <ScrollArea className="max-h-[340px]">
          {filteredAgents.length === 0 ? (
            <div className="py-12 text-center">
              <div className="text-sm text-muted-foreground/60 serif-title">
                No agents found
              </div>
            </div>
          ) : (
            <div className="p-2 space-y-0.5">
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
                      group w-full flex items-center gap-3.5 px-3.5 py-3
                      text-left rounded-lg transition-all duration-150 ease-out
                      ${
                        isHighlighted
                          ? "bg-accent"
                          : isSelected
                            ? "bg-muted/40"
                            : "hover:bg-muted/30"
                      }
                    `}
                  >
                    {/* Agent Icon */}
                    <div
                      className={`
                      w-9 h-9 flex items-center justify-center flex-shrink-0
                      rounded-full overflow-hidden
                      ${isHighlighted ? "ring-2 ring-primary/30" : ""}
                      transition-all duration-200
                    `}
                    >
                      {assignment ? (
                        <img
                          src={`./planets/${assignment.image}`}
                          alt={agent.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-muted/50 flex items-center justify-center">
                          <Earth className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                      )}
                    </div>

                    {/* Agent Info */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={`
                        text-sm font-medium truncate
                        transition-colors duration-150
                        ${isHighlighted ? "text-foreground" : "text-foreground/80"}
                      `}
                      >
                        {agent.name}
                      </div>
                      {agent.description && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="text-xs text-muted-foreground/60 truncate mt-0.5 leading-relaxed max-w-[320px] cursor-default">
                              {agent.description}
                            </div>
                          </TooltipTrigger>
                          <TooltipContent side="bottom" align="start">
                            <p className="max-w-[300px]">{agent.description}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </div>

                    {/* Selection Indicator */}
                    {isSelected && (
                      <div className="flex-shrink-0 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer - Keyboard hints */}
        <div className="relative border-t border-border/30 px-4 py-3">
          <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/50">
            <span className="flex items-center gap-1.5">
              <Kbd>↑↓</Kbd>
              <span>Navigate</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Tab</Kbd>
              <span>Next</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>↵</Kbd>
              <span>Select</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Kbd>Esc</Kbd>
              <span>Close</span>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
