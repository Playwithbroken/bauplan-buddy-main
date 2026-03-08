/**
 * Mention Input Component
 * Input with @mention autocomplete functionality
 */

import { useState, useRef, useEffect, useCallback, forwardRef } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface MentionUser {
  id: string;
  name: string;
  avatar?: string;
  role?: string;
  isOnline?: boolean;
}

interface MentionInputProps {
  /** Current input value */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Callback when mention is selected */
  onMention?: (user: MentionUser) => void;
  /** Available users to mention */
  users: MentionUser[];
  /** Placeholder text */
  placeholder?: string;
  /** Custom class name */
  className?: string;
  /** Disabled state */
  disabled?: boolean;
  /** On key press handler (for Enter to send) */
  onKeyPress?: (e: React.KeyboardEvent) => void;
  /** On submit (Enter key) */
  onSubmit?: () => void;
}

export const MentionInput = forwardRef<HTMLInputElement, MentionInputProps>(
  (
    {
      value,
      onChange,
      onMention,
      users,
      placeholder = "Nachricht schreiben... (@für Erwähnung)",
      className,
      disabled,
      onKeyPress,
      onSubmit,
    },
    ref
  ) => {
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestionFilter, setSuggestionFilter] = useState("");
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [mentionStartIndex, setMentionStartIndex] = useState(-1);
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Combine refs
    useEffect(() => {
      if (typeof ref === "function") {
        ref(inputRef.current);
      } else if (ref) {
        ref.current = inputRef.current;
      }
    }, [ref]);

    // Filter users based on input
    const filteredUsers = users.filter((user) =>
      user.name.toLowerCase().includes(suggestionFilter.toLowerCase())
    );

    // Handle input change
    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        const cursorPos = e.target.selectionStart || 0;
        onChange(newValue);

        // Check for @ trigger
        const textBeforeCursor = newValue.slice(0, cursorPos);
        const lastAtIndex = textBeforeCursor.lastIndexOf("@");

        if (lastAtIndex !== -1) {
          // Check if @ is at start or preceded by space
          const charBeforeAt = textBeforeCursor[lastAtIndex - 1];
          if (
            lastAtIndex === 0 ||
            charBeforeAt === " " ||
            charBeforeAt === "\n"
          ) {
            const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1);
            // Only show suggestions if no space after @
            if (!textAfterAt.includes(" ")) {
              setMentionStartIndex(lastAtIndex);
              setSuggestionFilter(textAfterAt);
              setShowSuggestions(true);
              setSelectedIndex(0);
              return;
            }
          }
        }

        setShowSuggestions(false);
        setMentionStartIndex(-1);
      },
      [onChange]
    );

    // Handle user selection
    const selectUser = useCallback(
      (user: MentionUser) => {
        if (mentionStartIndex === -1) return;

        const beforeMention = value.slice(0, mentionStartIndex);
        const afterCursor = value.slice(
          mentionStartIndex + suggestionFilter.length + 1
        );
        const newValue = `${beforeMention}@${user.name} ${afterCursor}`;

        onChange(newValue);
        onMention?.(user);
        setShowSuggestions(false);
        setMentionStartIndex(-1);
        setSuggestionFilter("");

        // Focus back on input
        inputRef.current?.focus();
      },
      [value, mentionStartIndex, suggestionFilter, onChange, onMention]
    );

    // Handle keyboard navigation
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!showSuggestions) {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            onSubmit?.();
          }
          return;
        }

        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev < filteredUsers.length - 1 ? prev + 1 : 0
            );
            break;
          case "ArrowUp":
            e.preventDefault();
            setSelectedIndex((prev) =>
              prev > 0 ? prev - 1 : filteredUsers.length - 1
            );
            break;
          case "Enter":
          case "Tab":
            e.preventDefault();
            if (filteredUsers[selectedIndex]) {
              selectUser(filteredUsers[selectedIndex]);
            }
            break;
          case "Escape":
            e.preventDefault();
            setShowSuggestions(false);
            break;
        }
      },
      [showSuggestions, filteredUsers, selectedIndex, selectUser, onSubmit]
    );

    // Close suggestions when clicking outside
    useEffect(() => {
      const handleClickOutside = (e: MouseEvent) => {
        if (
          containerRef.current &&
          !containerRef.current.contains(e.target as Node)
        ) {
          setShowSuggestions(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
      <div ref={containerRef} className={cn("relative", className)}>
        <Input
          ref={inputRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyPress={onKeyPress}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full"
        />

        {/* Suggestions dropdown */}
        {showSuggestions && filteredUsers.length > 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-lg border bg-popover shadow-lg overflow-hidden">
            <ScrollArea className="max-h-[200px]">
              <div className="p-1">
                {filteredUsers.map((user, index) => (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => selectUser(user)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2 rounded-md text-left transition-colors",
                      index === selectedIndex
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="relative">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          {user.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      {user.isOnline && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {user.name}
                      </p>
                      {user.role && (
                        <p className="text-xs text-muted-foreground truncate">
                          {user.role}
                        </p>
                      )}
                    </div>
                    {user.isOnline && (
                      <Badge variant="outline" className="text-[10px] shrink-0">
                        Online
                      </Badge>
                    )}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* No results message */}
        {showSuggestions && filteredUsers.length === 0 && (
          <div className="absolute bottom-full left-0 right-0 mb-1 z-50 rounded-lg border bg-popover shadow-lg p-3 text-center text-sm text-muted-foreground">
            Keine Benutzer gefunden für "{suggestionFilter}"
          </div>
        )}
      </div>
    );
  }
);

MentionInput.displayName = "MentionInput";

export default MentionInput;
