import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface ChatAreaProps {
  messages: Message[];
  hasActiveSession: boolean;
  onNewChat?: () => void;
}

export function ChatArea({
  messages,
  hasActiveSession,
  onNewChat,
}: ChatAreaProps) {
  // No active session - show start new chat prompt
  if (!hasActiveSession) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-serif italic text-foreground">
            Welcome to Mars
          </h1>
          <div className="w-12 h-px bg-border mx-auto" />
          <p className="text-sm text-muted-foreground max-w-xs">
            Start a new conversation to begin exploring code with AI assistance.
          </p>
          <Button onClick={onNewChat} variant="outline" className="gap-2 mt-2">
            <MessageSquarePlus className="h-4 w-4" />
            Start a new chat
          </Button>
        </div>
      </div>
    );
  }

  // Active session but no messages yet
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-serif italic text-foreground">
            Welcome to Mars
          </h1>
          <div className="w-12 h-px bg-border mx-auto" />
          <p className="text-sm text-muted-foreground">
            Ask anything to get started
          </p>
        </div>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-2xl mx-auto py-8 px-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id}>
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-4 py-2.5 max-w-[80%]">
                  <p className="text-sm">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="prose prose-sm max-w-none">
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {message.content}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
