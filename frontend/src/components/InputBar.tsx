import { useState, useRef, type KeyboardEvent } from "react";
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

  // We need to sync the innerHTML/innerText to detect mentions
  // But standard React onChange doesn't work well with contentEditable for this specific rich text case
  // So we use onInput

  const getInputValue = () => {
    if (!editorRef.current) return "";
    let text = "";
    editorRef.current.childNodes.forEach((node) => {
      if (node.nodeType === Node.TEXT_NODE) {
        text += node.textContent;
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        const el = node as HTMLElement;
        if (el.classList.contains("mention-badge")) {
          // Reconstruct the mention format from data attribute
          const fullPath = el.getAttribute("data-full-path");
          if (fullPath) {
            text += `@[${fullPath}]`;
          } else {
            // Fallback if something weird happens (shouldn't)
            text += el.textContent;
          }
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

    const selection = window.getSelection();
    if (!selection || !selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    // Check text before cursor in the current text node
    if (range.startContainer.nodeType === Node.TEXT_NODE) {
      const textNode = range.startContainer as Text;
      const textBefore =
        textNode.textContent?.slice(0, range.startOffset) || "";
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
        // For folders, we want to stay in text mode (keep one text node)
        if (filename.endsWith("/")) {
          const beforeAt = textContent.slice(0, lastAtPos);
          // The text after the cursor (range.startOffset)
          const afterCursor = textContent.slice(range.startOffset);

          // Update the logic to construct new content
          const newContent = `${beforeAt}@${filename}${afterCursor}`;
          textNode.nodeValue = newContent;

          // Reset cursor position to end of inserted folder
          const newCursorPos = lastAtPos + 1 + filename.length;
          range.setStart(textNode, newCursorPos);
          range.setEnd(textNode, newCursorPos);
          selection.removeAllRanges();
          selection.addRange(range);

          // Trigger search immediately
          handleInput();
          return;
        }

        // For files, we do the specific chip insertion (splitting nodes)

        // 1. Delete the query text
        range.setStart(textNode, lastAtPos);
        range.deleteContents();

        // 2. Insert Chip with display name only
        const chip = document.createElement("span");
        chip.className = "mention-badge";
        chip.contentEditable = "false";
        // Extract basename for display
        const basename = filename.split("/").pop() || filename;
        chip.textContent = basename;
        // Store full path for retrieval
        chip.setAttribute("data-full-path", filename);

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
        setSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1,
        );
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0,
        );
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
    <div
      className="border-t border-border/50 p-4 relative"
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }}
      onDrop={(e) => {
        e.preventDefault();
        const data = e.dataTransfer.getData("application/x-mars-file");
        if (data) {
          try {
            const file = JSON.parse(data);
            insertMention(file.path);
          } catch (err) {
            console.error("Failed to parse dropped file", err);
          }
        }
      }}
    >
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
