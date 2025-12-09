import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  CheckCircle2,
  Circle,
  Loader2,
  ListTodo,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import type { Todo } from "@/lib/api";
import { cn } from "@/lib/utils";

interface TaskPanelProps {
  todos?: Todo[];
  isOpen: boolean;
  className?: string;
}

interface TodoNode {
  todo: Todo;
  children: TodoNode[];
  level: number;
}

function TodoStateIcon({ state }: { state: Todo["state"] }) {
  switch (state) {
    case "completed":
      return (
        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
      );
    case "in_progress":
      return (
        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin flex-shrink-0" />
      );
    default:
      return (
        <Circle className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
      );
  }
}

function PriorityIndicator({ priority }: { priority?: Todo["priority"] }) {
  if (!priority || priority === "low") return null;

  return (
    <div
      className={cn(
        "w-1 h-1 rounded-full flex-shrink-0 mt-2",
        priority === "high" && "bg-red-500",
        priority === "medium" && "bg-yellow-500",
      )}
    />
  );
}

function TodoItem({
  node,
  isExpanded,
  onToggle,
}: {
  node: TodoNode;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const hasChildren = node.children.length > 0;
  const indent = node.level * 16;

  return (
    <div className="animate-fade-in-up">
      <div
        className={cn(
          "flex items-start gap-2 p-2 rounded-lg border border-border/30 bg-card/50",
          "hover:bg-accent/30 transition-colors duration-150",
          "cursor-default",
        )}
        style={{ marginLeft: `${indent}px` }}
      >
        {hasChildren && (
          <button
            onClick={onToggle}
            className="p-0.5 hover:bg-muted rounded transition-colors"
          >
            {isExpanded ? (
              <ChevronDown className="w-3 h-3 text-muted-foreground" />
            ) : (
              <ChevronRight className="w-3 h-3 text-muted-foreground" />
            )}
          </button>
        )}
        {!hasChildren && <div className="w-4" />}

        <TodoStateIcon state={node.todo.state} />
        <PriorityIndicator priority={node.todo.priority} />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              "text-sm leading-relaxed",
              node.todo.state === "completed" &&
                "text-muted-foreground line-through",
            )}
          >
            {node.todo.content}
          </p>
          <div className="flex items-center gap-2 mt-1">
            {node.todo.state && node.todo.state !== "pending" && (
              <span
                className={cn(
                  "inline-block text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                  node.todo.state === "completed" &&
                    "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
                  node.todo.state === "in_progress" &&
                    "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
                )}
              >
                {node.todo.state.replace("_", " ")}
              </span>
            )}
            {node.todo.priority && (
              <span
                className={cn(
                  "inline-block text-[9px] font-medium uppercase tracking-wider px-1.5 py-0.5 rounded",
                  node.todo.priority === "high" &&
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
                  node.todo.priority === "medium" &&
                    "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
                  node.todo.priority === "low" &&
                    "bg-gray-100 text-gray-600 dark:bg-gray-900/30 dark:text-gray-400",
                )}
              >
                {node.todo.priority}
              </span>
            )}
          </div>
        </div>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children.map((child) => (
            <TodoItem
              key={child.todo.id}
              node={child}
              isExpanded={true}
              onToggle={() => {}}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function TaskPanel({ todos = [], isOpen, className }: TaskPanelProps) {
  const { todoTree, expandedNodes } = useMemo(() => {
    // Build hierarchical tree structure
    const nodeMap = new Map<string, TodoNode>();
    const rootNodes: TodoNode[] = [];

    // Create nodes for all todos
    todos.forEach((todo) => {
      nodeMap.set(todo.id, {
        todo,
        children: [],
        level: 0,
      });
    });

    // Build hierarchy
    todos.forEach((todo) => {
      const node = nodeMap.get(todo.id)!;

      // Check if this is a subtask (e.g., "1.1", "1.2", "2.1.1")
      const parts = todo.id.split(".");
      if (parts.length > 1) {
        const parentId = parts.slice(0, -1).join(".");
        const parent = nodeMap.get(parentId);
        if (parent) {
          parent.children.push(node);
          node.level = parent.level + 1;
        } else {
          rootNodes.push(node);
        }
      } else {
        rootNodes.push(node);
      }
    });

    // Sort nodes by ID and priority
    const sortNodes = (nodes: TodoNode[]) => {
      nodes.sort((a, b) => {
        // First by priority (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        const aPriority = priorityOrder[a.todo.priority || "low"] || 1;
        const bPriority = priorityOrder[b.todo.priority || "low"] || 1;

        if (aPriority !== bPriority) {
          return bPriority - aPriority;
        }

        // Then by ID for natural ordering
        return a.todo.id.localeCompare(b.todo.id, undefined, { numeric: true });
      });

      nodes.forEach((node) => sortNodes(node.children));
    };

    sortNodes(rootNodes);

    // Auto-expand all nodes for now (can be made smarter later)
    const expanded = new Set<string>();
    const collectIds = (nodes: TodoNode[]) => {
      nodes.forEach((node) => {
        if (node.children.length > 0) {
          expanded.add(node.todo.id);
          collectIds(node.children);
        }
      });
    };
    collectIds(rootNodes);

    return {
      todoTree: rootNodes,
      expandedNodes: expanded,
    };
  }, [todos]);

  if (!isOpen) return null;

  return (
    <div className={cn("flex flex-col h-full sidebar-transition", className)}>
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
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="p-3 space-y-1">
          {todos.length === 0 ? (
            <div className="text-center py-8 space-y-2">
              <ListTodo className="w-8 h-8 mx-auto text-muted-foreground/50" />
              <p className="text-sm text-muted-foreground">No tasks yet</p>
              <p className="text-xs text-muted-foreground/70">
                Tasks will appear here when the AI creates a plan
              </p>
            </div>
          ) : (
            todoTree.map((node) => (
              <TodoItem
                key={node.todo.id}
                node={node}
                isExpanded={expandedNodes.has(node.todo.id)}
                onToggle={() => {}}
              />
            ))
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
