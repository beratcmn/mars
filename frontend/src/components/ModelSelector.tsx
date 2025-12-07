import { useState } from "react";
import { ChevronDown, ChevronRight, Sparkles, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
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
}

export function ModelSelector({
    providers,
    connectedProviders,
    selectedModel,
    onModelChange,
}: ModelSelectorProps) {
    const [open, setOpen] = useState(false);
    const [expandedProvider, setExpandedProvider] = useState<string | null>(null);

    // Filter to only connected providers
    const availableProviders = providers.filter((p) =>
        connectedProviders.includes(p.id),
    );

    const handleProviderClick = (providerId: string) => {
        setExpandedProvider(expandedProvider === providerId ? null : providerId);
    };

    const handleModelSelect = (
        providerId: string,
        providerName: string,
        modelId: string,
        modelName: string,
    ) => {
        onModelChange({ providerId, providerName, modelId, modelName });
        setOpen(false);
        setExpandedProvider(null);
    };

    // Display label
    const displayLabel = selectedModel
        ? `${selectedModel.providerName} / ${selectedModel.modelName}`
        : "Select model";

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <Sparkles className="h-3 w-3" />
                    <span className="max-w-40 truncate">{displayLabel}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-1" align="start">
                {availableProviders.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No providers connected
                    </div>
                ) : (
                    <div className="max-h-80 overflow-y-auto">
                        {availableProviders.map((provider) => {
                            // Get models (handle different data structures)
                            const models = Array.isArray(provider.models)
                                ? provider.models
                                : Object.entries(provider.models || {}).map(([id, data]) => ({
                                    id,
                                    name: typeof data === "object" && data !== null ? (data as { name?: string }).name || id : id,
                                }));

                            const isExpanded = expandedProvider === provider.id;
                            const hasSelectedModel = selectedModel?.providerId === provider.id;

                            return (
                                <div key={provider.id}>
                                    {/* Provider header - clickable to expand */}
                                    <button
                                        onClick={() => handleProviderClick(provider.id)}
                                        className={`
                      flex w-full items-center justify-between rounded-sm px-2 py-2 text-sm
                      hover:bg-muted transition-colors
                      ${hasSelectedModel ? "font-medium" : ""}
                    `}
                                    >
                                        <span className="flex items-center gap-2">
                                            {isExpanded ? (
                                                <ChevronDown className="h-3 w-3" />
                                            ) : (
                                                <ChevronRight className="h-3 w-3" />
                                            )}
                                            {provider.name}
                                        </span>
                                        {hasSelectedModel && (
                                            <span className="text-xs text-muted-foreground">
                                                {selectedModel?.modelName}
                                            </span>
                                        )}
                                    </button>

                                    {/* Models list - shown when expanded */}
                                    {isExpanded && models.length > 0 && (
                                        <div className="ml-4 border-l border-border/50 pl-2">
                                            {models.map((model) => {
                                                const isSelected =
                                                    selectedModel?.providerId === provider.id &&
                                                    selectedModel?.modelId === model.id;
                                                return (
                                                    <button
                                                        key={model.id}
                                                        onClick={() =>
                                                            handleModelSelect(
                                                                provider.id,
                                                                provider.name,
                                                                model.id,
                                                                model.name,
                                                            )
                                                        }
                                                        className={`
                              flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm
                              ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}
                            `}
                                                    >
                                                        <span>{model.name}</span>
                                                        {isSelected && <Check className="h-3 w-3" />}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {isExpanded && models.length === 0 && (
                                        <div className="ml-4 px-2 py-1.5 text-xs text-muted-foreground">
                                            No models available
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </PopoverContent>
        </Popover>
    );
}

export type { SelectedModel };
