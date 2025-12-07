import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Streamdown } from "streamdown";
import {
  MessageSquarePlus,
  Zap,
  Clock,
  Coins,
  ChevronDown,
  ChevronRight,
  Wrench,
  Brain,
  Loader2,
  CheckCircle2,
  XCircle,
} from "lucide-react";

// Part types for rendering
interface TextPart {
  id: string;
  type: "text";
  text: string;
  startTime?: number;
}

interface ReasoningPart {
  id: string;
  type: "reasoning";
  text: string;
  startTime?: number;
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

// Component for rendering a tool call - flat minimal design
function ToolCallPart({ part }: { part: ToolPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const statusIcon = {
    pending: <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />,
    running: <Loader2 className="w-3 h-3 animate-spin text-foreground" />,
    completed: <CheckCircle2 className="w-3 h-3 text-green-600" />,
    error: <XCircle className="w-3 h-3 text-red-600" />,
  }[part.state.status];

  // Format the input for display
  const inputDisplay = part.state.input
    ? Object.entries(part.state.input)
      .map(
        ([key, value]) =>
          `${key}: ${typeof value === "string" ? value : JSON.stringify(value)}`,
      )
      .join(", ")
    : "";

  return (
    <div className="my-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <Wrench className="w-3 h-3" />
        <span className="font-mono font-medium text-foreground">
          {part.tool}
        </span>
        {inputDisplay && (
          <span className="text-muted-foreground truncate max-w-[300px] text-[11px]">
            ({inputDisplay})
          </span>
        )}
        <span className="ml-auto">{statusIcon}</span>
      </button>

      {isExpanded && (
        <div className="ml-5 pl-3 border-l border-border text-xs space-y-2 py-2">
          {part.state.input && (
            <div>
              <span className="text-muted-foreground">Input:</span>
              <pre className="mt-1 p-2 bg-muted/50 text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(part.state.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state.output && (
            <div>
              <span className="text-muted-foreground">Output:</span>
              <pre className="mt-1 p-2 bg-muted/50 text-[11px] overflow-x-auto max-h-40 font-mono">
                {part.state.output}
              </pre>
            </div>
          )}
          {part.state.error && (
            <div>
              <span className="text-red-600">Error:</span>
              <pre className="mt-1 p-2 bg-red-50 dark:bg-red-950/20 text-[11px] text-red-600">
                {part.state.error}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Component for rendering reasoning - flat minimal design
function ReasoningParts({ part }: { part: ReasoningPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!part.text || part.text.trim() === "") return null;

  return (
    <div className="my-1">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3" />
        ) : (
          <ChevronRight className="w-3 h-3" />
        )}
        <Brain className="w-3 h-3" />
        <span className="italic">Thinking...</span>
      </button>

      {isExpanded && (
        <div className="ml-5 pl-3 border-l border-border text-xs py-2">
          <pre className="whitespace-pre-wrap text-muted-foreground italic">
            {part.text}
          </pre>
        </div>
      )}
    </div>
  );
}

// Helper to format @mentions into markdown links that can be styled as badges
function formatMentions(text: string): string {
  if (!text) return "";
  // Replace @[path] with [basename](#file:path)
  return text.replace(/@\[(.*?)\]/g, (_match, path) => {
    const basename = path.split("/").pop() || path;
    return `[${basename}](#file:${path})`;
  });
}

export function ChatArea({
  messages,
  hasActiveSession,
  onNewChat,
}: ChatAreaProps) {
  // No active session - show start new chat prompt
  if (!hasActiveSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-4 animate-fade-in-up">
          <h1 className="text-3xl font-serif italic text-foreground">
            Welcome to Mars
          </h1>
          <div className="w-12 h-px bg-border mx-auto" />
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Start a new conversation to begin exploring code with AI assistance.
          </p>
          <Button
            onClick={onNewChat}
            variant="ghost"
            size="sm"
            className="gap-2 transition-all duration-150 hover:scale-105 active:scale-95"
          >
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
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3 animate-fade-in-up">
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
  };

  // Helper to get the start time for a part for sorting
  const getPartStartTime = (part: MessagePart): number => {
    if (part.type === "tool") {
      return part.state.time?.start || 0;
    }
    return part.startTime || 0;
  };

  // Render parts for an assistant message - sorted by time
  const renderParts = (parts: MessagePart[] | undefined) => {
    if (!parts || parts.length === 0) return null;

    // Sort parts by their start time
    const sortedParts = [...parts].sort(
      (a, b) => getPartStartTime(a) - getPartStartTime(b),
    );

    return sortedParts.map((part) => {
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
    <ScrollArea className="h-full">
      <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
        {messages.map((message) => (
          <div key={message.id} className={`group ${message.role === 'user' ? 'animate-slide-in-right' : 'animate-fade-in-up'}`}>
            {message.role === "user" ? (
              <div className="flex justify-end">
                <div className="bg-primary text-primary-foreground px-4 py-2.5 max-w-[85%] rounded-md message-bubble shadow-sm">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {message.content.split(/(@\[.*?\])/g).map((part, i) => {
                      const match = part.match(/@\[(.*?)\]/);
                      if (match) {
                        const path = match[1];
                        const basename = path.split("/").pop() || path;
                        return (
                          <span
                            key={i}
                            className="mention-badge mx-1 text-primary-foreground/90 bg-primary-foreground/20 border-transparent"
                          >
                            {basename}
                          </span>
                        );
                      }
                      return part;
                    })}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {/* Model Badge */}
                {message.modelID && (
                  <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70 mb-2">
                    {message.modelID}
                  </div>
                )}

                {/* Render reasoning and tool parts */}
                {renderParts(message.parts)}

                {/* Text content */}
                {message.content && (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{formatMentions(message.content)}</Streamdown>
                  </div>
                )}

                {/* Metadata Footer */}
                {message.tokens && (
                  <div className="flex items-center gap-4 pt-2 text-[10px] text-muted-foreground/50">
                    <div
                      className="flex items-center gap-1"
                      title="Tokens used"
                    >
                      <Zap className="w-3 h-3" />
                      <span>
                        {formatTokens(
                          message.tokens.input + message.tokens.output,
                        )}{" "}
                        tokens
                        {message.tokens.cache &&
                          message.tokens.cache.read > 0 && (
                            <span className="opacity-70">
                              {" "}
                              ({formatTokens(message.tokens.cache.read)} cached)
                            </span>
                          )}
                      </span>
                    </div>

                    {message.time && message.time.completed && (
                      <div
                        className="flex items-center gap-1"
                        title="Time taken"
                      >
                        <Clock className="w-3 h-3" />
                        <span>
                          {formatTime(
                            message.time.completed - message.time.created,
                          )}
                        </span>
                      </div>
                    )}

                    {message.cost !== undefined && message.cost > 0 && (
                      <div
                        className="flex items-center gap-1"
                        title="Estimated cost"
                      >
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
