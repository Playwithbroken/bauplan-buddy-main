import React, { useState, useEffect, useRef, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Send,
  Search,
  Smile,
  Paperclip,
  MoreVertical,
  Phone,
  Video,
  Users,
  Settings,
  Archive,
  UserPlus,
  Hash,
  MessageCircle,
  Clock,
  Check,
  CheckCheck,
  X,
  Reply,
  Edit3,
  Trash2,
  Image as ImageIcon,
  File,
  Briefcase,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import MessagingService, {
  ChatRoom,
  ChatMessage,
  TypingIndicator,
} from "@/services/messagingService";
import { ProjectService } from "@/services/projectService";
import { teamService, TeamMember } from "@/services/TeamService";
import { Project } from "@/services/api/projects.api";

interface ChatInterfaceProps {
  currentUserId?: string;
  className?: string;
}

export function ChatInterface({
  currentUserId = "current-user",
  className,
}: ChatInterfaceProps) {
  // State
  const [rooms, setRooms] = useState<ChatRoom[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<ChatRoom | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [typingUsers, setTypingUsers] = useState<TypingIndicator[]>([]);
  const [showNewRoomDialog, setShowNewRoomDialog] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [availableProjects, setAvailableProjects] = useState<Project[]>([]);
  const [availableEmployees, setAvailableEmployees] = useState<TeamMember[]>(
    []
  );

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  // Initialize messaging service and fetch entities
  useEffect(() => {
    MessagingService.initialize(currentUserId);

    // Load initial data
    const initialRooms = MessagingService.getRooms();
    setRooms(initialRooms);

    // Fetch projects and employees for search/room creation
    const fetchEntities = async () => {
      try {
        const [projects, employees] = await Promise.all([
          ProjectService.getAll(),
          teamService.listMembers(),
        ]);
        setAvailableProjects(projects);
        setAvailableEmployees(employees);
      } catch (error) {
        console.error("Failed to fetch entities for chat:", error);
      }
    };
    fetchEntities();

    // Set initial selected room if none selected yet
    if (initialRooms.length > 0 && !selectedRoom) {
      setSelectedRoom(initialRooms[0]);
    }

    // Subscribe to room updates
    const unsubscribeRooms = MessagingService.onRoomsUpdate(setRooms);

    return () => {
      unsubscribeRooms();
    };
  }, [currentUserId]);

  // Load messages when room changes
  useEffect(() => {
    if (selectedRoom) {
      const roomMessages = MessagingService.getMessages(selectedRoom.id);
      setMessages(roomMessages);

      // Mark as read
      MessagingService.markAsRead(selectedRoom.id);

      // Subscribe to new messages
      const unsubscribeMessages = MessagingService.onMessage(
        selectedRoom.id,
        (newMessage) => {
          setMessages((prev) => [...prev, newMessage]);
        }
      );

      // Subscribe to typing indicators
      const unsubscribeTyping = MessagingService.onTyping(
        selectedRoom.id,
        setTypingUsers
      );

      return () => {
        unsubscribeMessages();
        unsubscribeTyping();
      };
    } else {
      setMessages([]);
    }
  }, [selectedRoom]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingUsers]);

  const handleSendMessage = async () => {
    if (!messageInput.trim() || !selectedRoom) return;

    try {
      await MessagingService.sendMessage(messageInput, selectedRoom.id);
      setMessageInput("");
      setIsTyping(false);
      MessagingService.stopTyping(selectedRoom.id);
    } catch (error) {
      toast({
        title: "Fehler beim Senden",
        description: "Die Nachricht konnte nicht gesendet werden.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (value: string) => {
    setMessageInput(value);

    if (selectedRoom) {
      if (!isTyping && value.trim()) {
        setIsTyping(true);
        MessagingService.startTyping(selectedRoom.id);
      }

      // Reset typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false);
        MessagingService.stopTyping(selectedRoom.id);
      }, 3000);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateRoom = (
    name: string,
    type: ChatRoom["type"],
    participantIds: string[] = [],
    projectId?: string
  ) => {
    const roomName = name || "Neuer Raum";
    const newRoom = MessagingService.createRoom(
      roomName,
      type,
      participantIds,
      projectId
    );
    setSelectedRoom(newRoom);
    setNewRoomName("");
    setShowNewRoomDialog(false);

    toast({
      title: "Raum erstellt",
      description: `Der Raum "${roomName}" wurde erfolgreich erstellt.`,
    });
  };

  const handleAddReaction = (messageId: string, emoji: string) => {
    if (selectedRoom) {
      MessagingService.addReaction(messageId, selectedRoom.id, emoji);
    }
  };

  // Search Logic (Rooms + Projects + People)
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { rooms, projects: [], people: [] };

    const query = searchQuery.toLowerCase();

    return {
      rooms: rooms.filter((r) => r.name.toLowerCase().includes(query)),
      projects: availableProjects.filter(
        (p) =>
          p.name.toLowerCase().includes(query) &&
          !rooms.some((r) => r.projectId === p.id)
      ),
      people: availableEmployees.filter(
        (e) => e.name.toLowerCase().includes(query) && e.id !== currentUserId
      ),
    };
  }, [
    searchQuery,
    rooms,
    availableProjects,
    availableEmployees,
    currentUserId,
  ]);

  const getMessageStatusIcon = (status: ChatMessage["status"]) => {
    switch (status) {
      case "sending":
        return <Clock className="h-3 w-3 text-gray-400" />;
      case "sent":
        return <Check className="h-3 w-3 text-gray-400" />;
      case "delivered":
        return <CheckCheck className="h-3 w-3 text-gray-400" />;
      case "read":
        return <CheckCheck className="h-3 w-3 text-blue-500" />;
      case "failed":
        return <X className="h-3 w-3 text-red-500" />;
      default:
        return null;
    }
  };

  const formatTimestamp = (timestamp: Date | string | number | undefined) => {
    if (!timestamp) return "Jetzt";
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return "Jetzt";

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0)
      return date.toLocaleTimeString("de-DE", {
        hour: "2-digit",
        minute: "2-digit",
      });
    if (days === 1) return "Gestern";
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
    });
  };

  return (
    <div
      className={`flex flex-col md:flex-row border rounded-lg bg-background ${
        className || "h-[80vh] min-h-[500px]"
      }`}
    >
      {/* Sidebar */}
      <div
        className={`${
          showSidebar ? "flex" : "hidden"
        } md:flex flex-col w-full md:w-1/3 lg:w-1/4 xl:w-1/3 border-r bg-muted/30`}
      >
        <div className="p-4 border-b space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold">Nachrichten</h3>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => setShowNewRoomDialog(true)}
            >
              <UserPlus className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Suchen nach Räumen, Projekten, Team..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2 space-y-4">
            {/* Rooms Section */}
            <div>
              <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Meine Chats
              </p>
              {searchResults.rooms.length > 0 ? (
                searchResults.rooms.map((room) => (
                  <button
                    key={room.id}
                    className={`w-full flex items-center space-x-3 p-3 rounded-lg text-left transition-all ${
                      selectedRoom?.id === room.id
                        ? "bg-primary/10 border-primary/20 shadow-sm"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => {
                      setSelectedRoom(room);
                      if (window.innerWidth < 768) setShowSidebar(false);
                    }}
                  >
                    <Avatar className="h-10 w-10 border">
                      <AvatarImage
                        src={
                          room.participants.find(
                            (p) => p.userId !== currentUserId
                          )?.userAvatar
                        }
                      />
                      <AvatarFallback>
                        {room.type === "project" ? (
                          <Hash className="h-5 w-5" />
                        ) : (
                          <Users className="h-5 w-5" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold truncate">
                          {room.name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {formatTimestamp(room.lastActivity)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {room.lastMessage?.content || "Keine Nachrichten"}
                      </p>
                    </div>
                  </button>
                ))
              ) : searchQuery ? null : (
                <p className="px-3 py-4 text-sm text-center text-muted-foreground">
                  Keine Chats gefunden
                </p>
              )}
            </div>

            {/* Quick Actions / New Scopes from Search */}
            {searchQuery && (
              <>
                {searchResults.projects.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Neue Projekträume
                    </p>
                    {searchResults.projects.map((p) => (
                      <button
                        key={p.id}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-muted"
                        onClick={() =>
                          handleCreateRoom(
                            `Projekt: ${p.name}`,
                            "project",
                            [],
                            p.id
                          )
                        }
                      >
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Briefcase className="h-5 w-5" />
                        </div>
                        <div className="flex-1 truncate">
                          <span className="text-sm font-medium">{p.name}</span>
                          <p className="text-[10px] text-muted-foreground">
                            Raum erstellen
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {searchResults.people.length > 0 && (
                  <div>
                    <Separator className="my-2" />
                    <p className="px-3 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Kontakte
                    </p>
                    {searchResults.people.map((person) => (
                      <button
                        key={person.id}
                        className="w-full flex items-center space-x-3 p-3 rounded-lg text-left hover:bg-muted"
                        onClick={() =>
                          handleCreateRoom(person.name, "direct", [person.id])
                        }
                      >
                        <Avatar className="h-10 w-10 border">
                          <AvatarFallback>
                            {person.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 truncate">
                          <span className="text-sm font-medium">
                            {person.name}
                          </span>
                          <p className="text-[10px] text-muted-foreground">
                            {person.role}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col bg-background relative overflow-hidden">
        {selectedRoom ? (
          <>
            {/* Header */}
            <header className="h-16 border-b flex items-center justify-between px-4 bg-background/80 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center space-x-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setShowSidebar(true)}
                >
                  <MessageCircle className="h-5 w-5" />
                </Button>
                <div>
                  <h3 className="font-bold leading-none">
                    {selectedRoom.name}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedRoom.type === "project"
                      ? "Projektgruppe"
                      : "Direkt-Chat"}{" "}
                    • {selectedRoom.participants.length} Personen
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Video className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6 mx-1" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </header>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-[url('/grid.svg')] bg-repeat">
              <div className="max-w-4xl mx-auto space-y-8">
                {messages.map((msg, i) => {
                  const isOwn = msg.senderId === currentUserId;
                  const showHeader =
                    i === 0 || messages[i - 1].senderId !== msg.senderId;

                  return (
                    <div
                      key={msg.id}
                      className={`flex ${
                        isOwn ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`flex flex-col space-y-1 max-w-[85%] md:max-w-[70%] ${
                          isOwn ? "items-end" : "items-start"
                        }`}
                      >
                        {showHeader && (
                          <span className="text-[10px] font-medium text-muted-foreground mx-1">
                            {isOwn ? "Sie" : msg.senderName} •{" "}
                            {formatTimestamp(msg.timestamp)}
                          </span>
                        )}
                        <div
                          className={`px-4 py-2.5 rounded-2xl shadow-sm ${
                            isOwn
                              ? "bg-primary text-primary-foreground rounded-tr-none"
                              : "bg-muted border rounded-tl-none"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap">
                            {msg.content}
                          </p>
                        </div>
                        {isOwn && i === messages.length - 1 && (
                          <span className="flex items-center mt-1">
                            {getMessageStatusIcon(msg.status)}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {typingUsers.length > 0 && (
                  <div className="flex items-center space-x-2 animate-pulse">
                    <div className="flex space-x-1">
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-xs text-muted-foreground italic">
                      {typingUsers.map((u) => u.userName).join(", ")}{" "}
                      schreibt...
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <footer className="p-4 border-t bg-background">
              <div className="max-w-4xl mx-auto relative group">
                <Textarea
                  value={messageInput}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onKeyDown={handleKeyPress}
                  placeholder="Antworten..."
                  className="min-h-[50px] pr-20 rounded-2xl resize-none shadow-inner border-muted group-focus-within:border-primary transition-all"
                />
                <div className="absolute right-2 bottom-2 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-primary"
                  >
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    className="h-8 w-8 rounded-xl"
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </footer>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8 bg-muted/10">
            <div className="text-center space-y-4 max-w-sm">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
                <MessageCircle className="h-10 w-10 text-primary" />
              </div>
              <h4 className="text-xl font-bold">Willkommen beim Chat</h4>
              <p className="text-sm text-muted-foreground">
                Suchen Sie nach einem Projekt, einem Teammitglied oder einem
                bestehenden Raum, um eine Unterhaltung zu beginnen.
              </p>
              <Button onClick={() => setShowNewRoomDialog(true)}>
                Neuen Raum erstellen
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* New Room Dialog */}
      <Dialog open={showNewRoomDialog} onOpenChange={setShowNewRoomDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Neuen Chat beginnen</DialogTitle>
            <DialogDescription>
              Wählen Sie eine Projektgruppe oder einen direkten Kontakt.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="projects" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="projects">Projekte</TabsTrigger>
              <TabsTrigger value="people">Mitarbeiter</TabsTrigger>
              <TabsTrigger value="group">Gruppe</TabsTrigger>
            </TabsList>

            <TabsContent value="projects" className="mt-4">
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-1">
                  {availableProjects.map((p) => (
                    <button
                      key={p.id}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center justify-between"
                      onClick={() =>
                        handleCreateRoom(
                          `Projekt: ${p.name}`,
                          "project",
                          [],
                          p.id
                        )
                      }
                    >
                      <span className="text-sm font-medium">{p.name}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {p.status}
                      </Badge>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="people" className="mt-4">
              <ScrollArea className="h-[300px] border rounded-md p-2">
                <div className="space-y-1">
                  {availableEmployees.map((e) => (
                    <button
                      key={e.id}
                      className="w-full text-left px-3 py-2 rounded-md hover:bg-muted flex items-center space-x-3"
                      onClick={() => handleCreateRoom(e.name, "direct", [e.id])}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="text-xs">
                          {e.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">{e.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {e.role}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="group" className="mt-4 space-y-4">
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Geben Sie Ihrer Gruppe einen Namen
                </p>
                <Input
                  placeholder="Team-Name..."
                  value={newRoomName}
                  onChange={(e) => setNewRoomName(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                onClick={() => handleCreateRoom(newRoomName, "group")}
              >
                Gruppe erstellen
              </Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default ChatInterface;
