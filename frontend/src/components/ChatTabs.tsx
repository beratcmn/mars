import { File, Sparkles, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Tab {
  id: string;
  label: string;
  icon: "file" | "sparkles";
}

interface ChatTabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  onNewTab?: () => void;
  onCloseTab?: (tabId: string) => void;
}

export function ChatTabs({
  tabs,
  activeTab,
  onTabChange,
  onNewTab,
  onCloseTab,
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
            group relative flex items-center gap-1 pr-1 transition-colors
            ${
              activeTab === tab.id
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground"
            }
          `}
        >
          <button
            onClick={() => onTabChange(tab.id)}
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium"
          >
            {getIcon(tab.icon)}
            {tab.label}
          </button>
          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCloseTab?.(tab.id);
            }}
            className="rounded p-0.5 opacity-0 hover:bg-muted group-hover:opacity-100 transition-opacity"
            aria-label="Close tab"
          >
            <X className="h-3 w-3" />
          </button>
          {/* Active indicator */}
          {activeTab === tab.id && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
          )}
        </div>
      ))}
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-foreground"
        onClick={onNewTab}
      >
        <Plus className="h-4 w-4" />
      </Button>
    </div>
  );
}

export type { Tab };
