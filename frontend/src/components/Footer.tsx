import { Bot, Settings, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FooterProps {
  model: string;
}

export function Footer({ model }: FooterProps) {
  return (
    <footer className="flex h-10 items-center justify-between border-t border-border px-4">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="gap-2 h-7 text-xs">
          <Bot className="h-3.5 w-3.5" />
          {model}
        </Button>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Paperclip className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7">
          <Settings className="h-3.5 w-3.5" />
        </Button>
      </div>
    </footer>
  );
}
