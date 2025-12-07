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
  // Metadata
  modelID?: string;
  providerID?: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    cache?: {
      read: number;
      write: number;
    };
  };
  time?: {
    created: number;
    completed: number;
  };
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

  // Initialize on first load & Listen for events
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
        if (providersData && providersData.all) {
          setProviders(providersData.all);
          setConnectedProviders(providersData.connected || []);

          // Set default model: check backend settings first, then fallback to API default
          const connectedList = providersData.connected || [];
          let modelToSelect: SelectedModel | null = null;

          try {
            // Load settings from backend JSON
            const settings = await api.loadSettings();
            if (settings.selectedModel) {
              const saved = settings.selectedModel as SelectedModel;
              const provider = providersData.all.find(p => p.id === saved.providerId);
              if (provider) modelToSelect = saved;
            }
          } catch (e) {
            console.error("Failed to load settings:", e);
          }

          if (!modelToSelect) {
            const defaultProvider = providersData.all.find((p) => connectedList.includes(p.id));
            if (defaultProvider && defaultProvider.models?.length > 0) {
              const defaultModelId = providersData.default?.[defaultProvider.id] || defaultProvider.models[0].id;
              const defaultModel = defaultProvider.models.find((m) => m.id === defaultModelId);
              modelToSelect = {
                providerId: defaultProvider.id,
                providerName: defaultProvider.name,
                modelId: defaultModelId,
                modelName: defaultModel?.name || defaultModelId,
              };
            }
          }

          if (modelToSelect) setSelectedModel(modelToSelect);
        }

        // Always start with a fresh session for simplicity
        console.log("Creating fresh session on startup...");
        await createNewTab();
      } else {
        // Browser mode logic skipped for brevity/cleanliness
        await createNewTab();
      }

      setIsInitialized(true);
    };

    init();
  }, [isInitialized, createNewTab]);

  // Separate effect for Event Listening to avoid stale state issues if possible
  // However, since we need access to setTabs, we can put it here.
  useEffect(() => {
    if (!isInitialized) return;

    const cleanup = api.onEvent("mars:event", (event: CustomEvent) => {
      const payload = event.detail;
      console.log("Mars Event:", payload);

      // Handle text delta
      if (payload.type === "message.part.updated" && payload.properties) {
        const { part, delta } = payload.properties;
        const sessionId = part.sessionID;

        // We only support streaming text deltas for now
        if (delta && typeof delta === "string") {
          setTabs((prevTabs) => prevTabs.map(tab => {
            if (tab.sessionId === sessionId) {
              const messages = [...tab.messages];
              const lastMsg = messages[messages.length - 1];

              if (lastMsg && lastMsg.role === "assistant") {
                // Update the last message
                const newContent = lastMsg.content + delta;
                return {
                  ...tab,
                  messages: [
                    ...messages.slice(0, -1),
                    { ...lastMsg, content: newContent }
                  ]
                };
              } else if (lastMsg && lastMsg.role === "user") {
                // Should not happen if we optimistically added an assistant message, 
                // but if we didn't, we might need to create one. 
                // For now, assume handleSend created the placeholder.
              }
            }
            return tab;
          }));
        }
      }
    });

    return () => cleanup();
  }, [isInitialized]);


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
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter((t) => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
        if (api.isPyWebView()) await api.setCurrentSession(remainingTabs[0].sessionId);
      } else {
        setActiveTabId(null);
      }
    }
    if (api.isPyWebView() && tab.sessionId.startsWith("ses")) {
      await api.deleteSession(tab.sessionId);
    }
  };

  // Handle sending a message
  const handleSend = async (content: string) => {
    if (!activeTab) return;

    const currentTabId = activeTab.id;
    const currentSessionId = activeTab.sessionId;

    // 1. Add User Message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    // 2. Add Placeholder Assistant Message
    const assistantMessage: Message = {
      id: `asst-${Date.now()}`,
      role: "assistant",
      content: "", // Start empty
      modelID: selectedModel?.modelId,
      providerID: selectedModel?.providerId,
    };

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === currentTabId
          ? { ...tab, messages: [...tab.messages, userMessage, assistantMessage] }
          : tab,
      ),
    );

    setIsLoading(true);

    try {
      if (api.isPyWebView()) {
        const modelParam = selectedModel
          ? { providerID: selectedModel.providerId, modelID: selectedModel.modelId }
          : undefined;

        await api.streamMessage(currentSessionId, content, modelParam);
      } else {
        // Browser Mock
        await new Promise(r => setTimeout(r, 500));
        // Mock streaming
        const mockText = "This is a mock streaming response in the browser.";
        for (const char of mockText) {
          setTabs(prev => prev.map(t => {
            if (t.id === currentTabId) {
              const msgs = [...t.messages];
              const last = msgs[msgs.length - 1];
              return { ...t, messages: [...msgs.slice(0, -1), { ...last, content: last.content + char }] };
            }
            return t;
          }));
          await new Promise(r => setTimeout(r, 50));
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // We could update the last message to show error
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
        onModelChange={async (model) => {
          setSelectedModel(model);
          if (model) {
            try {
              // Load existing settings first to merge
              const currentSettings = await api.loadSettings();
              await api.saveSettings({ ...currentSettings, selectedModel: model });
            } catch (e) {
              console.error("Failed to save settings:", e);
            }
          }
        }}
      />
    </div>
  );
}

export default App;
