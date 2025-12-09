import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionHistory } from "@/components/SessionHistory";

interface Session {
  id: string;
  title?: string;
  createdAt?: string;
}

interface HeaderProps {
  projectPath: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeSessionId?: string;
  onSessionSelect: (session: Session) => void;
  onSessionDelete?: (sessionId: string) => void;
}

export function Header({
  projectPath,
  isSidebarOpen,
  onToggleSidebar,
  activeSessionId,
  onSessionSelect,
  onSessionDelete,
}: HeaderProps) {
  return (
    <header className="flex h-8 items-center justify-between border-b border-border/50 px-3 text-xs text-muted-foreground bg-background/80">
      <div className="flex items-center gap-2">
        <span className="truncate" title={projectPath}>
          {projectPath || "No project selected"}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-foreground"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <PanelLeft
            className={`h-4 w-4 transition-colors duration-200 ${isSidebarOpen ? "text-foreground" : ""}`}
          />
        </Button>
        <SessionHistory
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
          onSessionDelete={onSessionDelete}
        />
      </div>
    </header>
  );
}
