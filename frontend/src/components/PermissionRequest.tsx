import { useState } from "react";
import { Shield, Check, X, Terminal, FileText, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@/lib/api";

interface PermissionRequestProps {
  permission: Permission;
  onRespond: (response: "allow" | "deny", remember: boolean) => void;
}

export function PermissionRequest({ permission, onRespond }: PermissionRequestProps) {
  const [remember, setRemember] = useState(false);
  const [isResponding, setIsResponding] = useState(false);

  const handleRespond = (response: "allow" | "deny") => {
    setIsResponding(true);
    onRespond(response, remember);
  };

  const getIcon = () => {
    switch (permission.type) {
      case "bash":
      case "shell":
        return <Terminal className="w-5 h-5 text-amber-500" />;
      case "read":
      case "write":
      case "edit":
        return <FileText className="w-5 h-5 text-blue-500" />;
      default:
        return <Shield className="w-5 h-5 text-purple-500" />;
    }
  };

  const getDetails = () => {
    if (permission.metadata?.command) {
      return (
        <div className="mt-2 bg-zinc-950/50 rounded-md p-2 border border-border/50 overflow-hidden">
          <code className="text-xs font-mono text-foreground/90 break-all whitespace-pre-wrap">
            {permission.metadata.command as string}
          </code>
        </div>
      );
    }
    
    if (permission.metadata?.path) {
      return (
        <div className="mt-2 text-sm text-foreground/80">
          <span className="font-medium">Path:</span> {permission.metadata.path as string}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="mx-auto max-w-2xl my-4 animate-fade-in-up">
      <div className="bg-card border border-amber-500/30 shadow-lg rounded-lg overflow-hidden ring-1 ring-amber-500/10">
        <div className="p-4">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-500/10 rounded-full shrink-0">
              {getIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold flex items-center gap-2">
                Permission Requested
                <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                  {permission.type}
                </span>
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                The agent wants to execute an action that requires your approval.
              </p>
              
              <div className="mt-3 text-sm font-medium text-foreground">
                {permission.title}
              </div>

              {getDetails()}

              {/* Warning for high risk actions */}
              {(permission.type === "bash" || permission.type === "shell") && (
                <div className="mt-3 flex items-start gap-2 text-xs text-amber-600 dark:text-amber-500 bg-amber-500/5 p-2 rounded border border-amber-500/20">
                  <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                  <p>
                    Shell commands can modify your system. Only allow if you understand what this command does.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 flex items-center justify-between border-t border-border/50 pt-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors select-none">
              <input
                type="checkbox"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
                className="w-4 h-4 rounded border-border bg-background text-primary focus:ring-primary/20"
              />
              Remember my choice for similar requests
            </label>
            
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleRespond("deny")}
                disabled={isResponding}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 border border-transparent hover:border-red-200 dark:hover:border-red-900/30",
                  isResponding && "opacity-50 cursor-not-allowed"
                )}
              >
                <X className="w-4 h-4" />
                Deny
              </button>
              <button
                onClick={() => handleRespond("allow")}
                disabled={isResponding}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium transition-colors",
                  "bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm",
                  isResponding && "opacity-50 cursor-not-allowed"
                )}
              >
                <Check className="w-4 h-4" />
                Allow
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
