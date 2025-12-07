import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, File } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchFiles } from "@/lib/api";

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function InputBar({ onSend, isLoading = false }: InputBarProps) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);
  // cursorPosition is no longer directly managed by state for contentEditable,
  // but the concept of where the cursor is relative to text is handled by Selection API.
  // Keeping it here for now, but it's not used in the new logic.
  const [cursorPosition, setCursorPosition] = useState(0);

  // We need to sync the innerHTML/innerText to detect mentions
  // But standard React onChange doesn't work well with contentEditable for this specific rich text case
  // So we use onInput

  const getInputValue = () => {
    if (!editorRef.current) return "";
    // We want the text content but preserving the logical structure for parsing if needed
    // For now, simple text content is enough for the regex check, 
    // BUT we need to be careful about not stripping the chip markers if we parse back.
    // Actually, for the backend, we want standard text `@[path]`.
    // So we can walk the nodes: text nodes are text, .mention-badge nodes are `@[textContent]`.

    let text = "";
    editorRef.current.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains("mention-badge")) {
          // The chip displays "path", we want "@[path]"
          // But wait, the chip content IS just the path usually? 
          // If we put "@[path]" visually in chip, it might be double.
          // Let's assume chip VISUALLY shows "path" or "@path".
          // If we change insertMention to put the raw text inside, we are good.
          // Let's stick to the plan: insert <span class="mention-badge">@[path]</span>
          // So textContent will be "@[path]". Perfect.
          text += el.textContent;
        } else {
          text += el.textContent; // fallback
        }
      }
    });
    return text.replace(/\u00A0/g, " "); // Replace nbsp
  };

  const handleInput = () => {
    // Check for trigger
    if (!editorRef.current) return;

    // We need to find the cursor position relative to text content to support the existing regex logic
    // This is hard with mixed nodes.
    // Simplified approach: formatting check.

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // Check text before cursor in the current text node
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const textBefore = textNode.textContent?.slice(0, range.startOffset) || "";
      const lastAtPos = textBefore.lastIndexOf("@");

      if (lastAtPos !== -1) {
        const prevChar = lastAtPos > 0 ? textBefore[lastAtPos - 1] : " ";
        if (prevChar === " " || prevChar === "\n" || prevChar === "\u00A0") {
          const query = textBefore.slice(lastAtPos + 1);
          if (!query.includes(" ")) {
            // Trigger search
            setShowSuggestions(true);
            searchFiles(query).then((files) => {
              setSuggestions(files.slice(0, 5));
              setSelectedIndex(0);
            });
            return;
          }
        }
      }
    }
    setShowSuggestions(false);
  };

  const handleSend = () => {
    const value = getInputValue().trim();
    if (value && !isLoading) {
      onSend(value);
      if (editorRef.current) {
        editorRef.current.innerHTML = "";
      }
      setShowSuggestions(false);
    }
  };

  const insertMention = (filename: string) => {
    if (!editorRef.current) return;
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // We assume we are in a text node where the @query is
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const textContent = textNode.textContent || "";
      const textBeforeCursor = textContent.slice(0, range.startOffset);
      const lastAtPos = textBeforeCursor.lastIndexOf("@");

      if (lastAtPos !== -1) {
        // Split the text node
        // "Hello @src" -> "Hello " | "@src" | "" (rest)

        // We want to delete "@src" (query)
        // And insert chip

        // 1. Delete the query text
        // The range starts at end of query.
        range.setStart(textNode, lastAtPos);
        range.deleteContents();

        // Now check if folder
        if (filename.endsWith("/")) {
          // Insert text "@filename"
          const newNode = document.createTextNode(`@${filename}`);
          range.insertNode(newNode);
          range.setStartAfter(newNode);
          range.setEndAfter(newNode);
          selection.removeAllRanges();
          selection.addRange(range);
          // Trigger search again (programmatically or wait for input?)
          // We should manually trigger logic or just let user type next char
          // Better: set cursor and maybe trigger search
          setTimeout(() => handleInput(), 0);
          return;
        }

        // 2. Insert Chip
        const chip = document.createElement("span");
        chip.className = "mention-badge";
        chip.contentEditable = "false";
        chip.textContent = `@[${filename}]`;

        range.insertNode(chip);

        // 3. Insert space after
        const space = document.createTextNode("\u00A0");
        range.setStartAfter(chip);
        range.insertNode(space);

        // 4. Move cursor after space
        range.setStartAfter(space);
        range.setEndAfter(space);
        selection.removeAllRanges();
        selection.addRange(range);

        setShowSuggestions(false);
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
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
                  // We need to prevent default mousedown to not lose focus from editor
                  onMouseDown={(e) => e.preventDefault()}
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
        <div className="relative flex items-center bg-transparent border border-border/50 rounded-md focus-within:border-border transition-colors">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[40px] max-h-[200px] overflow-y-auto py-2.5 pl-4 pr-12 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/60"
            data-placeholder="Ask to make changes, @mention files, run /commands"
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-1.5 h-7 w-7 top-1.5"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
