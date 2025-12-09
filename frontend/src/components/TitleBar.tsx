import { PanelLeft, FolderOpen } from "lucide-react";
import vscodeIcon from "@/assets/vscode.svg";
import * as api from "@/lib/api";
import { cn } from "@/lib/utils";
import { SessionHistory } from "@/components/SessionHistory";
import { Button } from "@/components/ui/button";

interface TitleBarProps {
  className?: string;
  projectPath: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  activeSessionId?: string;
  onSessionSelect: (session: { id: string; title?: string; createdAt?: string }) => void;
  onSessionDelete?: (sessionId: string) => void;
}

const trafficLights = [
  { key: "close", color: "#ff5f57", action: () => api.closeWindow() },
  { key: "minimize", color: "#febc2e", action: () => api.minimizeWindow() },
  { key: "fullscreen", color: "#28c840", action: () => api.fullscreenWindow() },
];

export function TitleBar({
  className,
  projectPath,
  isSidebarOpen,
  onToggleSidebar,
  activeSessionId,
  onSessionSelect,
  onSessionDelete,
}: TitleBarProps) {
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-3 px-3 border-b border-border/70 bg-white", // base
        "text-muted-foreground select-none cursor-move active:cursor-grabbing", // text/behavior
        "pywebview-drag-region", // drag area
        className,
      )}
      onDoubleClick={() => api.maximizeWindow()}
    >
      <div className="flex items-center gap-2">
        {trafficLights.map((item) => (
          <button
            key={item.key}
            className={cn(
              "h-3.5 w-3.5 rounded-full border border-black/10 shadow-sm transition",
              "hover:scale-105 hover:border-black/20 hover:brightness-95",
            )}
            style={{ backgroundColor: item.color }}
            onClick={(e) => {
              e.stopPropagation();
              item.action();
            }}
            aria-label={`${item.key} window`}
          />
        ))}
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground transition-all duration-150 hover:scale-105 active:scale-95"
          onClick={onToggleSidebar}
          title="Toggle sidebar"
        >
          <PanelLeft
            className={cn(
              "h-4 w-4 transition-colors duration-200",
              isSidebarOpen ? "text-foreground" : "",
            )}
          />
        </Button>

        <SessionHistory
          activeSessionId={activeSessionId}
          onSessionSelect={onSessionSelect}
          onSessionDelete={onSessionDelete}
        />
      </div>

      <div className="flex flex-1 items-center justify-center gap-2 text-xs text-muted-foreground">

        <FolderOpen className="h-4 w-4" />
        <span className="font-medium" title={projectPath}>
          {projectPath || "No project selected"}
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-all duration-150"
          onClick={async () => {
            await api.openInEditor(projectPath || undefined);
          }}
        >
          <img src={vscodeIcon} alt="VS Code" className="h-3.5 w-3.5 shrink-0" />
          <span>Open in Editor</span>
        </Button>
      </div>
    </div>
  );
}
