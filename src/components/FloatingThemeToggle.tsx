import React from 'react';
import { Moon, Sun, Monitor, Contrast, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useTheme } from '@/hooks/useTheme';
import { useToast } from '@/hooks/use-toast';

export function FloatingThemeToggle() {
  const {
    theme,
    baseTheme,
    effectiveTheme,
    setTheme,
    isDarkMode,
    isHighContrast,
    setHighContrast,
    toggleHighContrast,
  } = useTheme();
  const { toast } = useToast();
  const [open, setOpen] = React.useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = React.useState(false);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const updatePreference = () => setPrefersReducedMotion(mediaQuery.matches);
    updatePreference();
    mediaQuery.addEventListener('change', updatePreference);
    return () => mediaQuery.removeEventListener('change', updatePreference);
  }, []);

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);

    const descriptionMap: Record<typeof newTheme, string> = {
      light: 'Heller Modus aktiviert',
      dark: 'Dunkler Modus aktiviert',
      system: 'Systemmodus aktiviert',
    };

    toast({
      title: 'Theme geaendert',
      description: descriptionMap[newTheme],
      duration: 1800,
    });
  };

  const handleHighContrastToggle = () => {
    const nextState = !isHighContrast;
    if (nextState) {
      toggleHighContrast();
    } else {
      setHighContrast(false);
    }

    toast({
      title: 'Kontrastmodus',
      description: nextState ? 'Hoher Kontrast aktiviert' : 'Hoher Kontrast deaktiviert',
      duration: 1500,
    });
  };

  const getIcon = () => {
    if (isHighContrast) {
      return <Contrast className="h-5 w-5" />;
    }

    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
      default:
        return isDarkMode ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />;
    }
  };

  const getButtonClass = () => {
    if (isHighContrast) {
      return 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] border-[hsl(var(--border))] hover:bg-[hsl(var(--primary)/0.9)]';
    }

    return 'bg-card/95 text-foreground hover:bg-accent/60 hover:text-accent-foreground dark:bg-card/90';
  };

  const baseShadow = isHighContrast ? 'shadow-layered-md' : 'shadow-layered-lg';
  const motionClasses = prefersReducedMotion
    ? `${baseShadow} transition-opacity duration-150 ease-out hover:opacity-90 focus-visible:opacity-100`
    : `${baseShadow} transition-transform duration-150 ease-out hover:-translate-y-[1px] focus-visible:translate-y-0`;

  const isActiveTheme = (mode: 'light' | 'dark' | 'system') => {
    if (isHighContrast) return false;
    if (baseTheme === mode) return true;
    // When baseTheme is system, mirror the effective theme so the check matches what the user sees
    if (baseTheme === 'system' && effectiveTheme === mode) return true;
    return false;
  };

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <Tooltip open={open ? false : undefined}>
        <TooltipTrigger asChild>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="lg"
              className={`fixed bottom-6 right-24 z-50 h-14 w-14 rounded-full focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 ${motionClasses} ${getButtonClass()}`}
              aria-label="Theme-Einstellungen oeffnen"
            >
              {getIcon()}
            </Button>
          </DropdownMenuTrigger>
        </TooltipTrigger>
        <TooltipContent side="top" align="center">
          Erscheinungsbild anpassen
        </TooltipContent>
      </Tooltip>
      <DropdownMenuContent
        align="end"
        className="w-56 rounded-[calc(var(--radius)*1.1)] border border-border bg-card shadow-layered-lg"
        aria-label="Theme-Einstellungen"
      >
        <DropdownMenuLabel>Erscheinungsbild</DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => handleThemeChange('light')} className="cursor-pointer">
          <Sun className="mr-2 h-4 w-4" />
          <span>Hell</span>
          {isActiveTheme('light') && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleThemeChange('dark')} className="cursor-pointer">
          <Moon className="mr-2 h-4 w-4" />
          <span>Dunkel</span>
          {isActiveTheme('dark') && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => handleThemeChange('system')} className="cursor-pointer">
          <Monitor className="mr-2 h-4 w-4" />
          <span>System</span>
          {isActiveTheme('system') && <Check className="ml-auto h-4 w-4" />}
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={handleHighContrastToggle} className="cursor-pointer">
          <Contrast className="mr-2 h-4 w-4" />
          <span>Hoher Kontrast</span>
          {isHighContrast && (
            <div className="ml-auto flex items-center gap-1 text-xs text-muted-foreground">
              <Check className="h-4 w-4" />
              <span>{effectiveTheme === 'dark' ? 'Dunkel' : 'Hell'}</span>
            </div>
          )}
        </DropdownMenuItem>

        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          WCAG AAA Konformitaet
        </DropdownMenuLabel>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default FloatingThemeToggle;
