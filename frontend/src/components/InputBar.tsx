import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { ArrowUp, File, Terminal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { searchFiles, listCommands, type Command } from "@/lib/api";

interface InputBarProps {
  onSend: (message: string) => void;
  isLoading?: boolean;
}

export function InputBar({ onSend, isLoading = false }: InputBarProps) {
  // File mention suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Slash command suggestions
  const [commands, setCommands] = useState<Command[]>([]);
  const [commandSuggestions, setCommandSuggestions] = useState<Command[]>([]);
  const [showCommandSuggestions, setShowCommandSuggestions] = useState(false);
  const [commandSelectedIndex, setCommandSelectedIndex] = useState(0);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load available commands on mount
  useEffect(() => {
    listCommands().then(setCommands);
  }, []);

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

    const fullText = getInputValue();

    // Check for slash command at the start
    if (fullText.startsWith("/")) {
      const query = fullText.slice(1).split(" ")[0].toLowerCase();
      // Only show suggestions if no space yet (still typing command name)
      if (!fullText.slice(1).includes(" ")) {
        const filtered = commands.filter(
          (c) => c.name.toLowerCase().includes(query)
        );
        setCommandSuggestions(filtered.slice(0, 6));
        setShowCommandSuggestions(filtered.length > 0);
        setCommandSelectedIndex(0);
        setShowSuggestions(false);
        return;
      }
    }
    setShowCommandSuggestions(false);

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
      setShowCommandSuggestions(false);
    }
  };

  const insertCommand = (commandName: string) => {
    if (!editorRef.current) return;
    // Replace full content with command
    editorRef.current.innerHTML = `/${commandName} `;
    // Move cursor to end
    const selection = window.getSelection();
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    range.collapse(false);
    selection?.removeAllRanges();
    selection?.addRange(range);
    setShowCommandSuggestions(false);
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
    // Handle command suggestions
    if (showCommandSuggestions && commandSuggestions.length > 0) {
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setCommandSelectedIndex((prev) =>
          prev > 0 ? prev - 1 : commandSuggestions.length - 1,
        );
        return;
      }
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setCommandSelectedIndex((prev) =>
          prev < commandSuggestions.length - 1 ? prev + 1 : 0,
        );
        return;
      }
      if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertCommand(commandSuggestions[commandSelectedIndex].name);
        return;
      }
      if (e.key === "Escape") {
        setShowCommandSuggestions(false);
        return;
      }
    }

    // Handle file suggestions
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
      className="py-4 px-6 relative bg-gradient-to-t from-background to-transparent"
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
        {/* Command suggestions dropdown */}
        {showCommandSuggestions && commandSuggestions.length > 0 && (
          <div className="absolute bottom-full left-0 mb-2 w-full max-w-md bg-popover border border-border rounded-md shadow-lg overflow-hidden z-50">
            <div className="p-1">
              {commandSuggestions.map((cmd, index) => (
                <button
                  key={cmd.name}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => insertCommand(cmd.name)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-sm text-left ${index === commandSelectedIndex
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50"
                    }`}
                >
                  <Terminal className="h-4 w-4 opacity-70 shrink-0" />
                  <span className="font-medium text-foreground">/{cmd.name}</span>
                  {cmd.description && (
                    <span className="text-xs opacity-60 truncate">{cmd.description}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* File mention suggestions dropdown */}
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
        <div className="relative flex items-center bg-background border border-border/40 rounded-xl input-premium shadow-sm hover:border-border/60 hover:shadow-md transition-all duration-200">
          <div
            ref={editorRef}
            contentEditable
            onInput={handleInput}
            onKeyDown={handleKeyDown}
            className="w-full min-h-[48px] max-h-[200px] overflow-y-auto py-3 pl-5 pr-14 text-sm outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:font-light"
            data-placeholder="Ask to make changes, @mention files, run /commands"
            role="textbox"
            aria-multiline="true"
            aria-label="Message input"
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={isLoading}
            className="absolute right-2 h-8 w-8 top-1/2 -translate-y-1/2 rounded-lg btn-press transition-all duration-150 hover:scale-105 active:scale-95"
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
