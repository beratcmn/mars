import { useState, useEffect, useCallback, useRef } from "react";
import { flushSync } from "react-dom";
import { Header } from "@/components/Header";
import { ChatTabs, type Tab } from "@/components/ChatTabs";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { Footer } from "@/components/Footer";
import { type SelectedModel } from "@/components/ModelSelector";
import * as api from "@/lib/api";
import type { Provider } from "@/lib/api";

// Part types for streaming message content
interface TextPart {
  id: string;
  type: "text";
  text: string;
  startTime?: number; // For ordering
}

interface ReasoningPart {
  id: string;
  type: "reasoning";
  text: string;
  startTime?: number; // For ordering
}

interface ToolPart {
  id: string;
  type: "tool";
  tool: string;
  state: {
    status: "pending" | "running" | "completed" | "error";
    input?: Record<string, unknown>;
    output?: string;
    error?: string;
    time?: { start: number; end?: number };
  };
}

type MessagePart = TextPart | ReasoningPart | ToolPart;

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  // Parts for streaming content (tools, reasoning, text)
  parts?: MessagePart[];
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
              const provider = providersData.all.find(
                (p) => p.id === saved.providerId,
              );
              if (provider) modelToSelect = saved;
            }
          } catch (e) {
            console.error("Failed to load settings:", e);
          }

          if (!modelToSelect) {
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

  // Separate effect for Event Listening using direct SSE connection
  // This bypasses pywebview's evaluate_js buffering
  useEffect(() => {
    if (!isInitialized) return;

    // Define the event handler
    const handleEvent = (payload: unknown) => {
      const event = payload as Record<string, unknown>;
      console.log("Mars Event:", event);

      // Handle message.part.updated - text deltas, tool calls, reasoning
      if (event.type === "message.part.updated" && event.properties) {
        const props = event.properties as Record<string, unknown>;
        const part = props.part as Record<string, unknown>;
        const delta = props.delta as string | undefined;
        const sessionId = part.sessionID as string;

        // Handle text parts with delta streaming - use flushSync for immediate updates
        if (part.type === "text" && delta && typeof delta === "string") {
          flushSync(() => {
            setTabs((prevTabs) =>
              prevTabs.map((tab) => {
                if (tab.sessionId !== sessionId) return tab;

                const messages = [...tab.messages];
                const lastMsg = messages[messages.length - 1];

                if (!lastMsg || lastMsg.role !== "assistant") return tab;

                const existingParts = lastMsg.parts || [];
                const updatedParts = [...existingParts];
                const newContent = lastMsg.content + delta;

                const existingTextPart = updatedParts.find(
                  (p): p is TextPart => p.type === "text" && p.id === part.id,
                );
                if (existingTextPart) {
                  existingTextPart.text =
                    (part.text as string) || existingTextPart.text + delta;
                } else {
                  const partTime = part.time as Record<string, number> | undefined;
                  updatedParts.push({
                    id: part.id as string,
                    type: "text",
                    text: (part.text as string) || delta,
                    startTime: partTime?.start || Date.now(),
                  });
                }

                return {
                  ...tab,
                  messages: [
                    ...messages.slice(0, -1),
                    { ...lastMsg, content: newContent, parts: updatedParts },
                  ],
                };
              }),
            );
          });
          return;
        }

        // Handle reasoning and tool parts (non-text)
        setTabs((prevTabs) =>
          prevTabs.map((tab) => {
            if (tab.sessionId !== sessionId) return tab;

            const messages = [...tab.messages];
            const lastMsg = messages[messages.length - 1];

            if (!lastMsg || lastMsg.role !== "assistant") return tab;

            const existingParts = lastMsg.parts || [];
            const updatedParts = [...existingParts];

            // Handle reasoning parts
            if (part.type === "reasoning") {
              const existingReasoningPart = updatedParts.find(
                (p): p is ReasoningPart =>
                  p.type === "reasoning" && p.id === part.id,
              );
              if (existingReasoningPart) {
                existingReasoningPart.text = (part.text as string) || "";
              } else if (part.text) {
                const partTime = part.time as Record<string, number> | undefined;
                updatedParts.push({
                  id: part.id as string,
                  type: "reasoning",
                  text: part.text as string,
                  startTime: partTime?.start || Date.now(),
                });
              }
              return {
                ...tab,
                messages: [
                  ...messages.slice(0, -1),
                  { ...lastMsg, parts: updatedParts },
                ],
              };
            }

            // Handle tool parts
            if (part.type === "tool") {
              const existingToolPart = updatedParts.find(
                (p): p is ToolPart => p.type === "tool" && p.id === part.id,
              );
              const partState = part.state as Record<string, unknown> | undefined;
              const toolState = {
                status: partState?.status || "pending",
                input: partState?.input,
                output: partState?.output,
                error: partState?.error,
                time: partState?.time,
              } as ToolPart["state"];

              if (existingToolPart) {
                existingToolPart.state = toolState;
              } else {
                updatedParts.push({
                  id: part.id as string,
                  type: "tool",
                  tool: (part.tool as string) || "unknown",
                  state: toolState,
                });
              }
              return {
                ...tab,
                messages: [
                  ...messages.slice(0, -1),
                  { ...lastMsg, parts: updatedParts },
                ],
              };
            }

            return tab;
          }),
        );
      }

      // Handle message.updated to capture metadata (tokens, cost, time)
      if (event.type === "message.updated" && event.properties) {
        const props = event.properties as Record<string, unknown>;
        const info = props.info as Record<string, unknown>;
        if (!info) return;

        const sessionId = info.sessionID as string;

        // Only update assistant messages with metadata
        if (info.role === "assistant" && info.tokens) {
          const tokens = info.tokens as Record<string, unknown>;
          setTabs((prevTabs) =>
            prevTabs.map((tab) => {
              if (tab.sessionId === sessionId) {
                const messages = [...tab.messages];
                const lastMsg = messages[messages.length - 1];

                if (lastMsg && lastMsg.role === "assistant") {
                  return {
                    ...tab,
                    messages: [
                      ...messages.slice(0, -1),
                      {
                        ...lastMsg,
                        modelID: (info.modelID as string) || lastMsg.modelID,
                        providerID: (info.providerID as string) || lastMsg.providerID,
                        cost: info.cost as number,
                        tokens: {
                          input: tokens.input as number,
                          output: tokens.output as number,
                          cache: tokens.cache as { read: number; write: number },
                        },
                        time: info.time as { created: number; completed: number },
                      },
                    ],
                  };
                }
              }
              return tab;
            }),
          );
        }
      }

      // Handle session.updated to capture title changes
      if (event.type === "session.updated" && event.properties) {
        const props = event.properties as Record<string, unknown>;
        const info = props.info as Record<string, unknown>;
        if (!info) return;

        const sessionId = info.id as string;
        const newTitle = info.title as string;

        if (sessionId && newTitle) {
          setTabs((prevTabs) =>
            prevTabs.map((tab) => {
              if (tab.sessionId === sessionId && tab.label !== newTitle) {
                return { ...tab, label: newTitle };
              }
              return tab;
            }),
          );
        }
      }
    };

    // Connect directly to SSE stream (bypasses pywebview buffering)
    const cleanup = api.connectToEventStream(handleEvent);

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
        if (api.isPyWebView())
          await api.setCurrentSession(remainingTabs[0].sessionId);
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
          ? {
            ...tab,
            messages: [...tab.messages, userMessage, assistantMessage],
          }
          : tab,
      ),
    );

    setIsLoading(true);

    try {
      if (api.isPyWebView()) {
        const modelParam = selectedModel
          ? {
            providerID: selectedModel.providerId,
            modelID: selectedModel.modelId,
          }
          : undefined;

        await api.streamMessage(currentSessionId, content, modelParam);
      } else {
        // Browser Mock
        await new Promise((r) => setTimeout(r, 500));
        // Mock streaming
        const mockText = "This is a mock streaming response in the browser.";
        for (const char of mockText) {
          setTabs((prev) =>
            prev.map((t) => {
              if (t.id === currentTabId) {
                const msgs = [...t.messages];
                const last = msgs[msgs.length - 1];
                return {
                  ...t,
                  messages: [
                    ...msgs.slice(0, -1),
                    { ...last, content: last.content + char },
                  ],
                };
              }
              return t;
            }),
          );
          await new Promise((r) => setTimeout(r, 50));
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
    <div className="flex h-screen flex-col bg-background font-sans antialiased overflow-hidden">
      <Header projectPath={projectPath} />
      <ChatTabs
        tabs={tabs}
        activeTab={activeTabId || ""}
        onTabChange={handleTabChange}
        onNewTab={handleNewTab}
        onCloseTab={handleCloseTab}
      />
      <div className="flex-1 min-h-0 overflow-hidden">
        <ChatArea
          messages={messages}
          hasActiveSession={activeTab !== undefined}
          onNewChat={handleNewTab}
        />
      </div>
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
              await api.saveSettings({
                ...currentSettings,
                selectedModel: model,
              });
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
