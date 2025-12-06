import { FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  projectPath: string;
}

export function Header({ projectPath }: HeaderProps) {
  return (
    <header className="flex h-11 items-center justify-between border-b border-border/50 px-4">
      <div className="flex items-center gap-2 text-sm">
        <FolderOpen className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">{projectPath}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        className="h-7 gap-1 text-xs text-muted-foreground hover:text-foreground"
      >
        Open
        <ChevronDown className="h-3 w-3" />
      </Button>
    </header>
  );
}
