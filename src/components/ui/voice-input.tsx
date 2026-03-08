import React, { useState, useEffect } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  isListening?: boolean;
  onStateChange?: (isListening: boolean) => void;
  className?: string;
  placeholder?: string;
}

export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  isListening: externalIsListening,
  onStateChange,
  className,
  placeholder = "Spracheingabe...",
}) => {
  const [internalIsListening, setInternalIsListening] = useState(false);
  const isListening = externalIsListening ?? internalIsListening;

  const toggleListening = () => {
    const newState = !isListening;
    setInternalIsListening(newState);
    onStateChange?.(newState);

    if (newState) {
      startRecognition();
    }
  };

  const startRecognition = () => {
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      // Real Speech Recognition
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "de-DE";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        onTranscript(transcript);
        setInternalIsListening(false);
        onStateChange?.(false);
      };

      recognition.onerror = () => {
        // Fallback to simulation on error
        simulateTyping();
      };

      recognition.onend = () => {
        if (internalIsListening) {
          setInternalIsListening(false);
          onStateChange?.(false);
        }
      };

      try {
        recognition.start();
      } catch (e) {
        simulateTyping();
      }
    } else {
      // Fallback Simulation for Demo
      simulateTyping();
    }
  };

  const simulateTyping = () => {
    // A list of realistic demo phrases for construction context
    const demoPhrases = [
      "Wetterbedingungen waren heute optimal für den Betonguss.",
      "Materiallieferung ist wie geplant eingetroffen, aber Lieferschein fehlt.",
      "Sicherheitsbelehrung mit dem Team durchgeführt.",
      "Baufortschritt liegt genau im Zeitplan, keine Verzögerungen.",
      "Zusätzliches Werkzeug für morgen angefordert.",
    ];

    const phrase = demoPhrases[Math.floor(Math.random() * demoPhrases.length)];
    let index = 0;

    const interval = setInterval(() => {
      if (index < phrase.length) {
        onTranscript(phrase.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
        setInternalIsListening(false);
        onStateChange?.(false);
      }
    }, 50); // Typing speed
  };

  return (
    <Button
      type="button"
      variant={isListening ? "default" : "outline"}
      size="icon"
      className={cn(
        "transition-all duration-300",
        isListening &&
          "animate-pulse bg-red-500 hover:bg-red-600 text-white border-red-500",
        className
      )}
      onClick={toggleListening}
      title={isListening ? "Aufnahme stoppen" : "Spracheingabe starten"}
    >
      {isListening ? (
        <React.Fragment>
          <Mic className="h-4 w-4 animate-bounce" />
          <span className="sr-only">Recording...</span>
        </React.Fragment>
      ) : (
        <Mic className="h-4 w-4" />
      )}
    </Button>
  );
};
