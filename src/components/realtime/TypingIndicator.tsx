/**
 * Typing Indicator Component
 * Shows animated dots when someone is typing
 */

import { cn } from "@/lib/utils";

interface TypingIndicatorProps {
  /** Names of users who are typing */
  users: string[];
  /** Maximum names to show before abbreviating */
  maxNames?: number;
  /** Custom class name */
  className?: string;
  /** Variant style */
  variant?: "dots" | "text" | "bubble";
}

// Animated typing dots
const TypingDots = () => (
  <span className="inline-flex items-center gap-0.5">
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.3s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce [animation-delay:-0.15s]" />
    <span className="w-1.5 h-1.5 rounded-full bg-current animate-bounce" />
  </span>
);

export function TypingIndicator({
  users,
  maxNames = 2,
  className,
  variant = "bubble",
}: TypingIndicatorProps) {
  if (users.length === 0) {
    return null;
  }

  // Format the typing message
  const getTypingText = () => {
    if (users.length === 1) {
      return `${users[0]} tippt`;
    }

    if (users.length === 2) {
      return `${users[0]} und ${users[1]} tippen`;
    }

    if (users.length <= maxNames) {
      const lastUser = users[users.length - 1];
      const otherUsers = users.slice(0, -1).join(", ");
      return `${otherUsers} und ${lastUser} tippen`;
    }

    const displayedUsers = users.slice(0, maxNames).join(", ");
    const remainingCount = users.length - maxNames;
    return `${displayedUsers} und ${remainingCount} weitere tippen`;
  };

  if (variant === "dots") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground text-sm",
          className
        )}
      >
        <TypingDots />
      </div>
    );
  }

  if (variant === "text") {
    return (
      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground text-sm",
          className
        )}
      >
        <span>{getTypingText()}</span>
        <TypingDots />
      </div>
    );
  }

  // Bubble variant (default) - looks like a chat message
  return (
    <div className={cn("flex items-start gap-2", className)}>
      <div className="rounded-lg px-3 py-2 bg-muted max-w-[200px]">
        <div className="flex items-center gap-2">
          <TypingDots />
        </div>
        <p className="text-xs text-muted-foreground mt-1 truncate">
          {getTypingText()}...
        </p>
      </div>
    </div>
  );
}

export default TypingIndicator;
