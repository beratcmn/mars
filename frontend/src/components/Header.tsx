import { FolderOpen, ChevronDown, PanelLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  projectPath: string;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function Header({ projectPath, isSidebarOpen, onToggleSidebar }: HeaderProps) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border/50 px-4 relative">

      {/* Left: Sidebar Toggle */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground"
          onClick={onToggleSidebar}
        >
          <PanelLeft className={`h-4 w-4 ${isSidebarOpen ? "text-foreground" : ""}`} />
        </Button>
      </div>

      {/* Center: Project Path */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 text-sm z-0">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{projectPath}</span>
      </div>

      {/* Right: Actions/Placeholder (keeping the existing Open button pattern) */}
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Open
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>
    </header>
  );
}
