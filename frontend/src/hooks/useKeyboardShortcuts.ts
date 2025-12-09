import { useEffect, useCallback } from "react";

interface KeyboardShortcuts {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onToggleSidebar?: () => void;
  onRotateAgent?: () => void;
}

export function useKeyboardShortcuts({
  onNewTab,
  onCloseTab,
  onToggleSidebar,
  onRotateAgent,
}: KeyboardShortcuts) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const isMeta = e.metaKey || e.ctrlKey;

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

      // Tab - Rotate Agent (only when no modifiers and not in input)
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
          onRotateAgent?.();
          return;
        }
      }
    },
    [onNewTab, onCloseTab, onToggleSidebar, onRotateAgent],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
