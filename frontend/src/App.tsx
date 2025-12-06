import { useState, useEffect } from "react";
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

function App() {
  const [tabs] = useState<Tab[]>([
    { id: "chat", label: "Untitled", icon: "sparkles" },
  ]);
  const [activeTab, setActiveTab] = useState("chat");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [projectPath, setProjectPath] = useState("mars");
  const [model] = useState("Haiku 4.5");
  const [isConnected, setIsConnected] = useState(false);

  // Initialize connection to PyWebView backend
  useEffect(() => {
    const init = async () => {
      if (api.isPyWebView()) {
        // Check if server is running
        const running = await api.isServerRunning();
        if (!running) {
          // Try to start the server
          await api.startServer();
        }
        setIsConnected(await api.isServerRunning());

        // Get current project info
        const project = await api.getCurrentProject();
        if (project?.name) {
          setProjectPath(project.name);
        }

        // Create a session if none exists
        const sessionId = await api.getCurrentSessionId();
        if (!sessionId) {
          await api.createSession();
        }
      }
    };
    init();
  }, []);

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      if (api.isPyWebView()) {
        // Real API call via PyWebView
        const { response } = await api.sendMessage(content);

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
          setMessages((prev) => [...prev, assistantMessage]);
        }
      } else {
        // Mock response for browser development
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `[Browser Dev Mode]\n\nThis is a placeholder response. Run with PyWebView for real OpenCode integration.\n\nYou said: "${content}"`,
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewTab = () => {
    // TODO: Implement new tab creation
    console.log("New tab");
  };

  return (
    <div className="flex h-screen flex-col bg-background font-sans antialiased">
      <Header projectPath={projectPath} />
      <ChatTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTab={handleNewTab}
      />
      <ChatArea messages={messages} />
      <InputBar onSend={handleSend} isLoading={isLoading} />
      <Footer model={model} />
    </div>
  );
}

export default App;
