import { useState } from "react";
import { ChevronDown, Sparkles, Check } from "lucide-react";
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

    // Filter to only connected providers
    const availableProviders = providers.filter((p) =>
        connectedProviders.includes(p.id),
    );

    const handleSelect = (
        providerId: string,
        modelId: string,
        modelName: string,
    ) => {
        onModelChange({ providerId, modelId, modelName });
        setOpen(false);
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                    <Sparkles className="h-3 w-3" />
                    <span>{selectedModel?.modelName || "Select model"}</span>
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-1" align="start">
                {availableProviders.length === 0 ? (
                    <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                        No providers connected
                    </div>
                ) : (
                    <div className="max-h-64 overflow-y-auto">
                        {availableProviders.map((provider) => {
                            // Get models array (handle if it's not an array)
                            const models = Array.isArray(provider.models) ? provider.models : [];
                            console.log(`Provider ${provider.id} models:`, provider.models);

                            return (
                                <div key={provider.id}>
                                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                        {provider.name}
                                    </div>
                                    {models.map((model) => {
                                        const isSelected =
                                            selectedModel?.providerId === provider.id &&
                                            selectedModel?.modelId === model.id;
                                        return (
                                            <button
                                                key={model.id}
                                                onClick={() =>
                                                    handleSelect(provider.id, model.id, model.name)
                                                }
                                                className={`
                        flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-sm
                        ${isSelected ? "bg-accent text-accent-foreground" : "hover:bg-muted"}
                      `}
                                            >
                                                <span>{model.name}</span>
                                                {isSelected && <Check className="h-4 w-4" />}
                                            </button>
                                        );
                                    })}
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
