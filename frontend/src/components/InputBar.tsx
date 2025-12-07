import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchFiles } from "@/lib/api";

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function InputBar({ onSend, isLoading = false }: InputBarProps) {
  const [value, setValue] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionQuery, setMentionQuery] = useState("");
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Handle @ mentions
  useEffect(() => {
    const lastAtPos = value.lastIndexOf("@", cursorPosition - 1);
    if (lastAtPos !== -1) {
      // Check if it's a valid mention start (start of line or preceded by space)
      const prevChar = lastAtPos > 0 ? value[lastAtPos - 1] : " ";
      if (prevChar === " " || prevChar === "\n") {
        const query = value.slice(lastAtPos + 1, cursorPosition);
        // Don't search if query contains spaces (end of mention)
        if (!query.includes(" ")) {
          setMentionQuery(query);
          setShowSuggestions(true);
          // Debounced search could go here, but for now direct call
          searchFiles(query).then((files) => {
            setSuggestions(files.slice(0, 5));
            setSelectedIndex(0);
          });
          return;
        }
      }
    }
    setShowSuggestions(false);
  }, [value, cursorPosition]);

  const handleSend = () => {
    if (value.trim() && !isLoading) {
      onSend(value.trim());
      setValue("");
      setShowSuggestions(false);
    }
  };

  const insertMention = (filename: string) => {
    const lastAtPos = value.lastIndexOf("@", cursorPosition - 1);
    if (lastAtPos !== -1) {
      const before = value.slice(0, lastAtPos);
      const after = value.slice(cursorPosition);
      const newValue = `${before}@[${filename}] ${after}`;
      setValue(newValue);
      setShowSuggestions(false);
      // Move cursor after the insertion
      setTimeout(() => {
        if (inputRef.current) {
          const newPos = lastAtPos + filename.length + 4; // @[] + space
          inputRef.current.setSelectionRange(newPos, newPos);
          inputRef.current.focus();
        }
      }, 0);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (showSuggestions && suggestions.length > 0) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertMention(suggestions[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowSuggestions(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t border-border/50 p-4 relative">
      <div className="max-w-2xl mx-auto relative">
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-sm bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50">
            <div className="p-1">
              {suggestions.map((file, index) => (
                <button
                  key={file}
                  onClick={() => insertMention(file)}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded-sm text-left ${index === selectedIndex
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:bg-accent/50"
                    }`}
                >
                  <File className="h-3.5 w-3.5 opacity-70" />
                  <span className="truncate">{file}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="relative flex items-center">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setCursorPosition(e.target.selectionStart || 0);
            }}
            onClick={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
            onKeyUp={(e) => setCursorPosition(e.currentTarget.selectionStart || 0)}
            onKeyDown={handleKeyDown}
            placeholder="Ask to make changes, @mention files, run /commands"
            className="w-full h-10 pl-4 pr-12 text-sm bg-transparent border border-border/50 placeholder:text-muted-foreground/60 focus:outline-none focus:border-border transition-colors rounded-md"
            disabled={isLoading}
            autoComplete="off"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!value.trim() || isLoading}
            className="absolute right-1.5 h-7 w-7"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
