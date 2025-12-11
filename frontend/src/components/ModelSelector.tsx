import { useState, useMemo, useEffect, useRef, startTransition } from "react";
import { ChevronDown, ChevronRight, Check, Search, Box } from "lucide-react";
import { Button } from "@/components/ui/button";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { Provider } from "@/lib/api";

interface SelectedModel {
  providerId: string;
  modelId: string;
  modelName: string;
  providerName: string;
}

interface ModelSelectorProps {
  providers: Provider[];
  connectedProviders: string[];
  selectedModel: SelectedModel | null;
  onModelChange: (model: SelectedModel) => void;
  collapsedProviders?: string[];
  onCollapseChange?: (providerId: string) => void;
}

export function ModelSelector({
  providers,
  connectedProviders,
  selectedModel,
  onModelChange,
  collapsedProviders = [],
  onCollapseChange,
}: ModelSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter to only connected providers and flatten the list
  const filteredGroups = useMemo(() => {
    const query = searchQuery.toLowerCase();

    return providers
      .filter((p) => connectedProviders.includes(p.id))
      .map((provider) => {
        // Handle different model structures (array vs object)
        const rawModels = Array.isArray(provider.models)
          ? provider.models
          : Object.entries(provider.models || {}).map(([id, data]) => ({
              id,
              name:
                typeof data === "object" && data !== null
                  ? (data as { name?: string }).name || id
                  : id,
            }));

        const matches = rawModels.filter(
          (m) =>
            m.name.toLowerCase().includes(query) ||
            m.id.toLowerCase().includes(query),
        );

        return {
          provider,
          models: matches,
        };
      })
      .filter((group) => group.models.length > 0);
  }, [providers, connectedProviders, searchQuery]);

  // Focus input when opening
  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      startTransition(() => setSearchQuery("")); // Reset search on close
    }
  }, [open]);

  const handleModelSelect = (
    providerId: string,
    providerName: string,
    modelId: string,
    modelName: string,
  ) => {
    onModelChange({ providerId, providerName, modelId, modelName });
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-9 gap-2 px-2 text-sm font-normal text-muted-foreground hover:text-foreground transition-colors duration-200"
        >
          <span className="font-medium transition-opacity duration-200">
            <span className="opacity-50 group-hover:opacity-100 transition-opacity">
              {selectedModel?.providerName}
            </span>
            <span className="mx-1 opacity-20">/</span>
            <span>{selectedModel?.modelName}</span>
          </span>
          <ChevronDown className="h-3 w-3 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-0 rounded-md" align="start">
        <div className="flex items-center border-b px-3 py-2.5">
          <Search className="mr-2 h-4 w-4 text-muted-foreground opacity-50" />
          <input
            ref={inputRef}
            className="flex h-5 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <ScrollArea className="h-[300px] overflow-y-auto p-1">
          {filteredGroups.length === 0 ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              {searchQuery ? "No models found" : "No connected providers"}
            </div>
          ) : (
            <div className="space-y-1">
              {filteredGroups.map((group) => {
                const isCollapsed = collapsedProviders.includes(
                  group.provider.id,
                );
                return (
                  <div key={group.provider.id} className="pt-1">
                    <button
                      onClick={() => onCollapseChange?.(group.provider.id)}
                      className="w-full px-2 py-1.5 text-xs font-semibold text-muted-foreground flex items-center gap-1.5 selection:bg-transparent hover:text-foreground hover:bg-muted/50 rounded-sm transition-colors"
                    >
                      {isCollapsed ? (
                        <ChevronRight className="w-3 h-3 opacity-50" />
                      ) : (
                        <ChevronDown className="w-3 h-3 opacity-50" />
                      )}
                      <Box className="w-3 h-3 opacity-50" />
                      {group.provider.name}
                    </button>
                    {!isCollapsed && (
                      <div className="space-y-0.5 ml-2 border-l border-border/40 pl-1">
                        {group.models.map((model) => {
                          const isSelected =
                            selectedModel?.providerId === group.provider.id &&
                            selectedModel?.modelId === model.id;

                          return (
                            <button
                              key={model.id}
                              onClick={() =>
                                handleModelSelect(
                                  group.provider.id,
                                  group.provider.name,
                                  model.id,
                                  model.name,
                                )
                              }
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
                              <span className="truncate mr-2">
                                {model.name}
                              </span>
                              {isSelected && (
                                <Check className="h-3.5 w-3.5 shrink-0" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}

export type { SelectedModel };
