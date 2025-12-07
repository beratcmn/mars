import { useState, useRef, useEffect } from "react";
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
  Copy,
  ArrowDown,
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

// Component for rendering a tool call - modern card design
function ToolCallPart({ part }: { part: ToolPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isTask = part.tool === "task";
  const isRunning = part.state.status === "running" || part.state.status === "pending";

  const statusIcon = {
    pending: <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />,
    running: <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-500" />,
    completed: <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />,
    error: <XCircle className="w-3.5 h-3.5 text-red-500" />,
  }[part.state.status];

  // Extract description for task tools
  const taskDescription = isTask && part.state.input
    ? (part.state.input as Record<string, unknown>).description as string || ""
    : "";

  // Format tool name for display
  const displayName = part.tool.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

  // For tasks, render a special card
  if (isTask) {
    return (
      <div className="my-3 animate-fade-in-up">
        <div className="rounded-lg border border-border bg-card overflow-hidden shadow-sm">
          {/* Task Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <Wrench className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="serif-title-sm text-foreground">Task</span>
                {isRunning && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 uppercase tracking-wider font-medium">
                    Running
                  </span>
                )}
              </div>
              {taskDescription && (
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {taskDescription}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {statusIcon}
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
          </button>

          {/* Task Content - Expanded */}
          {isExpanded && (
            <div className="border-t border-border px-4 py-3 space-y-3 bg-muted/30">
              {/* Input section - collapsible */}
              {part.state.input && (
                <details className="group">
                  <summary className="text-xs font-medium text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    Input Parameters
                  </summary>
                  <pre className="mt-2 p-3 bg-muted rounded-md text-[11px] overflow-x-auto font-mono text-foreground/80">
                    {JSON.stringify(part.state.input, null, 2)}
                  </pre>
                </details>
              )}

              {/* Output section */}
              {part.state.output && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">Output</span>
                  <div className="mt-2 p-3 bg-background rounded-md border border-border/50 prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{part.state.output}</Streamdown>
                  </div>
                </div>
              )}

              {/* Error section */}
              {part.state.error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-md border border-red-200 dark:border-red-900/30">
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">Error</span>
                  <pre className="mt-1 text-xs text-red-600 dark:text-red-400 whitespace-pre-wrap">
                    {part.state.error}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Default tool rendering (non-task)
  return (
    <div className="my-2 animate-fade-in">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-md bg-muted/50 hover:bg-muted transition-colors"
      >
        {isExpanded ? (
          <ChevronDown className="w-3 h-3 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
        )}
        <Wrench className="w-3 h-3 text-muted-foreground" />
        <span className="font-medium text-xs text-foreground">
          {displayName}
        </span>
        <span className="ml-auto">{statusIcon}</span>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-4 pl-3 border-l-2 border-border text-xs space-y-2 py-2">
          {part.state.input && (
            <div>
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Input</span>
              <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(part.state.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state.output && (
            <div>
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">Output</span>
              <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] overflow-x-auto max-h-40 font-mono">
                {part.state.output}
              </pre>
            </div>
          )}
          {part.state.error && (
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
              <span className="text-red-600 text-[11px] uppercase tracking-wider">Error</span>
              <pre className="mt-1 text-[11px] text-red-600">{part.state.error}</pre>
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
        <span className="serif-title-sm">Thinking...</span>
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
        <div className="text-center space-y-6 animate-fade-in-up max-w-md px-6">
          {/* Animated Mars Icon */}
          <div className="relative mx-auto w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/20 to-red-500/20 animate-pulse" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-500/30 to-red-600/30" />
            <div className="absolute inset-4 rounded-full bg-gradient-to-br from-orange-600 to-red-700 shadow-lg shadow-orange-500/25" />
            <div className="absolute top-6 left-8 w-2 h-2 rounded-full bg-orange-300/60" />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-serif italic text-foreground">
              Welcome to <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Mars</span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your intelligent coding companion. Start a new conversation to explore code with AI assistance.
            </p>
          </div>

          <Button
            onClick={onNewChat}
            variant="ghost"
            size="sm"
            className="gap-2 transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-primary/5"
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
        <div className="text-center space-y-8 animate-fade-in-up max-w-lg px-6">
          {/* Pulsing Mars Icon */}
          <div className="relative mx-auto w-16 h-16">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-400/10 to-red-500/10 animate-gentle-pulse" />
            <div className="absolute inset-2 rounded-full bg-gradient-to-br from-orange-500/20 to-red-600/20" />
            <div className="absolute inset-3 rounded-full bg-gradient-to-br from-orange-600 to-red-700 shadow-md shadow-orange-500/20" />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-serif italic text-foreground">
              What can I help you build?
            </h1>
            <div className="w-12 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
          </div>

          {/* Suggestion Cards */}
          <div className="flex flex-wrap justify-center gap-2">
            {[
              "Explain this codebase",
              "Fix a bug",
              "Write tests",
              "Refactor code"
            ].map((suggestion, i) => (
              <button
                key={suggestion}
                className={`px-4 py-2 text-xs text-muted-foreground bg-muted/50 hover:bg-muted hover:text-foreground border border-transparent hover:border-border/50 rounded-full transition-all duration-200 animate-fade-in-up`}
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Scroll state for scroll-to-bottom button
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Check if scrolled away from bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

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
      if (part.type === "text") {
        return (
          <div key={part.id} className="prose prose-sm max-w-none dark:prose-invert">
            <Streamdown>{formatMentions(part.text)}</Streamdown>
          </div>
        )
      }
      return null;
    });
  };

  return (
    <div className="relative h-full" ref={scrollAreaRef}>
      <ScrollArea className="h-full" onScrollCapture={handleScroll}>
        <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
          {messages.map((message) => {
            const messageHasTextParts = message.parts?.some(p => p.type === "text");
            return (
              <div key={message.id} className={`group ${message.role === 'user' ? 'animate-slide-in-right' : 'animate-fade-in-up'}`}>
                {message.role === "user" ? (
                  <div className="flex justify-end gap-2 items-start">
                    {/* User message hover actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pt-2">
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                        }}
                        className="p-1.5 rounded-md text-muted-foreground/60 hover:text-foreground hover:bg-muted/80 transition-all duration-150"
                        title="Copy message"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
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
                      <div className="model-badge mb-2">
                        {message.modelID}
                      </div>
                    )}

                    {/* Render reasoning and tool parts AND text parts if available */}
                    {renderParts(message.parts)}

                    {/* Text content fallback - only if no text parts exist */}
                    {!messageHasTextParts && message.content && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>{formatMentions(message.content)}</Streamdown>
                      </div>
                    )}

                    {/* Metadata Footer with Copy Button */}
                    <div className="flex items-center gap-5 pt-3 mt-3 border-t border-transparent footer-meta group-hover:border-border/30 transition-colors">
                      {message.tokens && (
                        <>
                          <div
                            className="flex items-center gap-1.5"
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
                                  <span className="opacity-60">
                                    {" "}
                                    ({formatTokens(message.tokens.cache.read)} cached)
                                  </span>
                                )}
                            </span>
                          </div>

                          {message.time && message.time.completed && (
                            <div
                              className="flex items-center gap-1.5"
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
                              className="flex items-center gap-1.5"
                              title="Estimated cost"
                            >
                              <Coins className="w-3 h-3" />
                              <span>${message.cost.toFixed(5)}</span>
                            </div>
                          )}
                        </>
                      )}

                      {/* Copy button - always at far right */}
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(message.content);
                        }}
                        className="ml-auto p-1.5 rounded-md text-muted-foreground/40 hover:text-foreground hover:bg-muted/80 opacity-0 group-hover:opacity-100 transition-all duration-150"
                        title="Copy response"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

        </div>
      </ScrollArea>

      {/* Floating scroll to bottom button */}
      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-6 right-6 p-2.5 rounded-full bg-background border border-border shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 transition-all duration-200 animate-fade-in z-10"
          title="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}

