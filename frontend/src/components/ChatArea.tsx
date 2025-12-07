import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Zap, Clock, Coins } from "lucide-react";


interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
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

  const formatTokens = (num: number) => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  const formatTime = (ms: number) => {
    const s = ms / 1000;
    return `${s.toFixed(1)}s`;
  }

  return (
    <ScrollArea className="flex-1">
      <div className="max-w-3xl mx-auto py-8 px-6 space-y-8">
        {messages.map((message) => (
          <div key={message.id} className="group relative">
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground rounded-2xl rounded-br-sm px-5 py-3 max-w-[85%] shadow-sm">
                  <p className="text-sm leading-relaxed">{message.content}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Model Badge */}
                {message.modelID && (
                  <div className="flex items-center gap-2 mb-1">
                    <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 bg-muted/50 px-1.5 py-0.5 rounded border border-border/50 select-none">
                      {message.modelID}
                    </div>
                  </div>
                )}

                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                    {message.content}
                  </div>
                </div>

                {/* Metadata Footer */}
                {message.tokens && (
                  <div className="flex items-center gap-4 pt-1 mt-1 border-t border-transparent group-hover:border-border/30 transition-colors text-[10px] text-muted-foreground/50">
                    <div className="flex items-center gap-1" title="Tokens used">
                      <Zap className="w-3 h-3" />
                      <span>
                        {formatTokens(message.tokens.input + message.tokens.output)} tokens
                        {message.tokens.cache && message.tokens.cache.read > 0 &&
                          <span className="opacity-70"> ({formatTokens(message.tokens.cache.read)} cached)</span>
                        }
                      </span>
                    </div>

                    {message.time && (
                      <div className="flex items-center gap-1" title="Time taken">
                        <Clock className="w-3 h-3" />
                        <span>{formatTime(message.time.completed - message.time.created)}</span>
                      </div>
                    )}

                    {message.cost !== undefined && message.cost > 0 && (
                      <div className="flex items-center gap-1" title="Estimated cost">
                        <Coins className="w-3 h-3" />
                        <span>${message.cost.toFixed(5)}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
