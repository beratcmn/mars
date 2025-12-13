import { useEffect, useCallback } from "react";

interface KeyboardShortcuts {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onToggleSidebar?: () => void;
  onOpenAgentModal?: () => void;
  onOpenCommandMenu?: () => void;
}

export function useKeyboardShortcuts({
  onNewTab,
  onCloseTab,
  onToggleSidebar,
  onOpenAgentModal,
  onOpenCommandMenu,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

      // Cmd+K or Cmd+P - Command Menu
      if (isMeta && (e.key === "k" || e.key === "p")) {
        e.preventDefault();
        onOpenCommandMenu?.();
        return;
      }

      // Cmd+T - New Tab
      if (isMeta && e.key === "t") {
        e.preventDefault();
        onNewTab?.();
        return;
      }

      // Cmd+W - Close Tab
      if (isMeta && e.key === "w") {
        e.preventDefault();
        onCloseTab?.();
        return;
      }

      // Cmd+B - Toggle Sidebar
      if (isMeta && e.key === "b") {
        e.preventDefault();
        onToggleSidebar?.();
        return;
      }

      // Tab - Open Agent Modal (only when no modifiers and not in input)
      if (e.key === "Tab" && !isMeta && !e.shiftKey && !e.altKey) {
        // Don't interfere with tab navigation in form inputs
        const activeElement = document.activeElement as HTMLElement;
        const isInputElement =
          activeElement &&
          (activeElement.tagName === "INPUT" ||
            activeElement.tagName === "TEXTAREA" ||
            activeElement.contentEditable === "true");

        if (!isInputElement) {
          e.preventDefault();
          onOpenAgentModal?.();
          return;
        }
      }
    },
    [onNewTab, onCloseTab, onToggleSidebar, onOpenAgentModal],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
