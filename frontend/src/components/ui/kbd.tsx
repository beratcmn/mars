import * as React from "react";
import { cn } from "@/lib/utils";

interface KbdProps extends React.HTMLAttributes<HTMLElement> {
  children: React.ReactNode;
}

const Kbd = React.forwardRef<HTMLElement, KbdProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <kbd
        ref={ref}
        className={cn(
          "inline-flex h-5 min-w-5 items-center justify-center rounded border border-border/50",
          "bg-muted/50 px-1.5 font-mono text-[10px] font-medium text-muted-foreground",
          "shadow-[0_1px_0_1px_rgba(0,0,0,0.04)]",
          className,
        )}
        {...props}
      >
        {children}
      </kbd>
    );
  },
);

Kbd.displayName = "Kbd";

export { Kbd };
