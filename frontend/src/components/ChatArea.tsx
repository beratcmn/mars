import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { MessageSquarePlus, Zap, Clock, Coins, ChevronDown, ChevronRight, Wrench, Brain, Loader2, CheckCircle2, XCircle } from "lucide-react";

// Part types for rendering
interface TextPart {
  id: string;
  type: "text";
  text: string;
}

interface ReasoningPart {
  id: string;
  type: "reasoning";
  text: string;
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
  parts?: MessagePart[];
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

// Component for rendering a tool call
function ToolCallPart({ part }: { part: ToolPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />,
    running: <Loader2 className="w-3 h-3 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="w-3 h-3 text-green-500" />,
    error: <XCircle className="w-3 h-3 text-red-500" />,
  }[part.state.status];

  // Format the input for display
  const inputDisplay = part.state.input
    ? Object.entries(part.state.input)
      .map(([key, value]) => `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`)
      .join(", ")
    : "";

  return (
    <div className="my-2 border border-border/50 rounded-lg overflow-hidden bg-muted/30">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted/50 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Wrench className="w-3 h-3 text-muted-foreground" />
        <span className="font-mono font-medium text-foreground">{part.tool}</span>
        {inputDisplay && (
          <span className="text-muted-foreground truncate max-w-[300px]">
            ({inputDisplay})
          </span>
        )}
        <span className="ml-auto">{statusIcon}</span>
      </button>

      {isExpanded && (
        <div className="px-3 py-2 border-t border-border/50 text-xs space-y-2">
          {part.state.input && (
            <div>
              <span className="font-medium text-muted-foreground">Input:</span>
              <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto">
                {JSON.stringify(part.state.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state.output && (
            <div>
              <span className="font-medium text-muted-foreground">Output:</span>
              <pre className="mt-1 p-2 bg-background rounded text-[10px] overflow-x-auto max-h-40">
                {part.state.output}
              </pre>
            </div>
          )}
          {part.state.error && (
            <div>
              <span className="font-medium text-red-500">Error:</span>
              <pre className="mt-1 p-2 bg-red-500/10 rounded text-[10px] text-red-500">
                {part.state.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component for rendering reasoning
function ReasoningParts({ part }: { part: ReasoningPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!part.text || part.text.trim() === "") return null;

  return (
    <div className="my-2 border border-border/50 rounded-lg overflow-hidden bg-amber-500/5">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-amber-500/10 transition-colors"
      >
        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        <Brain className="w-3 h-3 text-amber-500" />
        <span className="font-medium text-amber-600 dark:text-amber-400">Thinking...</span>
      </button>

      {isExpanded && (
        <div className="px-3 py-2 border-t border-border/50 text-xs">
          <pre className="whitespace-pre-wrap text-muted-foreground italic">
            {part.text}
          </pre>
        </div>
      )}
    </div>
  );
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

  // Render parts for an assistant message
  const renderParts = (parts: MessagePart[] | undefined) => {
    if (!parts || parts.length === 0) return null;

    return parts.map((part) => {
      if (part.type === "reasoning") {
        return <ReasoningParts key={part.id} part={part} />;
      }
      if (part.type === "tool") {
        return <ToolCallPart key={part.id} part={part} />;
      }
      // Text parts are rendered via message.content
      return null;
    });
  };

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

                {/* Render reasoning and tool parts */}
                {renderParts(message.parts)}

                {/* Text content */}
                {message.content && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <div className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {message.content}
                    </div>
                  </div>
                )}

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
