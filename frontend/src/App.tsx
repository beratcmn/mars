import { useState, useEffect, useCallback, useRef } from "react";
import { ChatTabs, type Tab } from "@/components/ChatTabs";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { Footer } from "@/components/Footer";
import { FileExplorer } from "@/components/FileExplorer";
import { CodeViewer } from "@/components/CodeViewer";
import { TaskPanel } from "@/components/TaskPanel";
import { TitleBar } from "@/components/TitleBar";
import { Settings } from "@/components/Settings";
import { type SelectedModel } from "@/components/ModelSelector";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import * as api from "@/lib/api";
import type { Provider, Agent, FileEntry } from "@/lib/api";
import { cn } from "@/lib/utils";

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
  type: "session";
  sessionId: string;
  messages: Message[];
  todos?: api.Todo[];
}

interface FileTab extends Tab {
  type: "file";
  filePath: string;
}

interface SettingsTab extends Tab {
  type: "settings";
}

type AppTab = SessionTab | FileTab | SettingsTab;

export interface PlanetAssignment {
  image: string;
}

// Planet image assignment for agents
const planetPalette: PlanetAssignment[] = [
  { image: "mars.png" },
  { image: "jupiter.png" },
  { image: "mercury.png" },
  { image: "venus_1.png" },
  { image: "venus_2.png" },
  { image: "venus_3.png" },
  { image: "planet.png" },
  { image: "planet_1.png" },
  { image: "planet_2.png" },
];

/**
 * Pure function to apply a single SSE event to the tabs state.
 * This enables batching multiple events into a single state update.
 */
