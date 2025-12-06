import { useState, useEffect, useCallback } from "react";
import { Header } from "@/components/Header";
import { ChatTabs, type Tab } from "@/components/ChatTabs";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { Footer } from "@/components/Footer";
import * as api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface SessionTab extends Tab {
  sessionId: string;
  messages: Message[];
}

function App() {
  const [tabs, setTabs] = useState<SessionTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [projectPath, setProjectPath] = useState("mars");
  const [model] = useState("Haiku 4.5");
  const [isInitialized, setIsInitialized] = useState(false);

  // Get the active tab
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const messages = activeTab?.messages || [];

  // Create a new session tab
  const createNewTab = useCallback(async () => {
    const tabId = `tab-${Date.now()}`;
    let sessionId = tabId; // Fallback for browser mode
    let title = "Untitled";

    if (api.isPyWebView()) {
      const session = await api.createSession();
      if (session) {
        sessionId = session.id;
        title = session.title || "Untitled";
      }
    }

    const newTab: SessionTab = {
      id: tabId,
      sessionId,
      label: title,
      icon: "sparkles",
      messages: [],
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabId);

    // Set as current session in backend
    if (api.isPyWebView()) {
      await api.setCurrentSession(sessionId);
    }

    return newTab;
  }, []);

  // Initialize on first load
  useEffect(() => {
    const init = async () => {
      if (isInitialized) return;

      if (api.isPyWebView()) {
        // Check if server is running
        const running = await api.isServerRunning();
        if (!running) {
          await api.startServer();
        }

        // Get current project info
        const project = await api.getCurrentProject();
        if (project?.name) {
          setProjectPath(project.name);
        }

        // Load existing sessions or create new one
        const sessions = await api.listSessions();
        if (sessions.length > 0) {
          // Load existing sessions as tabs
          const sessionTabs: SessionTab[] = sessions.map((session, index) => ({
            id: `tab-${session.id}`,
            sessionId: session.id,
            label: session.title || `Session ${index + 1}`,
            icon: "sparkles" as const,
            messages: [],
          }));
          setTabs(sessionTabs);
          setActiveTabId(sessionTabs[0].id);
          await api.setCurrentSession(sessionTabs[0].sessionId);
        } else {
          // Create first session
          await createNewTab();
        }
      } else {
        // Browser mode - create a mock tab
        await createNewTab();
      }

      setIsInitialized(true);
    };

    init();
  }, [isInitialized, createNewTab]);

  // Handle tab change
  const handleTabChange = async (tabId: string) => {
    setActiveTabId(tabId);
    const tab = tabs.find((t) => t.id === tabId);
    if (tab && api.isPyWebView()) {
      await api.setCurrentSession(tab.sessionId);
    }
  };

  // Handle new tab button
  const handleNewTab = async () => {
    await createNewTab();
  };

  // Handle sending a message
  const handleSend = async (content: string) => {
    if (!activeTab) return;

    // Add user message to current tab
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === activeTabId
          ? { ...tab, messages: [...tab.messages, userMessage] }
          : tab
      )
    );
    setIsLoading(true);

    try {
      if (api.isPyWebView()) {
        // Real API call via PyWebView
        const { response } = await api.sendMessage(content, {
          sessionId: activeTab.sessionId,
        });

        if (response) {
          // Extract text from response parts
          const textParts = response.parts
            .filter((p) => p.type === "text" && p.text)
            .map((p) => p.text)
            .join("\n");

          const assistantMessage: Message = {
            id: response.info.id,
            role: "assistant",
            content: textParts || "No response",
          };

          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === activeTabId
                ? { ...tab, messages: [...tab.messages, assistantMessage] }
                : tab
            )
          );
        }
      } else {
        // Mock response for browser development
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `[Browser Dev Mode]\n\nThis is a placeholder response. Run with PyWebView for real OpenCode integration.\n\nYou said: "${content}"`,
        };

        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === activeTabId
              ? { ...tab, messages: [...tab.messages, assistantMessage] }
              : tab
          )
        );
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };

      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === activeTabId
            ? { ...tab, messages: [...tab.messages, errorMessage] }
            : tab
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background font-sans antialiased">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-background font-sans antialiased">
      <Header projectPath={projectPath} />
      <ChatTabs
        tabs={tabs}
        activeTab={activeTabId || ""}
        onTabChange={handleTabChange}
        onNewTab={handleNewTab}
      />
      <ChatArea messages={messages} />
      <InputBar onSend={handleSend} isLoading={isLoading} />
      <Footer model={model} />
    </div>
  );
}

export default App;
