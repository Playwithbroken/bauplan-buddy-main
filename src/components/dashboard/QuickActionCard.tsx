import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";

interface QuickActionCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  color?: "blue" | "green" | "purple" | "orange" | "red";
  onClick: () => void;
  badge?: string;
  shortcut?: string;
}

export function QuickActionCard({
  title,
  description,
  icon: Icon,
  color = "blue",
  onClick,
  badge,
  shortcut,
}: QuickActionCardProps) {
  const colorClasses = {
    blue: "bg-blue-100 text-blue-600 hover:bg-blue-200",
    green: "bg-green-100 text-green-600 hover:bg-green-200",
    purple: "bg-purple-100 text-purple-600 hover:bg-purple-200",
    orange: "bg-orange-100 text-orange-600 hover:bg-orange-200",
    red: "bg-red-100 text-red-600 hover:bg-red-200",
  };

  return (
    <Card
      className="hover:shadow-lg transition-all cursor-pointer group"
      onClick={onClick}
    >
      <CardContent className="pt-6">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`rounded-lg p-3 ${colorClasses[color]} transition-colors`}
          >
            <Icon className="h-6 w-6" />
          </div>
          {badge && (
            <Badge variant="secondary" className="text-xs">
              {badge}
            </Badge>
          )}
        </div>
        <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            className="px-0 hover:bg-transparent"
          >
            Jetzt starten →
          </Button>
          {shortcut && (
            <kbd className="px-2 py-1 text-xs bg-muted rounded border">
              {shortcut}
            </kbd>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