function applyEventToTabs(
  tabs: AppTab[],
  event: Record<string, unknown>,
): AppTab[] {
  // Handle message.part.updated - text deltas, tool calls, reasoning
  if (event.type === "message.part.updated" && event.properties) {
    const props = event.properties as Record<string, unknown>;
    const part = props.part as Record<string, unknown>;
    const delta = props.delta as string | undefined;
    const sessionId = part.sessionID as string;

    return tabs.map((tab) => {
      if (tab.type !== "session" || tab.sessionId !== sessionId) return tab;

      const messages = [...tab.messages];
      const lastMsg = messages[messages.length - 1];

      if (!lastMsg || lastMsg.role !== "assistant") return tab;

      const existingParts = lastMsg.parts || [];
      const updatedParts = [...existingParts];

      // Handle text parts with delta streaming
      if (part.type === "text" && delta && typeof delta === "string") {
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
      }

      // Handle reasoning parts
      if (part.type === "reasoning") {
        const existingReasoningPart = updatedParts.find(
          (p): p is ReasoningPart => p.type === "reasoning" && p.id === part.id,
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

        // Check if this is a TodoWrite tool completing - extract todos to update panel
        const toolName = ((part.tool as string) || "").toLowerCase();
        const isCompleted = toolState.status === "completed";

        if (toolName === "todowrite" && isCompleted && toolState.input) {
          // Extract todos from input (the model sends todos in input.todos)
          const input = toolState.input as Record<string, unknown>;
          const todosFromInput = input.todos as Array<{
            id: string;
            content: string;
            status?: string;
            priority?: string;
          }>;

          if (todosFromInput && Array.isArray(todosFromInput)) {
            // Map to the Todo type format
            const todos = todosFromInput.map((t) => ({
              id: t.id,
              content: t.content,
              state: (t.status === "in_progress"
                ? "in_progress"
                : t.status === "completed"
                  ? "completed"
                  : "pending") as "pending" | "in_progress" | "completed",
              priority: (t.priority === "high"
                ? "high"
                : t.priority === "medium"
                  ? "medium"
                  : "low") as "high" | "medium" | "low",
            }));

            return {
              ...tab,
              todos,
              messages: [
                ...messages.slice(0, -1),
                { ...lastMsg, parts: updatedParts },
              ],
            };
          }
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
    });
  }

  // Handle message.updated to capture metadata (tokens, cost, time)
  if (event.type === "message.updated" && event.properties) {
    const props = event.properties as Record<string, unknown>;
    const info = props.info as Record<string, unknown>;
    if (!info) return tabs;

    const sessionId = info.sessionID as string;

    // Only update assistant messages with metadata
    if (info.role === "assistant" && info.tokens) {
      const tokens = info.tokens as Record<string, unknown>;
      return tabs.map((tab) => {
        if (tab.type === "session" && tab.sessionId === sessionId) {
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
      });
    }
  }

  // Handle session.updated to capture title changes
  if (event.type === "session.updated" && event.properties) {
    const props = event.properties as Record<string, unknown>;
    const info = props.info as Record<string, unknown>;
    if (!info) return tabs;

    const sessionId = info.id as string;
    const newTitle = info.title as string;

    if (sessionId && newTitle) {
      return tabs.map((tab) => {
        if (
          tab.type === "session" &&
          tab.sessionId === sessionId &&
          tab.label !== newTitle
        ) {
          return { ...tab, label: newTitle };
        }
        return tab;
      });
    }
  }

  // Handle todo.updated events
  if (event.type === "todo.updated" && event.properties) {
    const props = event.properties as Record<string, unknown>;
    const sessionId = props.sessionID as string;
    const todos = props.todos as api.Todo[];

    if (sessionId && todos) {
      return tabs.map((tab) => {
        if (tab.type === "session" && tab.sessionId === sessionId) {
          return { ...tab, todos };
        }
        return tab;
      });
    }
  }

  // Event type not handled, return tabs unchanged
  return tabs;
}

function App() {
  const [tabs, setTabs] = useState<AppTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const initStarted = useRef(false); // Prevent double init from StrictMode

  // New states for UI features
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [projectRoot, setProjectRoot] = useState("");

  // Provider/model state
  const [providers, setProviders] = useState<Provider[]>([]);
  const [connectedProviders, setConnectedProviders] = useState<string[]>([]);
  const [selectedModel, setSelectedModel] = useState<SelectedModel | null>(
    null,
  );
  const [agents, setAgents] = useState<Agent[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [planetsByAgent, setPlanetsByAgent] = useState<
    Record<string, PlanetAssignment>
  >({});

  // Get the active tab
  const activeTab = tabs.find((t) => t.id === activeTabId);

  // Create a new session tab
  const createNewTab = useCallback(async () => {
    const tabId = `tab - ${Date.now()} `;
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
      type: "session",
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

  const getPlanetForAgent = useCallback(
    (name: string, existing: Record<string, PlanetAssignment>) => {
      if (existing[name]) return existing[name];
      const randomIndex = Math.floor(Math.random() * planetPalette.length);
      return planetPalette[randomIndex];
    },
    [],
  );

  // Handle file selection from Explorer
  const handleFileSelect = (file: FileEntry) => {
    // Check if tab already exists
    const existingTab = tabs.find(
      (t) => t.type === "file" && (t as FileTab).filePath === file.path,
    );

    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: FileTab = {
      id: `file - ${Date.now()} `,
      type: "file",
      label: file.name,
      icon: "file",
      filePath: file.path,
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const handleTabClose = async (tabId: string) => {
    const tab = tabs.find((t) => t.id === tabId);
    if (!tab) return;
    setTabs((prev) => prev.filter((t) => t.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = tabs.filter((t) => t.id !== tabId);
      if (remainingTabs.length > 0) {
        setActiveTabId(remainingTabs[0].id);
        if (remainingTabs[0].type === "session" && api.isPyWebView())
          await api.setCurrentSession(remainingTabs[0].sessionId);
      } else {
        setActiveTabId(null);
      }
    }
    if (
      tab.type === "session" &&
      api.isPyWebView() &&
      tab.sessionId.startsWith("ses")
    ) {
      await api.deleteSession(tab.sessionId);
    }
  };

  const handleNewTab = useCallback(async () => {
    await createNewTab();
  }, [createNewTab]);

  // Handle opening settings tab
  const handleOpenSettings = useCallback(() => {
    // Check if settings tab already exists
    const existingSettingsTab = tabs.find((t) => t.type === "settings");
    if (existingSettingsTab) {
      setActiveTabId(existingSettingsTab.id);
      return;
    }

    const newTab: SettingsTab = {
      id: `settings-${Date.now()}`,
      type: "settings",
      label: "Settings",
      icon: "settings",
    };

    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }, [tabs]);

  // Handle closing current active tab
  const handleCloseActiveTab = useCallback(async () => {
    if (activeTabId) {
      await handleTabClose(activeTabId);
    }
  }, [activeTabId]);

  // Handle agent rotation with Tab key
  const handleRotateAgent = useCallback(() => {
    if (!agents.length) {
      console.log("No agents available for rotation");
      return;
    }

    const currentIndex = selectedAgent
      ? agents.findIndex((agent) => agent.name === selectedAgent.name)
      : -1;

    const nextIndex = (currentIndex + 1) % agents.length;
    const nextAgent = agents[nextIndex];

    console.log(
      `Rotating agent from ${selectedAgent?.name || "None"} to ${nextAgent.name}`,
    );
    setSelectedAgent(nextAgent);

    // Save to settings
    api
      .saveSettings({
        selectedAgent: nextAgent,
        planetsByAgent,
      })
      .catch((e) => console.error("Failed to save agent settings:", e));
  }, [agents, selectedAgent, planetsByAgent]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onNewTab: handleNewTab,
    onCloseTab: handleCloseActiveTab,
    onToggleSidebar: () => setIsSidebarOpen((prev) => !prev),
    onRotateAgent: handleRotateAgent,
  });

  // Handle selecting a session from history
  const handleSessionSelect = useCallback(
    async (session: { id: string; title?: string }) => {
      // Check if this session is already open in a tab
      const existingTab = tabs.find(
        (t) =>
          t.type === "session" && (t as SessionTab).sessionId === session.id,
      );

      if (existingTab) {
        setActiveTabId(existingTab.id);
        if (api.isPyWebView()) {
          await api.setCurrentSession(session.id);
        }
        return;
      }

      // Create a new tab for this session and load its messages
      const tabId = `tab-${Date.now()}`;
      let messages: Message[] = [];

      if (api.isPyWebView()) {
        try {
          // Load existing messages for this session
          const rawMessages = await api.listMessages(session.id);
          messages = rawMessages.map((msg) => {
            const textParts = msg.parts
              .filter((p) => p.type === "text")
              .map((p) => p.text || "")
              .join("");
            return {
              id: msg.info.id,
              role: msg.info.role as "user" | "assistant",
              content: textParts,
              modelID: msg.info.modelID,
              providerID: msg.info.providerID,
              cost: msg.info.cost,
              tokens: msg.info.tokens,
              time: msg.info.time,
            };
          });
        } catch (error) {
          console.error("Failed to load session messages:", error);
        }
        await api.setCurrentSession(session.id);
      }

      const newTab: SessionTab = {
        id: tabId,
        type: "session",
        sessionId: session.id,
        label: session.title || "Untitled",
        icon: "sparkles",
        messages,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(tabId);
    },
    [tabs],
  );

  // Handle deleting a session from history
  const handleSessionDeleteFromHistory = useCallback(
    async (sessionId: string) => {
      // Close the tab if it's open
      const existingTab = tabs.find(
        (t) =>
          t.type === "session" && (t as SessionTab).sessionId === sessionId,
      );
      if (existingTab) {
        await handleTabClose(existingTab.id);
      } else if (api.isPyWebView()) {
        // Just delete from backend if not open
        await api.deleteSession(sessionId);
      }
    },
    [tabs, handleTabClose],
  );

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
        if (project?.path) {
          setProjectRoot(project.path);
        } else if (project?.name) {
          setProjectRoot(project.name);
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

          // Local Agents
          const agentsList = await api.listAgents();
          setAgents(agentsList);

          // Load agent settings and planet mappings
          try {
            const settings = await api.loadSettings();
            if (settings.selectedAgent) {
              const savedAgent = settings.selectedAgent as Agent;
              // Verify it exists in the fetched list
              const found = agentsList.find((a) => a.name === savedAgent.name);
              if (found) setSelectedAgent(savedAgent);
            }

            const savedPlanets =
              (settings.planetsByAgent as Record<string, PlanetAssignment>) ||
              {};
            const updatedPlanets: Record<string, PlanetAssignment> = {
              ...savedPlanets,
            };
            let changed = false;
            for (const agent of agentsList) {
              if (!updatedPlanets[agent.name]) {
                updatedPlanets[agent.name] = getPlanetForAgent(
                  agent.name,
                  updatedPlanets,
                );
                changed = true;
              }
            }
            setPlanetsByAgent(updatedPlanets);

            if (changed) {
              await api.saveSettings({
                ...settings,
                planetsByAgent: updatedPlanets,
              });
            }
          } catch (e) {
            console.error("Failed to load agent settings:", e);
          }
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

  // Event buffer for batching SSE events
  // This prevents UI freezing/stuttering when many events arrive simultaneously
  const eventBufferRef = useRef<Array<Record<string, unknown>>>([]);
  const rafIdRef = useRef<number | null>(null);

  // Process all buffered events in a single state update
  const processEventBuffer = useCallback(() => {
    const events = eventBufferRef.current;
    eventBufferRef.current = [];
    rafIdRef.current = null;

    if (events.length === 0) return;

    // Apply all events in a single setTabs call for optimal performance
    setTabs((prevTabs) => {
      let updatedTabs = prevTabs;
      for (const event of events) {
        updatedTabs = applyEventToTabs(updatedTabs, event);
      }
      return updatedTabs;
    });
  }, []);

  // Separate effect for Event Listening using direct SSE connection
  // This bypasses pywebview's evaluate_js buffering
  useEffect(() => {
    if (!isInitialized) return;

    // Define the event handler - buffers events for batched processing
    const handleEvent = (payload: unknown) => {
      const event = payload as Record<string, unknown>;

      // Add event to buffer
      eventBufferRef.current.push(event);

      // Schedule processing on next animation frame (if not already scheduled)
      // This batches all events that arrive within ~16ms into a single render
      if (rafIdRef.current === null) {
        rafIdRef.current = requestAnimationFrame(processEventBuffer);
      }
    };

    // Connect directly to SSE stream (bypasses pywebview buffering)
    const cleanup = api.connectToEventStream(handleEvent);

    return () => {
      cleanup();
      // Clean up any pending RAF on unmount
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isInitialized, processEventBuffer]);

  // Handle sending a message
  const handleSend = async (content: string) => {
    if (!activeTab || activeTab.type !== "session") return;

    const currentTabId = activeTab.id;
    const currentSessionId = activeTab.sessionId;

    // Check if this is a slash command
    const isSlashCommand = content.trim().startsWith("/");

    // For slash commands, parse command name and arguments
    let commandName = "";
    let commandArgs = "";
    if (isSlashCommand) {
      const trimmed = content.trim().slice(1); // Remove leading /
      const spaceIndex = trimmed.indexOf(" ");
      if (spaceIndex === -1) {
        commandName = trimmed;
        commandArgs = "";
      } else {
        commandName = trimmed.slice(0, spaceIndex);
        commandArgs = trimmed.slice(spaceIndex + 1).trim();
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };

    const assistantMessage: Message = {
      id: `asst - ${Date.now()} `,
      role: "assistant",
      content: "",
      modelID: selectedModel?.modelId,
      providerID: selectedModel?.providerId,
    };

    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === currentTabId && tab.type === "session"
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
        if (isSlashCommand) {
          // Find the command definition to get argument names
          const availableCommands = await api.listCommands();
          const commandDef = availableCommands.find(
            (c) => c.name === commandName,
          );

          // Construct arguments
          let args: Record<string, unknown> | undefined;

          if (commandArgs) {
            const cmdArgsDef =
              commandDef?.args ||
              (commandDef as { arguments?: unknown[] })?.arguments;
            if (cmdArgsDef && cmdArgsDef.length > 0) {
              // Use the name of the first argument
              const firstArg = cmdArgsDef[0];
              const argName =
                firstArg && typeof firstArg === "object" && "name" in firstArg
                  ? (firstArg.name as string)
                  : "text";
              args = { [argName]: commandArgs };
            } else {
              // Fallback: send as "text" if no definition found, or maybe the command expects raw text
              args = { text: commandArgs };
            }
          }

          // Execute slash command - returns result synchronously (not streaming)
          const result = await api.executeCommand(
            commandName,
            args,
            currentSessionId,
          );

          // Handle the synchronous response - extract text from parts
          if (result && typeof result === "object") {
            const cmdResult = result as {
              info?: unknown;
              parts?: Array<{ type: string; text?: string }>;
            };
            const textContent =
              cmdResult.parts
                ?.filter((p) => p.type === "text" && p.text)
                .map((p) => p.text)
                .join("") || "Command executed.";

            setTabs((prev) =>
              prev.map((tab) => {
                if (tab.id === currentTabId && tab.type === "session") {
                  const msgs = [...tab.messages];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === "assistant") {
                    return {
                      ...tab,
                      messages: [
                        ...msgs.slice(0, -1),
                        { ...lastMsg, content: textContent },
                      ],
                    };
                  }
                }
                return tab;
              }),
            );
          } else {
            // Handle failure (result is null)
            setTabs((prev) =>
              prev.map((tab) => {
                if (tab.id === currentTabId && tab.type === "session") {
                  const msgs = [...tab.messages];
                  const lastMsg = msgs[msgs.length - 1];
                  if (lastMsg && lastMsg.role === "assistant") {
                    return {
                      ...tab,
                      messages: [
                        ...msgs.slice(0, -1),
                        {
                          ...lastMsg,
                          content:
                            "Command execution failed. Please check the command and arguments.",
                        },
                      ],
                    };
                  }
                }
                return tab;
              }),
            );
          }
        } else {
          // Regular message
          const modelParam = selectedModel
            ? {
              providerID: selectedModel.providerId,
              modelID: selectedModel.modelId,
            }
            : undefined;

          const agentParam = selectedAgent ? selectedAgent.name : undefined;

          await api.streamMessage(
            currentSessionId,
            content,
            modelParam,
            agentParam,
          );
        }
      } else {
        // Browser Mock
        await new Promise((r) => setTimeout(r, 500));
        const mockText = isSlashCommand
          ? `Executed command: /${commandName}${commandArgs ? ` with args: ${commandArgs}` : ""}`
          : "This is a mock streaming response in the browser.";
        for (const char of mockText) {
          setTabs((prev) =>
            prev.map((t) => {
              if (t.id === currentTabId && t.type === "session") {
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
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading state while initializing
  if (!isInitialized) {
    return (
      <div className="flex h-screen items-center justify-center bg-background font-sans antialiased">
        <div className="text-center space-y-4">
          <img src="./logo.png" alt="Mars" className="w-12 h-12 mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-background text-foreground overflow-hidden">
      <TitleBar
        projectPath={projectRoot}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeSessionId={
          activeTab?.type === "session"
            ? (activeTab as SessionTab).sessionId
            : undefined
        }
        onSessionSelect={handleSessionSelect}
        onSessionDelete={handleSessionDeleteFromHistory}
      />

      {/* Slim header kept for future content if needed */}

      <div className="flex flex-1 overflow-hidden relative">
        {/* File Explorer Sidebar - Toggleable */}
        <div
          className={cn(
            "border-r border-border/50 overflow-hidden flex-shrink-0 sidebar-transition",
            isSidebarOpen ? "w-64 opacity-100" : "w-0 opacity-0 border-r-0",
          )}
        >
          <FileExplorer
            onFileSelect={handleFileSelect}
            className="h-full w-64" // Fix width to prevent content squishing
            onRootLoaded={(path) => {
              // Store full path for accuracy; UI still shows folder name
              setProjectRoot(path);
            }}
          />
        </div>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col overflow-hidden min-w-0">
          <ChatTabs
            tabs={tabs}
            activeTabId={activeTabId}
            onTabSelect={setActiveTabId}
            onTabClose={handleTabClose}
            onNewTab={handleNewTab}
          />

          <div className="flex-1 overflow-hidden relative">
            {activeTab?.type === "session" ? (
              <ChatArea
                messages={(activeTab as SessionTab).messages}
                hasActiveSession={true}
                onNewChat={handleNewTab}
              />
            ) : activeTab?.type === "file" ? (
              <CodeViewer filePath={(activeTab as FileTab).filePath} />
            ) : activeTab?.type === "settings" ? (
              <Settings
                providers={providers}
                connectedProviders={connectedProviders}
                selectedModel={selectedModel}
                onModelChange={async (model) => {
                  setSelectedModel(model);
                  if (model) {
                    try {
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
                agents={agents}
                selectedAgent={selectedAgent}
                planetsByAgent={planetsByAgent}
                onAgentChange={async (agent) => {
                  setSelectedAgent(agent);
                  try {
                    const currentSettings = await api.loadSettings();
                    await api.saveSettings({
                      ...currentSettings,
                      selectedAgent: agent,
                      planetsByAgent,
                    });
                  } catch (e) {
                    console.error("Failed to save agent settings:", e);
                  }
                }}
                onIconChange={async (agentName, icon) => {
                  const updatedPlanets = {
                    ...planetsByAgent,
                    [agentName]: icon,
                  };
                  setPlanetsByAgent(updatedPlanets);
                  try {
                    const currentSettings = await api.loadSettings();
                    await api.saveSettings({
                      ...currentSettings,
                      planetsByAgent: updatedPlanets,
                    });
                  } catch (e) {
                    console.error("Failed to save icon settings:", e);
                  }
                }}
              />
            ) : (
              <ChatArea
                messages={[]}
                hasActiveSession={false}
                onNewChat={handleNewTab}
              />
            )}
          </div>

          <InputBar onSend={(msg) => handleSend(msg)} isLoading={isLoading} />
        </div>

        {/* Task Panel - Right Side */}
        <TaskPanel
          todos={
            activeTab?.type === "session"
              ? (activeTab as SessionTab).todos
              : undefined
          }
          isOpen={isTaskPanelOpen}
          className={cn(
            "w-72 border-l border-border/50 bg-background flex flex-col h-full transition-transform duration-200 ease-in-out",
            isTaskPanelOpen
              ? "translate-x-0 opacity-100"
              : "translate-x-full opacity-0 pointer-events-none",
          )}
        />

        {/* Task Panel Toggle Button (floating on right edge) */}
        <button
          onClick={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
          className={cn(
            "absolute right-0 top-1/2 -translate-y-1/2 z-10",
            "w-6 h-16 bg-muted/80 hover:bg-muted border border-border/50 rounded-l-md",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "transition-all duration-150 hover:w-7",
            isTaskPanelOpen && "right-72",
          )}
          title={isTaskPanelOpen ? "Close tasks" : "Open tasks"}
        >
          <svg
            className={cn(
              "w-3 h-3 transition-transform",
              isTaskPanelOpen && "rotate-180",
            )}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      <Footer
        providers={providers}
        connectedProviders={connectedProviders}
        selectedModel={selectedModel}
        onModelChange={async (model) => {
          setSelectedModel(model);
          if (model) {
            try {
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
        agents={agents}
        selectedAgent={selectedAgent}
        planetsByAgent={planetsByAgent}
        onAgentChange={async (agent) => {
          setSelectedAgent(agent);
          try {
            const currentSettings = await api.loadSettings();
            await api.saveSettings({
              ...currentSettings,
              selectedAgent: agent,
              planetsByAgent,
            });
          } catch (e) {
            console.error("Failed to save agent settings:", e);
          }
        }}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
}

export default App;
