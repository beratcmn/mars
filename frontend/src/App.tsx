import { useState } from "react";
import { Header } from "@/components/Header";
import { ChatTabs, type Tab } from "@/components/ChatTabs";
import { ChatArea } from "@/components/ChatArea";
import { InputBar } from "@/components/InputBar";
import { Footer } from "@/components/Footer";

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

  const handleSend = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content,
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // TODO: Integrate with OpenCode via PyWebView
    // For now, simulate a response
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `This is a placeholder response. OpenCode integration coming soon!\n\nYou said: "${content}"`,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
    }, 1000);
  };

  const handleNewTab = () => {
    // TODO: Implement new tab creation
    console.log("New tab");
  };

  return (
    <div className="flex h-screen flex-col bg-background font-sans antialiased">
      <Header projectPath="mars" />
      <ChatTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onNewTab={handleNewTab}
      />
      <ChatArea messages={messages} />
      <InputBar onSend={handleSend} isLoading={isLoading} />
      <Footer model="Haiku 4.5" />
    </div>
  );
}

export default App;
