import { useEffect, useState } from "react";
import { Command } from "cmdk";
import {
  Search,
  Plus,
  X,
  PanelLeft,
  Settings,
  Sun,
  Moon,
  Command as CommandIcon,
} from "lucide-react";
import { Kbd } from "@/components/ui/kbd";
import { cn } from "@/lib/utils";

interface CommandMenuProps {
  isOpen: boolean;
  onClose: () => void;
  actions: {
    onNewChat: () => void;
    onCloseTab: () => void;
    onToggleSidebar: () => void;
    onOpenSettings: () => void;
    onSetTheme: (theme: "dark-plus" | "soft-light" | "system") => void;
  };
}

export function CommandMenu({ isOpen, onClose, actions }: CommandMenuProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Handle animation timing
  useEffect(() => {
    if (isOpen) {
      requestAnimationFrame(() => setIsVisible(true));
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  // Toggle with Cmd+K or Cmd+P
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" || e.key === "p") && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // This case is usually handled by parent, but good for safety
        }
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-all duration-300 ease-out",
        isVisible ? "bg-black/40 backdrop-blur-sm" : "bg-transparent",
      )}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className={cn(
          "relative w-[480px] max-h-[520px] overflow-hidden",
          "border border-border/60 rounded-xl",
          "bg-background/95 backdrop-blur-xl",
          "shadow-2xl shadow-black/10",
          "transition-all duration-300 ease-out",
          isVisible
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-2",
        )}
      >
        {/* Subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none rounded-xl" />

        <Command
          label="Global Command Menu"
          loop
          className="w-full h-full bg-transparent"
        >
          {/* Header */}
          <div className="relative flex items-center justify-between px-5 py-4 border-b border-border/30">
            <h2 className="serif-title-lg text-foreground/90 flex items-center gap-2">
              <CommandIcon className="w-4 h-4" />
              Commands
            </h2>
            <button
              onClick={onClose}
              className="
                p-1.5 rounded-lg
                text-muted-foreground/60 hover:text-foreground
                hover:bg-muted/50
                transition-all duration-200
              "
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative px-4 py-3">
            <div
              className="
              flex items-center gap-3 px-3.5 py-2.5
              bg-muted/30 border border-border/40 rounded-lg
              focus-within:border-border/80 focus-within:bg-muted/40
              transition-all duration-200
            "
            >
              <Search className="h-4 w-4 text-muted-foreground/50" />
              <Command.Input
                placeholder="Type a command or search..."
                className="
                  flex-1 bg-transparent text-sm outline-none
                  placeholder:text-muted-foreground/40
                  text-foreground
                "
              />
            </div>
          </div>

          <Command.List className="max-h-[300px] overflow-y-auto overflow-x-hidden px-2 pb-2 scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground/60 serif-title">
              No results found.
            </Command.Empty>

            <Command.Group heading="Actions" className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">
              <CommandItem
                onSelect={() => {
                  actions.onNewChat();
                  onClose();
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                <span>New Chat</span>
                <CommandShortcut>⌘T</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  actions.onToggleSidebar();
                  onClose();
                }}
              >
                <PanelLeft className="mr-2 h-4 w-4" />
                <span>Toggle Sidebar</span>
                <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  actions.onCloseTab();
                  onClose();
                }}
              >
                <X className="mr-2 h-4 w-4" />
                <span>Close Tab</span>
                <CommandShortcut>⌘W</CommandShortcut>
              </CommandItem>

              <CommandItem
                onSelect={() => {
                  actions.onOpenSettings();
                  onClose();
                }}
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </CommandItem>
            </Command.Group>

            <Command.Separator className="my-1 h-px bg-border/30 mx-2" />

            <Command.Group heading="Theme" className="px-2 py-1.5 text-xs font-medium text-muted-foreground/70">
              <CommandItem
                onSelect={() => {
                  actions.onSetTheme("dark-plus");
                  onClose();
                }}
              >
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark Mode</span>
              </CommandItem>
              <CommandItem
                onSelect={() => {
                  actions.onSetTheme("soft-light");
                  onClose();
                }}
              >
                <Sun className="mr-2 h-4 w-4" />
                <span>Light Mode</span>
              </CommandItem>
            </Command.Group>
          </Command.List>

          {/* Footer */}
          <div className="relative border-t border-border/30 px-4 py-3">
            <div className="flex items-center justify-center gap-5 text-[11px] text-muted-foreground/50">
              <span className="flex items-center gap-1.5">
                <Kbd>↑↓</Kbd>
                <span>Navigate</span>
              </span>
              <span className="flex items-center gap-1.5">
                <Kbd>↵</Kbd>
                <span>Select</span>
              </span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
}

// Helper components for consistency
function CommandItem({
  children,
  onSelect,
}: {
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="
        relative flex cursor-default select-none items-center rounded-lg px-3 py-2.5 text-sm outline-none
        data-[selected='true']:bg-accent data-[selected='true']:text-accent-foreground
        text-muted-foreground
        transition-colors duration-150
      "
    >
      {children}
    </Command.Item>
  );
}

function CommandShortcut({ children }: { children: React.ReactNode }) {
  return (
    <span className="ml-auto text-xs tracking-widest text-muted-foreground/60">
      {children}
    </span>
  );
}
