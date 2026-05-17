import * as React from "react";
import { Monitor, Smartphone } from "lucide-react";
import { Button } from "./button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./dropdown-menu";
import { cn } from "@/lib/utils";
import densityService, { type DensityMode } from "@/services/densityService";

interface DensityToggleProps {
  className?: string;
}

export function DensityToggle({ className }: DensityToggleProps) {
  const [mode, setMode] = React.useState<DensityMode>(
    densityService.getDensityMode(),
  );

  React.useEffect(() => {
    const handleDensityChange = (event: CustomEvent<{ mode: DensityMode }>) => {
      setMode(event.detail.mode);
    };

    window.addEventListener(
      "densitychange",
      handleDensityChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "densitychange",
        handleDensityChange as EventListener,
      );
    };
  }, []);

  const handleModeChange = (newMode: DensityMode) => {
    densityService.setDensityMode(newMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn("h-9 w-9 min-h-[36px] px-0", className)}
          aria-label="Ansichtsdichte aendern"
        >
          {mode === "comfortable" ? (
            <Smartphone className="h-4 w-4" aria-hidden="true" />
          ) : (
            <Monitor className="h-4 w-4" aria-hidden="true" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => handleModeChange("comfortable")}
          className={cn(
            "flex cursor-pointer items-center gap-2",
            mode === "comfortable" && "bg-accent",
          )}
        >
          <Smartphone className="h-4 w-4" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-medium">Komfortabel</span>
            <span className="text-xs text-muted-foreground">
              Groessere Abstaende, besser fuer Touch
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleModeChange("compact")}
          className={cn(
            "flex cursor-pointer items-center gap-2",
            mode === "compact" && "bg-accent",
          )}
        >
          <Monitor className="h-4 w-4" aria-hidden="true" />
          <div className="flex flex-col">
            <span className="font-medium">Kompakt</span>
            <span className="text-xs text-muted-foreground">
              Mehr Informationen auf einen Blick
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function useDensityMode() {
  const [mode, setMode] = React.useState<DensityMode>(
    densityService.getDensityMode(),
  );

  React.useEffect(() => {
    const handleDensityChange = (event: CustomEvent<{ mode: DensityMode }>) => {
      setMode(event.detail.mode);
    };

    window.addEventListener(
      "densitychange",
      handleDensityChange as EventListener,
    );
    return () => {
      window.removeEventListener(
        "densitychange",
        handleDensityChange as EventListener,
      );
    };
  }, []);

  return {
    mode,
    isComfortable: mode === "comfortable",
    isCompact: mode === "compact",
    setMode: densityService.setDensityMode,
    toggle: densityService.toggleDensity,
    config: densityService.DENSITY_CONFIG[mode],
  };
}
