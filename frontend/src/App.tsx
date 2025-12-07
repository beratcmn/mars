import { useState, useEffect, useCallback, useRef } from "react";
import { Header } from "@/components/Header";
import { ChatTabs, type Tab } from "@/components/ChatTabs";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { Footer } from "@/components/Footer";
import { type SelectedModel } from "@/components/ModelSelector";
import * as api from "@/lib/api";
import type { Provider } from "@/lib/api";

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
  const [isInitialized, setIsInitialized] = useState(false);
  const initStarted = useRef(false); // Prevent double init from StrictMode

  // Provider/model state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(
    null,
  );

  // Get the active tab
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const messages = activeTab?.messages || [];

  // Create a new session tab
  const createNewTab = useCallback(async () => {
    const tabId = `tab-${Date.now()}`;
    let sessionId = tabId; // Fallback for browser mode
    let title = "Untitled";

    if (api.isPyWebView()) {
      console.log("Creating session via PyWebView...");
      const session = await api.createSession();
      console.log("Session creation result:", session);
      if (session) {
        sessionId = session.id;
        title = session.title || "Untitled";
      } else {
        console.error("Failed to create session! Will use fallback tab ID.");
      }
    }

    const newTab: SessionTab = {
      id: tabId,
      sessionId,
      label: title,
      icon: "sparkles",
      messages: [],
    };

    console.log("New tab created:", newTab);

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(tabId);

    // Set as current session in backend
    if (api.isPyWebView() && sessionId !== tabId) {
      await api.setCurrentSession(sessionId);
    }

    return newTab;
  }, []);

  // Initialize on first load
  useEffect(() => {
    const init = async () => {
      // Prevent double initialization from React StrictMode
      if (isInitialized || initStarted.current) return;
      initStarted.current = true;

      // Wait for PyWebView to be ready (handles race condition)
      const isPyWebViewReady = await api.waitForPyWebView();
      console.log("PyWebView ready:", isPyWebViewReady);

      if (isPyWebViewReady) {
        // Check if server is running
        const running = await api.isServerRunning();
        console.log("Server running:", running);
        if (!running) {
          console.log("Starting server...");
          await api.startServer();
        }

        // Get current project info
        const project = await api.getCurrentProject();
        if (project?.name) {
          setProjectPath(project.name);
        }

        // Load providers
        const providersData = await api.getProviders();
        console.log("Providers data:", providersData);

        if (providersData && providersData.all) {
          setProviders(providersData.all);
          setConnectedProviders(providersData.connected || []);

          // Set default model from first connected provider
          const connectedList = providersData.connected || [];
          const defaultProvider = providersData.all.find((p) =>
            connectedList.includes(p.id),
          );
          if (defaultProvider && defaultProvider.models?.length > 0) {
            const defaultModelId =
              providersData.default?.[defaultProvider.id] ||
              defaultProvider.models[0].id;
            const defaultModel = defaultProvider.models.find(
              (m) => m.id === defaultModelId,
            );
            setSelectedModel({
              providerId: defaultProvider.id,
              providerName: defaultProvider.name,
              modelId: defaultModelId,
              modelName: defaultModel?.name || defaultModelId,
            });
          }
        }

        // Always start with a fresh session for simplicity
        console.log("Creating fresh session on startup...");
        await createNewTab();
      } else {
        // Browser mode - create a mock tab and load mock providers
        console.log("Browser mode - creating mock tab");
        const providersData = await api.getProviders();
        if (providersData) {
          setProviders(providersData.all);
          setConnectedProviders(providersData.connected);
          // Set first model as default
          const defaultProvider = providersData.all.find((p) =>
            providersData.connected.includes(p.id),
          );
          if (defaultProvider && defaultProvider.models.length > 0) {
            setSelectedModel({
              providerId: defaultProvider.id,
              providerName: defaultProvider.name,
              modelId: defaultProvider.models[0].id,
              modelName: defaultProvider.models[0].name,
            });
          }
        }
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

  // Handle close tab
  const handleCloseTab = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;

    // Remove tab from state
    setTabs((prev) => prev.filter((t) => t.id !== tabId));

    // If closing active tab, switch to another tab or set to null
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter((t) => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
        if (api.isPyWebView()) {
          await api.setCurrentSession(remainingTabs[0].sessionId);
        }
      } else {
        setActiveTabId(null);
      }
    }

    // Optionally delete session from OpenCode
    if (api.isPyWebView() && tab.sessionId.startsWith("ses")) {
      await api.deleteSession(tab.sessionId);
    }
  };

  // Handle sending a message
  const handleSend = async (content: string) => {
    if (!activeTab) {
      console.error("No active tab!");
      return;
    }

    console.log("Sending message:", content);
    console.log("Active tab:", activeTab.id, "Session:", activeTab.sessionId);

    // Store the tab id locally to avoid closure issues
    const currentTabId = activeTab.id;

    // Add user message to current tab
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === currentTabId
          ? { ...tab, messages: [...tab.messages, userMessage] }
          : tab,
      ),
    );
    setIsLoading(true);

    try {
      if (api.isPyWebView()) {
        console.log("Using PyWebView API");
        // Real API call via PyWebView
        const { response } = await api.sendMessage(content, {
          sessionId: activeTab.sessionId,
          model: selectedModel?.modelId,
        });

        console.log("Response received:", response);

        if (response) {
          // Extract text from response parts (with null checks)
          const parts = response.parts || [];
          const textParts = parts
            .filter((p) => p.type === "text" && p.text)
            .map((p) => p.text)
            .join("\n");

          const assistantMessage: Message = {
            id: response.info?.id || Date.now().toString(),
            role: "assistant",
            content: textParts || "No response content",
          };

          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === currentTabId
                ? { ...tab, messages: [...tab.messages, assistantMessage] }
                : tab,
            ),
          );
        } else {
          // No response received
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: "assistant",
            content: "Error: No response received from server",
          };
          setTabs((prev) =>
            prev.map((tab) =>
              tab.id === currentTabId
                ? { ...tab, messages: [...tab.messages, errorMessage] }
                : tab,
            ),
          );
        }
      } else {
        console.log("Using browser mock mode");
        // Mock response for browser development
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `[Browser Dev Mode]\n\nThis is a placeholder response. Run with PyWebView for real OpenCode integration.\n\nYou said: "${content}"`,
        };

        console.log("Adding mock response to tab:", currentTabId);

        setTabs((prev) =>
          prev.map((tab) =>
            tab.id === currentTabId
              ? { ...tab, messages: [...tab.messages, assistantMessage] }
              : tab,
          ),
        );
      }
    } catch (error) {
      console.error("Error sending message:", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };

      setTabs((prev) =>
        prev.map((tab) =>
          tab.id === currentTabId
            ? { ...tab, messages: [...tab.messages, errorMessage] }
            : tab,
        ),
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
        onCloseTab={handleCloseTab}
      />
      <ChatArea
        messages={messages}
        hasActiveSession={activeTab !== undefined}
        onNewChat={handleNewTab}
      />
      <InputBar onSend={handleSend} isLoading={isLoading} />
      <Footer
        providers={providers}
        connectedProviders={connectedProviders}
        selectedModel={selectedModel}
        onModelChange={setSelectedModel}
      />
    </div>
  );
}

export default App;
