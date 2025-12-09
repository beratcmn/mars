import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import { ChevronDown, Earth, Check, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Agent } from "@/lib/api";

import type { PlanetAssignment } from "@/App";

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgent: Agent | null;
  planetsByAgent?: Record<string, PlanetAssignment>;
  onAgentChange: (agent: Agent) => void;
}

export function AgentSelector({
  agents,
  selectedAgent,
  planetsByAgent = {},
  onAgentChange,
}: AgentSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredAgents = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return agents.filter((agent) => agent.name.toLowerCase().includes(query));
  }, [agents, searchQuery]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      startTransition(() => setSearchQuery("")); // Reset search on close
    }
  }, [open]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <div className="flex items-center justify-center w-5 h-5">
            {selectedAgent && planetsByAgent[selectedAgent.name] ? (
              <img
                src={`./planets/${planetsByAgent[selectedAgent.name].image}`}
                alt={selectedAgent.name}
                className="w-4 h-4 object-cover rounded-full"
              />
            ) : (
              <Earth className="h-4 w-4 text-red-400" />
            )}
          </div>
          <span className="font-medium transition-opacity duration-200">
            {selectedAgent?.name || "Select Agent"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 rounded-md" align="start">
        <div className="flex items-center border-b px-3 py-2.5">
          <Search className="mr-2 h-4 w-4 text-muted-foreground opacity-50" />
          <input
            ref={inputRef}
            className="flex h-5 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search agents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[200px] overflow-y-auto p-1">
          {filteredAgents.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No agents found
            </div>
          ) : (
            <div className="space-y-1">
              {filteredAgents.map((agent) => {
                const isSelected = selectedAgent?.name === agent.name;
                const assignment = planetsByAgent[agent.name];

                return (
                  <button
                    key={agent.name}
                    onClick={() => {
                      onAgentChange(agent);
                      setOpen(false);
                    }}
                    className={`
                       w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-sm text-left
                       transition-all duration-150 ease-out
                       ${
                         isSelected
                           ? "bg-primary text-primary-foreground"
                           : "hover:bg-accent hover:text-accent-foreground hover:translate-x-0.5 text-foreground"
                       }
                     `}
                  >
                    <span className="truncate mr-2 flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        {assignment ? (
                          <img
                            src={`./planets/${assignment.image}`}
                            alt={agent.name}
                            className="w-4 h-4 object-cover rounded-full"
                          />
                        ) : (
                          <Earth className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                      {agent.name}
                    </span>
                    {isSelected && <Check className="h-3.5 w-3.5 shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
