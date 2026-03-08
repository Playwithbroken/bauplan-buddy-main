import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";
import { LiveChat } from "./LiveChat";
import { Badge } from "@/components/ui/badge";
import { chatService } from "@/services/chatService";

export function FloatingChatButton() {
  const { isAuthenticated } = useAuth();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubscribe = chatService.subscribeToUnreadCount((count) => {
      setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [isAuthenticated]);

  // Don't show chat button if user is not logged in
  if (!isAuthenticated) {
    return null;
  }

  return (
    <>
      <Button
        size="compact"
        aria-label="Team-Chat oeffnen"
        className="fixed bottom-6 right-[6.8rem] h-12 w-12 rounded-full shadow-lg hover:scale-105 transition-transform z-40 bg-card text-foreground border border-border"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        <MessageCircle className="h-6 w-6" />
        {unreadCount > 0 && (
          <Badge
            variant="destructive"
            className="absolute -top-1 -right-1 h-6 w-6 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 9 ? "9+" : unreadCount}
          </Badge>
        )}
      </Button>
      <LiveChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </>
  );
}
