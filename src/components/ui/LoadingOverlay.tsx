import React from "react";
import { Loader2, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

interface LoadingOverlayProps {
  message?: string;
  progress?: number;
  canCancel?: boolean;
  onCancel?: () => void;
}

export function LoadingOverlay({
  message = "Laden...",
  progress,
  canCancel = false,
  onCancel,
}: LoadingOverlayProps) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-card border rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <div className="text-center space-y-2 w-full">
            <h3 className="font-semibold text-lg">{message}</h3>
            {progress !== undefined && (
              <div className="space-y-2">
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">
                  {Math.round(progress)}% abgeschlossen
                </p>
              </div>
            )}
          </div>
          {canCancel && onCancel && (
            <Button variant="outline" size="sm" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Abbrechen
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
