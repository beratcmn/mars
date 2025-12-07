import { File, Sparkles, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tab {
  id: string;
  label: string;
  icon: "file" | "sparkles";
}

interface ChatTabsProps {
  tabs: Tab[];
  activeTabId: string | null;
  onTabSelect: (tab: string) => void;
  onNewTab?: () => void;
  onTabClose?: (tabId: string) => void;
}

export function ChatTabs({
  tabs,
  activeTabId,
  onTabSelect,
  onNewTab,
  onTabClose,
}: ChatTabsProps) {
  const getIcon = (icon: "file" | "sparkles") => {
    switch (icon) {
      case "file":
        return <File className="h-4 w-4" />;
      case "sparkles":
        return <Sparkles className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex items-center gap-1 border-b border-border/50 px-3 pt-1">
      {tabs.map((tab) => (
        <div
          key={tab.id}
          className={`
            group relative flex items-center gap-1 pr-1 transition-all duration-200
            ${activeTabId === tab.id
              ? "text-foreground"
              : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <button
            onClick={() => onTabSelect(tab.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm"
          >
            {getIcon(tab.icon)}
            <span className="truncate max-w-[200px]">{tab.label}</span>
          </button>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTabClose?.(tab.id);
            }}
            className="p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100 transition-all duration-150 rounded-sm hover:scale-110 active:scale-95"
            aria-label="Close tab"
          >
            <X className="h-3 w-3" />
          </button>
          {/* Active indicator - simple underline */}
          {activeTabId === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground tab-indicator animate-scale-in" />
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-110 active:scale-95"
        onClick={onNewTab}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export type { Tab };
