import { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    Circle,
    Loader2,
    ListTodo,
    RefreshCw,
} from "lucide-react";
import * as api from "@/lib/api";
import type { Todo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TaskPanelProps {
    sessionId?: string;
    isOpen: boolean;
    className?: string;
}

function TodoStateIcon({ state }: { state: Todo["state"] }) {
    switch (state) {
        case "completed":
            return <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />;
        case "in_progress":
            return <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />;
        default:
            return <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />;
    }
}

export function TaskPanel({ sessionId, isOpen, className }: TaskPanelProps) {
    const [todos, setTodos] = useState<Todo[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchTodos = async () => {
        if (!sessionId) {
            setTodos([]);
            return;
        }

        setIsLoading(true);
        try {
            const todoList = await api.listTodos(sessionId);
            setTodos(todoList);
        } catch (error) {
            console.error("Failed to fetch todos:", error);
            setTodos([]);
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch todos when session changes or panel opens
    useEffect(() => {
        if (isOpen && sessionId) {
            fetchTodos();
        }
    }, [sessionId, isOpen]);

    if (!isOpen) return null;

    return (
        <div
            className={cn(
                "border-l border-border/50 bg-background flex flex-col overflow-hidden sidebar-transition",
                className
            )}
        >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <ListTodo className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Tasks</span>
                    {todos.length > 0 && (
                        <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                            {todos.length}
                        </span>
                    )}
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    onClick={fetchTodos}
                    disabled={isLoading}
                >
                    <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                </Button>
            </div>

            {/* Content */}
            <ScrollArea className="flex-1">
                <div className="p-3 space-y-2">
                    {isLoading && todos.length === 0 ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : todos.length === 0 ? (
                        <div className="text-center py-8 space-y-2">
                            <ListTodo className="w-8 h-8 mx-auto text-muted-foreground/50" />
                            <p className="text-sm text-muted-foreground">No tasks yet</p>
                            <p className="text-xs text-muted-foreground/70">
                                Tasks will appear here when the AI creates a plan
                            </p>
                        </div>
                    ) : (
                        todos.map((todo) => (
                            <div
                                key={todo.id}
                                className={cn(
                                    "flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-card",
                                    "hover:bg-accent/50 transition-colors duration-150",
                                    "animate-fade-in-up"
                                )}
                            >
                                <TodoStateIcon state={todo.state} />
                                <div className="flex-1 min-w-0">
                                    <p
                                        className={cn(
                                            "text-sm leading-relaxed",
                                            todo.state === "completed" && "text-muted-foreground line-through"
                                        )}
                                    >
                                        {todo.content}
                                    </p>
                                    {todo.state && todo.state !== "pending" && (
                                        <span
                                            className={cn(
                                                "inline-block mt-1 text-[10px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                todo.state === "completed" && "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                                                todo.state === "in_progress" && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                                            )}
                                        >
                                            {todo.state.replace("_", " ")}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </ScrollArea>
        </div>
    );
}
