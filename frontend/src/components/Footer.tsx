import { Sparkles, Clipboard, Settings, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FooterProps {
  model: string;
}

export function Footer({ model }: FooterProps) {
  return (
    <footer className="flex h-9 items-center justify-between border-t border-border/50 px-4 text-xs">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 px-2 text-xs text-muted-foreground hover:text-foreground"
        >
          <Sparkles className="h-3 w-3" />
          {model}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Clipboard className="h-3 w-3" />
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Paperclip className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-foreground"
        >
          <Settings className="h-3 w-3" />
        </Button>
      </div>
    </footer>
  );
}
