import { useState, useEffect } from "react";
import { History, MessageSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import * as api from "@/lib/api";

interface Session {
  id: string;
  title?: string;
  createdAt?: string;
}

interface SessionHistoryProps {
  onSessionSelect: (session: Session) => void;
  activeSessionId?: string;
  onSessionDelete?: (sessionId: string) => void;
}

export function SessionHistory({
  onSessionSelect,
  activeSessionId,
  onSessionDelete,
}: SessionHistoryProps) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch sessions when popover opens
  useEffect(() => {
    if (isOpen) {
      fetchSessions();
    }
  }, [isOpen]);

  const fetchSessions = async () => {
    setIsLoading(true);
    try {
      const sessionList = await api.listSessions();
      // Sort by createdAt if available, newest first
      const sorted = sessionList.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setSessions(sorted);
    } catch (error) {
      console.error("Failed to fetch sessions:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    if (onSessionDelete) {
      onSessionDelete(sessionId);
      // Remove from local state immediately
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground transition-all duration-150 hover:scale-105 active:scale-95"
          title="Session History"
        >
          <History className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-popover/95 backdrop-blur-xl border-border/50 rounded-md"
        align="start"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border/50">
          <h3 className="serif-title text-base flex items-center gap-2">
            <img src="/logo.png" alt="Mars" className="h-4 w-4" />
            Session History
          </h3>
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Loading sessions...
            </div>
          ) : sessions.length === 0 ? (
            <div className="p-4 text-center serif-title-sm text-muted-foreground">
              No sessions yet
            </div>
          ) : (
            <div className="py-1">
              {sessions.map((session, index) => (
                <div
                  key={session.id}
                  className={cn(
                    "group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-sm mx-1",
                    "transition-all duration-150 ease-out",
                    "hover:bg-accent/50 hover:translate-x-0.5",
                    activeSessionId === session.id && "bg-accent/30",
                    "animate-fade-in",
                  )}
                  style={{ animationDelay: `${index * 30}ms` }}
                  onClick={() => {
                    onSessionSelect(session);
                    setIsOpen(false);
                  }}
                >
                  <MessageSquare
                    className={cn(
                      "h-4 w-4 flex-shrink-0",
                      activeSessionId === session.id
                        ? "text-primary"
                        : "text-muted-foreground",
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "text-sm truncate",
                        activeSessionId === session.id
                          ? "font-medium"
                          : "text-foreground/90",
                      )}
                    >
                      {session.title || "Untitled Session"}
                    </p>
                    {session.createdAt && (
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(session.createdAt)}
                      </p>
                    )}
                  </div>
                  {onSessionDelete && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-all duration-150 text-muted-foreground hover:text-destructive hover:scale-110 active:scale-95"
                      onClick={(e) => handleDelete(e, session.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
