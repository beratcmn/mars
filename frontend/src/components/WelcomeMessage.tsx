import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WelcomeMessageProps {
  onNewChat?: () => void;
  showButton?: boolean;
}

export function WelcomeMessage({ onNewChat, showButton = true }: WelcomeMessageProps) {
  return (
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
      </div>

      {showButton && onNewChat && (
        <Button
          onClick={onNewChat}
          className="shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 text-sm font-medium rounded-full"
        >
          <MessageSquarePlus className="w-4 h-4 mr-2" />
          Start New Chat
        </Button>
      )}
    </div>
  );
}
