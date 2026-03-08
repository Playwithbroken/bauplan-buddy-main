import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface MobileFABProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

/**
 * Mobile Floating Action Button
 * Primary action button fixed at bottom right
 */
export function MobileFAB({ onClick, label = 'Erstellen', className }: MobileFABProps) {
  return (
    <Button
      onClick={onClick}
      size="lg"
      className={cn(
        'md:hidden fixed bottom-20 right-4 z-40 h-14 rounded-full shadow-lg',
        'hover:scale-110 active:scale-95 transition-transform',
        'safe-area-bottom',
        className
      )}
    >
      <Plus className="h-5 w-5 mr-2" />
      {label}
    </Button>
  );
}
