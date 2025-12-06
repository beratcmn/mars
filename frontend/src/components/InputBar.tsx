import { useState, type KeyboardEvent } from "react";
import { ArrowUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function InputBar({ onSend, isLoading = false }: InputBarProps) {
  const [value, setValue] = useState("");

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/50 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="relative flex items-center">
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to make changes, @mention files, run /commands"
            className="w-full h-11 pl-4 pr-12 text-sm bg-muted/50 border border-border/50 rounded-lg placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring/50 focus:border-ring/50 transition-colors"
            disabled={isLoading}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className="absolute right-1.5 h-8 w-8 rounded-md"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
