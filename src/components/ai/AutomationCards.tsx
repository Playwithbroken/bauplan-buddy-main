import React from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Calendar, Bell, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  automationService,
  AutomationSuggestion,
} from "@/services/automationService";
import { useToast } from "@/hooks/use-toast";

interface AutomationCardsProps {
  suggestions: AutomationSuggestion[];
  onActionComplete?: (suggestionId: string) => void;
}

export const AutomationCards: React.FC<AutomationCardsProps> = ({
  suggestions,
  onActionComplete,
}) => {
  const { toast } = useToast();

  const handleExecute = async (
    suggestion: AutomationSuggestion,
    actionId: string
  ) => {
    const action = suggestion.actions.find((a) => a.id === actionId);
    if (!action) return;

    toast({
      title: "Executing Automation",
      description: `Running: ${action.label}...`,
    });

    const success = await automationService.executeAction(action);

    if (success) {
      toast({
        title: "Automation Complete",
        description: `Successfully executed: ${action.label}`,
        variant: "default",
      });
      onActionComplete?.(suggestion.id);
    } else {
      toast({
        title: "Execution Failed",
        description: "Could not complete the requested action.",
        variant: "destructive",
      });
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "email":
        return Mail;
      case "task":
        return Calendar;
      case "notification":
        return Bell;
      default:
        return Zap;
    }
  };

  if (suggestions.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Zap className="w-5 h-5 text-yellow-500" />
        <h3 className="text-lg font-semibold">Suggested Automations</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {suggestions.map((suggestion, index) => (
          <motion.div
            key={suggestion.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="border-l-4 border-l-yellow-500 bg-gradient-to-br from-card to-yellow-500/5 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-base">
                    {suggestion.title}
                  </CardTitle>
                  <Badge variant="outline" className="bg-background/50">
                    Auto-Suggest
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Based on recent insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {suggestion.actions.map((action) => {
                    const Icon = getIcon(action.type);
                    return (
                      <div
                        key={action.id}
                        className="flex items-center justify-between p-2 rounded-lg bg-background/50 border border-border/50 group hover:border-yellow-500/30 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400">
                            <Icon className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {action.label}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {action.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleExecute(suggestion, action.id)}
                        >
                          Run <ArrowRight className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
