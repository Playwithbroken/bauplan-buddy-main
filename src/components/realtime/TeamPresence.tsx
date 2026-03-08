/**
 * Team Presence Indicator
 * Shows who's online in real-time
 */

import { useState, useEffect } from 'react';
import { useWebSocket } from '@/hooks/useWebSocket';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Users } from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  status: 'online' | 'offline' | 'typing';
  lastSeen?: Date;
}

export function TeamPresence() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const { subscribe } = useWebSocket({
    userId: 'current-user',
    tenantId: 'current-tenant',
    autoConnect: false,
  });

  useEffect(() => {
    // Subscribe to team member status updates
    const unsubOnline = subscribe('team_member_online', (message) => {
      const { userId, status, name, email, avatar } = message.data;

      setTeamMembers(prev => {
        const existing = prev.find(m => m.id === userId);
        if (existing) {
          return prev.map(m =>
            m.id === userId
              ? { ...m, status, lastSeen: new Date() }
              : m
          );
        } else {
          return [
            ...prev,
            {
              id: userId,
              name: name || 'Unknown User',
              email: email || '',
              avatar,
              status,
              lastSeen: new Date(),
            },
          ];
        }
      });
    });

    const unsubOffline = subscribe('team_member_offline', (message) => {
      const { userId } = message.data;

      setTeamMembers(prev =>
        prev.map(m =>
          m.id === userId
            ? { ...m, status: 'offline', lastSeen: new Date() }
            : m
        )
      );
    });

    return () => {
      unsubOnline();
      unsubOffline();
    };
  }, [subscribe]);

  const onlineMembers = teamMembers.filter(m => m.status === 'online');
  const typingMembers = teamMembers.filter(m => m.status === 'typing');

  if (teamMembers.length === 0) {
    return null;
  }

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2">
        <Users className="h-4 w-4 text-muted-foreground" />
        <div className="flex -space-x-2">
          {onlineMembers.slice(0, 5).map(member => (
            <Tooltip key={member.id}>
              <TooltipTrigger asChild>
                <div className="relative">
                  <Avatar className="h-8 w-8 border-2 border-background">
                    <AvatarImage src={member.avatar} alt={member.name} />
                    <AvatarFallback className="text-xs">
                      {member.name
                        .split(' ')
                        .map(n => n[0])
                        .join('')
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background" />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">{member.email}</p>
                <Badge variant="outline" className="mt-1 text-xs">
                  Online
                </Badge>
              </TooltipContent>
            </Tooltip>
          ))}
          {onlineMembers.length > 5 && (
            <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs font-medium">
              +{onlineMembers.length - 5}
            </div>
          )}
        </div>
        {typingMembers.length > 0 && (
          <Badge variant="secondary" className="text-xs">
            {typingMembers[0].name} tippt...
          </Badge>
        )}
      </div>
    </TooltipProvider>
  );
}
