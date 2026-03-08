import React, { useState, useEffect, useCallback } from "react";
import { Mic, MicOff, Command, Sparkles, Loader2 } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useVoiceCommands } from "@/hooks/useVoiceCommands";
import { toast } from "sonner";

interface VoiceActionInputProps {
  onAction?: (action: string) => void;
  className?: string;
  autoStart?: boolean;
}

export function VoiceActionInput({
  onAction,
  className,
  autoStart = false,
}: VoiceActionInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognitionInstance = new SpeechRecognition();
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = "de-DE";

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setTranscript("");
      };

      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcriptText = event.results[current][0].transcript;
        setTranscript(transcriptText);
      };

      recognitionInstance.onend = () => {
        setIsListening(false);
        if (transcript.trim()) {
          handleProcessAction(transcript);
        }
      };

      recognitionInstance.onerror = (event: any) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
        toast.error("Spracherkennung fehlgeschlagen: " + event.error);
      };

      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech recognition not supported in this browser.");
    }

    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, [transcript]);

  const toggleListening = useCallback(() => {
    if (!recognition) {
      toast.error("Spracherkennung wird von Ihrem Browser nicht unterstützt.");
      return;
    }

    if (isListening) {
      recognition.stop();
    } else {
      try {
        recognition.start();
      } catch (e) {
        console.error("Failed to start recognition:", e);
      }
    }
  }, [recognition, isListening]);

  const { processCommand } = useVoiceCommands();

  const handleProcessAction = async (text: string) => {
    setIsProcessing(true);
    console.log("Analyzing voice action:", text);

    // Kleiner Delay für visuelles Feedback
    await new Promise((resolve) => setTimeout(resolve, 800));

    const result = processCommand(text);

    if (result) {
      toast.success(result, {
        icon: <Sparkles className="h-4 w-4 text-purple-500" />,
      });
    } else {
      if (onAction) onAction(text);
      toast.info(`Verarbeitet: "${text}"`);
    }

    setIsProcessing(false);
    setTranscript("");
  };

  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div
        className={cn(
          "flex-1 flex items-center gap-3 px-4 py-2 bg-background border rounded-full transition-all duration-300",
          isListening
            ? "border-purple-500 ring-4 ring-purple-500/10 scale-105 shadow-lg"
            : "border-border shadow-sm",
          isProcessing && "opacity-50 pointer-events-none"
        )}
      >
        <Command className="w-4 h-4 text-muted-foreground" />
        <span
          className={cn(
            "text-sm overflow-hidden whitespace-nowrap text-ellipsis",
            !transcript && "text-muted-foreground"
          )}
        >
          {isListening
            ? transcript || "Ich höre zu..."
            : isProcessing
            ? "Verarbeite..."
            : "Sprachbefehl geben..."}
        </span>

        {isListening && (
          <div className="flex gap-1 ml-auto">
            <span
              className="w-1 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "0ms" }}
            />
            <span
              className="w-1 h-4 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "150ms" }}
            />
            <span
              className="w-1 h-3 bg-purple-500 rounded-full animate-bounce"
              style={{ animationDelay: "300ms" }}
            />
          </div>
        )}
      </div>

      <Button
        variant={isListening ? "destructive" : "default"}
        size="icon"
        className={cn(
          "rounded-full transition-all duration-300",
          isListening ? "scale-110 shadow-lg" : "hover:scale-110"
        )}
        onClick={toggleListening}
        disabled={isProcessing}
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : isListening ? (
          <MicOff className="h-5 w-5" />
        ) : (
          <Mic className="h-5 w-5" />
        )}
      </Button>
    </div>
  );
}
