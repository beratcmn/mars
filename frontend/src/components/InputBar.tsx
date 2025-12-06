import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
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
    <div className="border-t border-border p-4">
      <div className="max-w-3xl mx-auto relative">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask to make changes, @mention files, run /commands"
          className="pr-12 h-12 text-base"
          disabled={isLoading}
        />
        <Button
          size="icon"
          onClick={handleSend}
          disabled={!value.trim() || isLoading}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8"
        >
          <ArrowUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
