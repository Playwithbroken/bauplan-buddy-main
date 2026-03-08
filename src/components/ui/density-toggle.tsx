import * as React from 'react';
import { Monitor, Smartphone } from 'lucide-react';
import { Button } from './button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './dropdown-menu';
import { cn } from '@/lib/utils';
import densityService, { type DensityMode } from '@/services/densityService';

interface DensityToggleProps {
  className?: string;
}

/**
 * Density Mode Toggle Component
 * Allows users to switch between comfortable and compact display modes
 * Comfortable: Better for mobile, touch interfaces, and accessibility
 * Compact: Better for desktop, shows more data at once
 */
export function DensityToggle({ className }: DensityToggleProps) {
  const [mode, setMode] = React.useState<DensityMode>(densityService.getDensityMode());

  React.useEffect(() => {
    const handleDensityChange = (e: CustomEvent<{ mode: DensityMode }>) => {
      setMode(e.detail.mode);
    };

    window.addEventListener('densitychange', handleDensityChange as EventListener);
    return () => {
      window.removeEventListener('densitychange', handleDensityChange as EventListener);
    };
  }, []);

  const handleModeChange = (newMode: DensityMode) => {
    densityService.setDensityMode(newMode);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant=\"ghost\"
          size=\"sm\"
          className={cn(
            'h-9 w-9 px-0 min-h-[36px]',
            className
          )}
          aria-label=\"Ansichtsdichte ändern\"
        >
          {mode === 'comfortable' ? (
            <Smartphone className=\"h-4 w-4\" aria-hidden=\"true\" />
          ) : (
            <Monitor className=\"h-4 w-4\" aria-hidden=\"true\" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align=\"end\">
        <DropdownMenuItem
          onClick={() => handleModeChange('comfortable')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            mode === 'comfortable' && 'bg-accent'
          )}
        >
          <Smartphone className=\"h-4 w-4\" aria-hidden=\"true\" />
          <div className=\"flex flex-col\">
            <span className=\"font-medium\">Komfortabel</span>
            <span className=\"text-xs text-muted-foreground\">
              Größere Abstände, besser für Touch
            </span>
          </div>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => handleModeChange('compact')}
          className={cn(
            'flex items-center gap-2 cursor-pointer',
            mode === 'compact' && 'bg-accent'
          )}
        >
          <Monitor className=\"h-4 w-4\" aria-hidden=\"true\" />
          <div className=\"flex flex-col\">
            <span className=\"font-medium\">Kompakt</span>
            <span className=\"text-xs text-muted-foreground\">
              Mehr Informationen auf einen Blick
            </span>
          </div>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Hook to use density mode in components
 */
export function useDensityMode() {
  const [mode, setMode] = React.useState<DensityMode>(densityService.getDensityMode());

  React.useEffect(() => {
    const handleDensityChange = (e: CustomEvent<{ mode: DensityMode }>) => {
      setMode(e.detail.mode);
    };

    window.addEventListener('densitychange', handleDensityChange as EventListener);
    return () => {
      window.removeEventListener('densitychange', handleDensityChange as EventListener);
    };
  }, []);

  return {
    mode,
    isComfortable: mode === 'comfortable',
    isCompact: mode === 'compact',
    setMode: densityService.setDensityMode,
    toggle: densityService.toggleDensity,
    config: densityService.DENSITY_CONFIG[mode],
  };
}
