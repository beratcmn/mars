import { FolderOpen, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeaderProps {
  projectPath: string;
}

export function Header({ projectPath }: HeaderProps) {
  return (
    <header className="flex h-12 items-center justify-between border-b border-border px-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <FolderOpen className="h-4 w-4" />
        <span className="font-medium text-foreground">{projectPath}</span>
      </div>
      <Button variant="outline" size="sm" className="gap-1">
        Open
        <ChevronDown className="h-3 w-3" />
      </Button>
    </header>
  );
}
