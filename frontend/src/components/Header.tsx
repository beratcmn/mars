import { PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SessionHistory } from "@/components/SessionHistory";
import * as api from "@/lib/api";
import vscodeIcon from "@/assets/vscode.svg";

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
    <header className="flex h-11 items-center justify-between border-b border-border/50 px-4 relative">
      {/* Left: Sidebar Toggle + Session History */}
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-all duration-150 hover:scale-105 active:scale-95"
          onClick={onToggleSidebar}
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

      {/* Center: Logo + Project Path */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-sm z-0">
        <img src="./logo.png" alt="Mars" className="h-5 w-5" />
        <span className="font-medium">{projectPath}</span>
      </div>

      {/* Right: Open in Editor button */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
          onClick={async () => {
            // Use the backend API to open VS Code at the project root
            await api.openInEditor(projectPath);
          }}
        >
          <img
            src={vscodeIcon}
            alt="VS Code"
            className="h-3.5 w-3.5 shrink-0"
          />
          <span>Open in Editor</span>
        </Button>
      </div>
    </header>
  );
}
