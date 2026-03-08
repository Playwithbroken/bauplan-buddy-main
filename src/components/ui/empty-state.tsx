import { LucideIcon } from 'lucide-react';
import { Button } from './button';
import { cn } from '@/lib/utils';

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: EmptyStateAction;
  secondaryAction?: EmptyStateAction;
  helpLink?: {
    label: string;
    href: string;
  };
  illustration?: React.ReactNode;
  className?: string;
}

/**
 * Universal Empty State Component
 * Shows when no data is available with clear guidance and actions
 * Follows design system principles: clear next steps, helpful guidance, accessible
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  helpLink,
  illustration,
  className,
}: EmptyStateProps) {
  const ActionIcon = action?.icon;
  const SecondaryIcon = secondaryAction?.icon;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        'animate-fade-up',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {/* Illustration or Icon */}
      {illustration || (
        Icon && (
          <div className="mb-6 rounded-full bg-muted/50 p-8 backdrop-blur-sm">
            <Icon 
              className="h-16 w-16 text-muted-foreground" 
              aria-hidden="true"
            />
          </div>
        )
      )}
      
      {/* Title - clear and concise */}
      <h3 className="text-2xl font-semibold text-foreground mb-3 max-w-lg">
        {title}
      </h3>
      
      {/* Description - brief guidance */}
      {description && (
        <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
          {description}
        </p>
      )}
      
      {/* Actions - clear CTAs */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
        {action && (
          <Button 
            onClick={action.onClick} 
            size="lg"
            variant={action.variant}
            className="min-w-[160px] min-h-[44px]"
          >
            {ActionIcon && <ActionIcon className="mr-2 h-4 w-4" />}
            {action.label}
          </Button>
        )}
        
        {secondaryAction && (
          <Button 
            onClick={secondaryAction.onClick} 
            size="lg"
            variant={secondaryAction.variant || 'outline'}
            className="min-w-[160px] min-h-[44px]"
          >
            {SecondaryIcon && <SecondaryIcon className="mr-2 h-4 w-4" />}
            {secondaryAction.label}
          </Button>
        )}
      </div>
      
      {/* Help link */}
      {helpLink && (
        <a
          href={helpLink.href}
          className="mt-6 text-sm text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded-sm"
          target="_blank"
          rel="noopener noreferrer"
        >
          {helpLink.label}
        </a>
      )}
    </div>
  );
}

/**
 * Compact Empty State for smaller areas
 */
export function EmptyStateCompact({
  icon: Icon,
  title,
  description,
  className,
}: Omit<EmptyStateProps, 'action'>) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
    >
      {Icon && (
        <Icon className="h-8 w-8 text-muted-foreground mb-2" />
      )}
      
      <p className="text-sm font-medium text-foreground">
        {title}
      </p>
      
      {description && (
        <p className="text-xs text-muted-foreground mt-1">
          {description}
        </p>
      )}
    </div>
  );
}
