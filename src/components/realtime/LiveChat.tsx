import { useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  chatService,
  ChatMessage as ServiceMessage,
  ChatRoom,
} from "@/services/chatService";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Send,
  MessageSquare,
  X,
  Paperclip,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { de } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { TypingIndicator } from "./TypingIndicator";
import { MentionInput, type MentionUser } from "./MentionInput";

interface ChatMessageUI {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  message: string;
  timestamp: Date;
  isCurrentUser: boolean;
  type: "text" | "image" | "file" | "system";
  fileUrl?: string;
  fileName?: string;
}

interface LiveChatProps {
  projectId?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function LiveChat({ projectId, isOpen, onClose }: LiveChatProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<ChatMessageUI[]>([]);
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [activeRoomId, setActiveRoomId] = useState("general");
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [mentionableUsers, setMentionableUsers] = useState<MentionUser[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentUserId = user?.id || "guest";
  const currentUserName = user?.name || "Gast";

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load rooms and initial messages
  useEffect(() => {
    const loadMessages = async () => {
      const dbMessages = await chatService.getMessages(activeRoomId);
      setMessages(
        dbMessages.map((m) => ({
          id: m.id,
          userId: m.senderId,
          userName: m.senderName,
          message: m.text,
          timestamp: m.timestamp,
          isCurrentUser: m.senderId === currentUserId,
          type: m.type,
          fileUrl: m.fileUrl,
          fileName: m.fileName,
        }))
      );
    };

    setRooms([...chatService.getRooms()]);
    loadMessages();

    // Mark room as read
    if (isOpen) {
      chatService.markRoomAsRead(activeRoomId);
    }

    const unsubscribe = chatService.subscribe((m) => {
      // Refresh rooms to get latest previews/unread
      setRooms([...chatService.getRooms()]);

      if (m.roomId === activeRoomId) {
        setMessages((prev) => [
          ...prev,
          {
            id: m.id,
            userId: m.senderId,
            userName: m.senderName,
            message: m.text,
            timestamp: m.timestamp,
            isCurrentUser: m.senderId === currentUserId,
            type: m.type,
            fileUrl: m.fileUrl,
            fileName: m.fileName,
          },
        ]);

        // Mark as read if currently in this room
        if (isOpen) {
          chatService.markRoomAsRead(activeRoomId);
        }
      }
    });

    // Set up mock mentionable users (in production, fetch from API)
    setMentionableUsers([
      {
        id: "user-1",
        name: "Max Mustermann",
        role: "Projektleiter",
        isOnline: true,
      },
      {
        id: "user-2",
        name: "Anna Schmidt",
        role: "Bauleitung",
        isOnline: true,
      },
      { id: "user-3", name: "Peter Weber", role: "Polier", isOnline: false },
      { id: "user-4", name: "Lisa Meyer", role: "Einkauf", isOnline: true },
    ]);

    // Simulate typing indicators from other users (demo only)
    const typingInterval = setInterval(() => {
      const randomTyping = Math.random() > 0.85;
      if (randomTyping) {
        setTypingUsers(["Anna Schmidt"]);
        setTimeout(() => setTypingUsers([]), 2500);
      }
    }, 10000);

    return () => {
      unsubscribe();
      clearInterval(typingInterval);
    };
  }, [activeRoomId, currentUserId, isOpen]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !user) return;

    await chatService.sendMessage(
      activeRoomId,
      {
        id: user.id,
        name: user.name,
      },
      newMessage
    );

    setNewMessage("");
    setIsTyping(false);
  };

  const handleTyping = (value: string) => {
    setNewMessage(value);

    // Typing status simulation
    if (value && !isTyping) {
      setIsTyping(true);
    }

    // Clear previous timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Stop typing after 2 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[400px]">
      <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur-sm overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 bg-primary text-primary-foreground">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            <div>
              <CardTitle className="text-sm font-bold">Team Chat</CardTitle>
              <p className="text-[10px] opacity-80 uppercase tracking-wider">
                {rooms.find((r) => r.id === activeRoomId)?.name || "Allgemein"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex flex-col h-[500px]">
          {/* Room Selector (Horizontal) */}
          <div className="flex gap-2 p-2 bg-muted/50 border-b overflow-x-auto no-scrollbar">
            {rooms.map((room) => (
              <div key={room.id} className="relative">
                <Button
                  variant={activeRoomId === room.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveRoomId(room.id)}
                  className="whitespace-nowrap h-7 text-[11px] rounded-full"
                >
                  {room.name}
                </Button>
                {room.unreadCount > 0 && activeRoomId !== room.id && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground">
                    {room.unreadCount}
                  </span>
                )}
              </div>
            ))}
          </div>
          {/* Messages */}
          <ScrollArea className="h-[400px] px-4">
            <div className="space-y-4 py-4">
              {messages.length === 0 && (
                <div className="text-center text-sm text-muted-foreground py-8">
                  Noch keine Nachrichten. Starten Sie das Gespräch!
                </div>
              )}
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-2",
                    msg.isCurrentUser && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarImage src={msg.userAvatar} alt={msg.userName} />
                    <AvatarFallback className="text-xs">
                      {msg.userName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div
                    className={cn(
                      "flex flex-col gap-1 max-w-[70%]",
                      msg.isCurrentUser && "items-end"
                    )}
                  >
                    <div
                      className={cn(
                        "rounded-lg px-3 py-2",
                        msg.isCurrentUser
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      )}
                    >
                      {msg.type === "image" && (
                        <div className="mb-2 overflow-hidden rounded-md border bg-black">
                          <img
                            src={msg.fileUrl}
                            alt="Attachment"
                            className="max-h-[200px] w-auto object-contain cursor-pointer transition-transform hover:scale-110"
                            onClick={() => window.open(msg.fileUrl, "_blank")}
                          />
                        </div>
                      )}
                      {msg.type === "file" && (
                        <div
                          className="mb-2 flex items-center gap-2 p-2 rounded bg-muted/50 border hover:bg-muted transition-colors cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, "_blank")}
                        >
                          <div className="h-8 w-8 rounded bg-primary/10 flex items-center justify-center">
                            <FileText className="h-4 w-4 text-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">
                              {msg.fileName || "Dokument"}
                            </p>
                            <p className="text-[10px] opacity-70">
                              Datei herunterladen
                            </p>
                          </div>
                        </div>
                      )}
                      <p className="text-sm">{msg.message}</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-1">
                      {formatDistanceToNow(msg.timestamp, {
                        addSuffix: true,
                        locale: de,
                      })}
                    </p>
                  </div>
                </div>
              ))}
              {/* Typing indicator */}
              {typingUsers.length > 0 && (
                <TypingIndicator
                  users={typingUsers}
                  variant="bubble"
                  className="mt-2"
                />
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="border-t p-4 space-y-2">
            <div className="flex gap-2">
              <input
                type="file"
                id="chat-file"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file || !user) return;

                  try {
                    toast({
                      title: "Datei wird hochgeladen...",
                      description: file.name,
                    });

                    const url = await chatService.uploadFile(file);
                    const type = file.type.startsWith("image/")
                      ? "image"
                      : "file";

                    await chatService.sendMessage(
                      activeRoomId,
                      { id: user.id, name: user.name },
                      "",
                      type,
                      url,
                      file.name
                    );
                  } catch (error) {
                    toast({
                      title: "Upload fehlgeschlagen",
                      description: "Die Datei konnte nicht hochgeladen werden.",
                      variant: "destructive",
                    });
                  }
                }}
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 text-muted-foreground"
                onClick={() => document.getElementById("chat-file")?.click()}
              >
                <Paperclip className="h-4 w-4" />
              </Button>
              <MentionInput
                value={newMessage}
                onChange={handleTyping}
                users={mentionableUsers}
                placeholder="Nachricht schreiben... (@für Erwähnung)"
                onSubmit={handleSendMessage}
                onMention={(user) => {
                  // In production: trigger notification to mentioned user
                  console.log("Mentioned user:", user.name);
                }}
                className="flex-1"
              />
              <Button
                size="icon"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
                className="h-9 w-9"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
