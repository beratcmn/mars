import { useEffect, useCallback } from "react";

interface KeyboardShortcuts {
  onNewTab?: () => void;
  onCloseTab?: () => void;
  onToggleSidebar?: () => void;
}

export function useKeyboardShortcuts({
  onNewTab,
  onCloseTab,
  onToggleSidebar,
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
    },
    [onNewTab, onCloseTab, onToggleSidebar],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
