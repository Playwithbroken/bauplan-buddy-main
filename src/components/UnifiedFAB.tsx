/**
 * Unified Floating Action Button (FAB)
 * Combines AI Chat, Team Chat, and Theme Toggle in one expandable menu
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  X,
  MessageCircle,
  Sparkles,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface FABAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
  show?: boolean;
}

interface UnifiedFABProps {
  onOpenAIChat?: () => void;
  onOpenTeamChat?: () => void;
}

export function UnifiedFAB({ onOpenAIChat, onOpenTeamChat }: UnifiedFABProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { theme, setTheme, isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();

  const handleThemeToggle = () => {
    const newTheme = isDarkMode ? "light" : "dark";
    setTheme(newTheme);
    toast({
      title: "Theme geändert",
      description:
        newTheme === "dark"
          ? "Dunkler Modus aktiviert"
          : "Heller Modus aktiviert",
      duration: 1500,
    });
    setIsExpanded(false);
  };

  const handleAIChat = () => {
    onOpenAIChat?.();
    setIsExpanded(false);
  };

  const handleTeamChat = () => {
    onOpenTeamChat?.();
    setIsExpanded(false);
  };

  const actions: FABAction[] = [
    {
      id: "theme",
      label: isDarkMode ? "Hell" : "Dunkel",
      icon: isDarkMode ? (
        <Sun className="w-5 h-5" />
      ) : (
        <Moon className="w-5 h-5" />
      ),
      onClick: handleThemeToggle,
      show: true,
    },
    {
      id: "ai-chat",
      label: "KI-Assistent",
      icon: <Sparkles className="w-5 h-5" />,
      onClick: handleAIChat,
      show: true,
    },
    {
      id: "team-chat",
      label: "Team-Chat",
      icon: <MessageCircle className="w-5 h-5" />,
      onClick: handleTeamChat,
      show: isAuthenticated,
    },
  ].filter((action) => action.show !== false);

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Action Buttons */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-20 right-0 flex flex-col gap-3 items-end"
          >
            {actions.map((action, index) => (
              <motion.div
                key={action.id}
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  scale: 1,
                  transition: { delay: index * 0.05 },
                }}
                exit={{
                  opacity: 0,
                  y: 10,
                  scale: 0.8,
                  transition: { delay: (actions.length - index - 1) * 0.05 },
                }}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="lg"
                      variant="outline"
                      onClick={action.onClick}
                      className={cn(
                        "h-14 w-14 rounded-full shadow-lg",
                        "bg-card/95 backdrop-blur-sm",
                        "hover:scale-110 transition-transform duration-200",
                        "border-2 border-border/50"
                      )}
                      aria-label={action.label}
                    >
                      {action.icon}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="left">{action.label}</TooltipContent>
                </Tooltip>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main FAB Button */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="lg"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "h-16 w-16 rounded-full shadow-2xl",
              "bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600",
              "hover:scale-110 active:scale-95",
              "transition-all duration-300",
              "border-2 border-white/20"
            )}
            aria-label={isExpanded ? "Menü schließen" : "Menü öffnen"}
          >
            <motion.div
              animate={{ rotate: isExpanded ? 45 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {isExpanded ? (
                <X className="w-6 h-6 text-white" />
              ) : (
                <Plus className="w-6 h-6 text-white" />
              )}
            </motion.div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          {isExpanded ? "Schließen" : "Aktionen"}
        </TooltipContent>
      </Tooltip>
    </div>
  );
}

export default UnifiedFAB;
