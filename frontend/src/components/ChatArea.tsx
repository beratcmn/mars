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
  FileText,
  FilePen,
  Terminal,
  FilePlus,
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

// Component for rendering a tool call - minimalist design
function ToolCallPart({ part }: { part: ToolPart }) {
  const [isExpanded, setIsExpanded] = useState(false);

  const isTask = part.tool === "task";
  const isRunning =
    part.state.status === "running" || part.state.status === "pending";
  const isCompleted = part.state.status === "completed";
  const isError = part.state.status === "error";

  // Extract data for task tools
  const taskInput = isTask
    ? (part.state.input as Record<string, unknown>)
    : null;
  const taskDescription = (taskInput?.description as string) || "";
  const taskPrompt = (taskInput?.prompt as string) || "";
  const subagentType = (taskInput?.subagent_type as string) || "agent";

  // Format tool name for display
  const displayName = part.tool
    .replace(/_/g, " ")
    .replace(/\b\w/g, (l) => l.toUpperCase());

  // Check for TodoWrite tool - special minimal rendering
  const isTodoWrite = part.tool.toLowerCase() === "todowrite";

  if (isTodoWrite) {
    // Extract todo count from input
    const todoInput = part.state.input as Record<string, unknown> | undefined;
    const todos = (todoInput?.todos as unknown[]) || [];
    const todoCount = todos.length;

    return (
      <div className="my-2 animate-fade-in">
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-muted/30 border border-border/40">
          {/* Status icon */}
          <div className="text-muted-foreground">
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : isCompleted ? (
              <CheckCircle2 className="w-3.5 h-3.5" />
            ) : isError ? (
              <XCircle className="w-3.5 h-3.5 text-red-500/70" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5" />
            )}
          </div>

          {/* Label */}
          <span className="text-xs text-muted-foreground">
            {isRunning ? "Updating tasks..." : "Updated tasks"}
          </span>

          {/* Count badge */}
          {todoCount > 0 && (
            <span className="text-[10px] text-muted-foreground/70 bg-muted px-1.5 py-0.5 rounded">
              {todoCount} {todoCount === 1 ? "task" : "tasks"}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Check for Bash/Shell tool - terminal-style display
  const isBash =
    part.tool.toLowerCase() === "bash" ||
    part.tool.toLowerCase() === "shell" ||
    part.tool.toLowerCase() === "run_command" ||
    part.tool.toLowerCase() === "execute";

  if (isBash) {
    const bashInput = part.state.input as Record<string, unknown> | undefined;
    const command = (bashInput?.command as string) || "";
    const description = (bashInput?.description as string) || "";

    return (
      <div className="my-2 animate-fade-in">
        <div className="rounded-md border border-border/50 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="text-muted-foreground">
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isError ? (
                <XCircle className="w-3.5 h-3.5 text-red-500/70" />
              ) : (
                <Terminal className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">Bash</span>
            <code className="text-xs text-foreground font-mono bg-muted/50 px-1.5 py-0.5 rounded truncate max-w-[400px]">
              $ {command}
            </code>
            {isCompleted && (
              <CheckCircle2 className="w-3 h-3 text-muted-foreground/50 ml-auto" />
            )}
            {!isCompleted && (
              <ChevronRight
                className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}
              />
            )}
          </button>

          {/* Description - subtle context */}
          {description && (
            <div className="px-3 py-1.5 text-[11px] text-muted-foreground/70 border-t border-border/20 bg-muted/10">
              {description}
            </div>
          )}

          {/* Expanded output - terminal style */}
          {isExpanded && part.state.output && (
            <div className="border-t border-border/30">
              <div className="px-3 py-1 text-[10px] text-muted-foreground/50 uppercase tracking-wider bg-muted/20">
                Output
              </div>
              <pre className="px-3 py-2 text-[11px] font-mono text-foreground/80 overflow-x-auto max-h-60 bg-zinc-950/5 dark:bg-zinc-950/30 whitespace-pre-wrap">
                {part.state.output.slice(0, 3000)}
                {part.state.output.length > 3000 ? "\n..." : ""}
              </pre>
            </div>
          )}

          {/* Error display */}
          {isExpanded && part.state.error && (
            <div className="border-t border-red-200/30 dark:border-red-900/30 p-2 bg-red-50 dark:bg-red-950/20">
              <pre className="text-[11px] text-red-600 dark:text-red-400 whitespace-pre-wrap">
                {part.state.error}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check for Write/Create tool - file creation display
  const isWrite =
    part.tool.toLowerCase() === "write" ||
    part.tool.toLowerCase() === "create" ||
    part.tool.toLowerCase() === "write_file" ||
    part.tool.toLowerCase() === "create_file";

  if (isWrite) {
    const writeInput = part.state.input as Record<string, unknown> | undefined;
    const filePath =
      (writeInput?.filePath as string) || (writeInput?.path as string) || "";
    const fileName = filePath.split("/").pop() || filePath;
    const content = (writeInput?.content as string) || "";

    return (
      <div className="my-2 animate-fade-in">
        <div className="rounded-md border border-border/50 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="text-muted-foreground">
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isError ? (
                <XCircle className="w-3.5 h-3.5 text-red-500/70" />
              ) : (
                <FilePlus className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">Write</span>
            <span className="text-xs text-foreground font-medium truncate">
              {fileName}
            </span>
            <ChevronRight
              className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {/* Expanded content preview */}
          {isExpanded && content && (
            <div className="border-t border-border/30">
              <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto max-h-60 bg-muted/20 whitespace-pre-wrap">
                {content.slice(0, 2000)}
                {content.length > 2000 ? "\n..." : ""}
              </pre>
            </div>
          )}

          {/* Error display */}
          {isExpanded && part.state.error && (
            <div className="border-t border-red-200/30 dark:border-red-900/30 p-2 bg-red-50 dark:bg-red-950/20">
              <pre className="text-[11px] text-red-600 dark:text-red-400 whitespace-pre-wrap">
                {part.state.error}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check for Read tool - minimal file preview
  const isRead = part.tool.toLowerCase() === "read";

  if (isRead) {
    const readInput = part.state.input as Record<string, unknown> | undefined;
    const filePath = (readInput?.filePath as string) || "";
    const fileName = filePath.split("/").pop() || filePath;

    return (
      <div className="my-2 animate-fade-in">
        <div className="rounded-md border border-border/50 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="text-muted-foreground">
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">Read</span>
            <span className="text-xs text-foreground font-medium truncate">
              {fileName}
            </span>
            <ChevronRight
              className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {/* Expanded code preview */}
          {isExpanded && part.state.output && (
            <div className="border-t border-border/30">
              <pre className="p-3 text-[11px] font-mono text-foreground/80 overflow-x-auto max-h-60 bg-muted/20 whitespace-pre-wrap">
                {part.state.output.slice(0, 2000)}
                {part.state.output.length > 2000 ? "\n..." : ""}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Check for Edit tool - minimal inline diff
  const isEdit = part.tool.toLowerCase() === "edit";

  if (isEdit) {
    const editInput = part.state.input as Record<string, unknown> | undefined;
    const filePath = (editInput?.filePath as string) || "";
    const fileName = filePath.split("/").pop() || filePath;
    const oldString = (editInput?.oldString as string) || "";
    const newString = (editInput?.newString as string) || "";

    return (
      <div className="my-2 animate-fade-in">
        <div className="rounded-md border border-border/50 overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-2 px-3 py-2 bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <div className="text-muted-foreground">
              {isRunning ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : isError ? (
                <XCircle className="w-3.5 h-3.5 text-red-500/70" />
              ) : (
                <FilePen className="w-3.5 h-3.5" />
              )}
            </div>
            <span className="text-xs text-muted-foreground">Edit</span>
            <span className="text-xs text-foreground font-medium truncate">
              {fileName}
            </span>
            <ChevronRight
              className={`w-3 h-3 text-muted-foreground/50 ml-auto transition-transform ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {/* Expanded diff view */}
          {isExpanded && (oldString || newString) && (
            <div className="border-t border-border/30 p-3 space-y-1 bg-muted/10">
              {/* Old string - deletions */}
              {oldString && (
                <div className="rounded bg-red-50 dark:bg-red-950/20 border border-red-200/50 dark:border-red-900/30 px-2 py-1.5">
                  <pre className="text-[11px] font-mono text-red-700 dark:text-red-400 whitespace-pre-wrap">
                    {oldString
                      .split("\n")
                      .map((line) => `- ${line}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
              {/* New string - additions */}
              {newString && (
                <div className="rounded bg-green-50 dark:bg-green-950/20 border border-green-200/50 dark:border-green-900/30 px-2 py-1.5">
                  <pre className="text-[11px] font-mono text-green-700 dark:text-green-400 whitespace-pre-wrap">
                    {newString
                      .split("\n")
                      .map((line) => `+ ${line}`)
                      .join("\n")}
                  </pre>
                </div>
              )}
            </div>
          )}

          {/* Error display */}
          {isExpanded && part.state.error && (
            <div className="border-t border-border/30 p-2 bg-red-50 dark:bg-red-950/20">
              <pre className="text-[11px] text-red-600 dark:text-red-400 whitespace-pre-wrap">
                {part.state.error}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  // For tasks, render a minimal elegant card
  if (isTask) {
    return (
      <div className="my-3 animate-fade-in">
        <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
          {/* Minimal Task Header */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors"
          >
            {/* Simple icon */}
            <div className="text-muted-foreground">
              {isRunning ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : isCompleted ? (
                <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
              ) : isError ? (
                <XCircle className="w-4 h-4 text-red-500/70" />
              ) : (
                <Brain className="w-4 h-4" />
              )}
            </div>

            {/* Task Info */}
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="serif-title-sm text-foreground">
                  {taskDescription ||
                    `${subagentType.charAt(0).toUpperCase() + subagentType.slice(1)} task`}
                </span>
                {isRunning && (
                  <span className="text-[10px] text-muted-foreground/70 italic">
                    running...
                  </span>
                )}
              </div>
            </div>

            {/* Expand indicator */}
            <ChevronRight
              className={`w-4 h-4 text-muted-foreground/50 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`}
            />
          </button>

          {/* Expanded Content */}
          {isExpanded && (
            <div className="border-t border-border/40 px-4 py-3 space-y-3">
              {/* Instructions - shown as quiet prose */}
              {taskPrompt && (
                <div className="text-sm text-muted-foreground leading-relaxed">
                  {taskPrompt}
                </div>
              )}

              {/* Raw params - very subtle */}
              {part.state.input && (
                <details className="group">
                  <summary className="text-[11px] text-muted-foreground/50 cursor-pointer hover:text-muted-foreground/70 flex items-center gap-1">
                    <ChevronRight className="w-3 h-3 group-open:rotate-90 transition-transform" />
                    parameters
                  </summary>
                  <pre className="mt-2 p-2 bg-muted/30 rounded text-[10px] overflow-x-auto font-mono text-muted-foreground/60">
                    {JSON.stringify(part.state.input, null, 2)}
                  </pre>
                </details>
              )}

              {/* Output */}
              {part.state.output && (
                <div className="pt-2 border-t border-border/30">
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <Streamdown>{part.state.output}</Streamdown>
                  </div>
                </div>
              )}

              {/* Error */}
              {part.state.error && (
                <div className="pt-2 border-t border-border/30">
                  <pre className="text-xs text-red-600/80 dark:text-red-400/80 whitespace-pre-wrap">
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
        <span className="ml-auto">
          {isRunning ? (
            <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
          ) : isCompleted ? (
            <CheckCircle2 className="w-3 h-3 text-muted-foreground" />
          ) : isError ? (
            <XCircle className="w-3 h-3 text-red-500/70" />
          ) : null}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-1 ml-4 pl-3 border-l-2 border-border text-xs space-y-2 py-2">
          {part.state.input && (
            <div>
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                Input
              </span>
              <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] overflow-x-auto font-mono">
                {JSON.stringify(part.state.input, null, 2)}
              </pre>
            </div>
          )}
          {part.state.output && (
            <div>
              <span className="text-muted-foreground text-[11px] uppercase tracking-wider">
                Output
              </span>
              <pre className="mt-1 p-2 bg-muted/50 rounded text-[11px] overflow-x-auto max-h-40 font-mono">
                {part.state.output}
              </pre>
            </div>
          )}
          {part.state.error && (
            <div className="p-2 bg-red-50 dark:bg-red-950/20 rounded">
              <span className="text-red-600 text-[11px] uppercase tracking-wider">
                Error
              </span>
              <pre className="mt-1 text-[11px] text-red-600">
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

// Helper to render user message content with mention badges
function renderUserContent(content: string) {
  const parts = [];
  let lastIndex = 0;
  const regex = /@\[(.*?)\]/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(content.slice(lastIndex, match.index));
    }

    const fullPath = match[1];
    const basename = fullPath.split("/").pop() || fullPath;

    // Add chip
    parts.push(
      <span key={match.index} className="mention-badge">
        {basename}
      </span>,
    );

    lastIndex = regex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < content.length) {
    parts.push(content.slice(lastIndex));
  }

  if (parts.length === 0) return content;

  return parts;
}

export function ChatArea({
  messages,
  hasActiveSession,
  onNewChat,
}: ChatAreaProps) {
  // Scroll state for scroll-to-bottom button
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  // Scroll to bottom function
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]",
      );
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

  // No active session - show start new chat prompt
  if (!hasActiveSession) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-6 animate-fade-in-up max-w-md px-6">
          {/* Logo */}
          <div className="relative mx-auto w-20 h-20">
            <img
              src="./logo.png"
              alt="Mars"
              className="w-full h-full object-contain"
            />
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-serif italic text-foreground">
              Welcome to{" "}
              <span className="bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                Mars
              </span>
            </h1>
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-border to-transparent mx-auto" />
            <p className="text-sm text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Your intelligent coding companion. Start a new conversation to
              explore code with AI assistance.
            </p>
          </div>

          <Button
            onClick={onNewChat}
            className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-200 px-8 py-3"
          >
            <MessageSquarePlus className="w-4 h-4 mr-2" />
            Start New Chat
          </Button>

          {/* Quick suggestions */}
          <div className="grid grid-cols-1 gap-2 text-xs">
            {[
              "Help me debug this React component",
              "Explain how this algorithm works",
              "Write tests for this function",
              "Optimize this code for performance",
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

  // Check if scrolled away from bottom
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.target as HTMLDivElement;
    const isNearBottom =
      target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    setShowScrollButton(!isNearBottom);
  };

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
          <div
            key={part.id}
            className="prose prose-sm max-w-none dark:prose-invert"
          >
            <Streamdown>{formatMentions(part.text)}</Streamdown>
          </div>
        );
      }
      return null;
    });
  };

  return (
    <div className="relative h-full" ref={scrollAreaRef}>
      <ScrollArea className="h-full" onScrollCapture={handleScroll}>
        <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
          {messages.map((message) => {
            const messageHasTextParts = message.parts?.some(
              (p) => p.type === "text",
            );
            return (
              <div
                key={message.id}
                className={`group ${message.role === "user" ? "animate-slide-in-right" : "animate-fade-in-up"}`}
              >
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
                    <div className="bg-primary text-primary-foreground px-4 py-2.5 max-w-[85%] rounded-md message-bubble shadow-sm text-sm whitespace-pre-wrap">
                      {renderUserContent(message.content)}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {/* Model Badge */}
                    {message.modelID && (
                      <div className="model-badge mb-2">{message.modelID}</div>
                    )}

                    {/* Render reasoning and tool parts AND text parts if available */}
                    {renderParts(message.parts)}

                    {/* Text content fallback - only if no text parts exist */}
                    {!messageHasTextParts && message.content && (
                      <div className="prose prose-sm max-w-none dark:prose-invert">
                        <Streamdown>
                          {formatMentions(message.content)}
                        </Streamdown>
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
                                    ({formatTokens(
                                      message.tokens.cache.read,
                                    )}{" "}
                                    cached)
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
